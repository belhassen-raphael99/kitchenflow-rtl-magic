
# Plan — 4 évolutions Chef / Marzan / Hit Sour

## 1. Renommage : "Reserve / Mela'hit Sour" → "ייצור" (Hit Sour)

Objectif : simplifier la terminologie partout.

- `ReservePage.tsx` : titre `"רזרבה (מלאי הייצור)"` → `"ייצור"`, description courte `"מוצרים מוכנים שיוצרו על ידי המטבח"`.
- `Sidebar.tsx` / `BottomNav.tsx` : libellé du lien → `"ייצור"`.
- Sous-onglets internes : conserver `"מלאי"` (stock prêt) et `"תכנית ייצור"` (plan hebdo) — déjà clairs.
- Aucune migration SQL : on ne touche pas aux noms de tables (`reserve_items` reste interne).

## 2. Marzan (Warehouse) — Import bon de commande fournisseur (PDF / photo)

Objectif : photographier un bon de livraison fournisseur → l'IA lit les lignes → propose une mise à jour automatique du stock.

### UI
- Nouveau bouton sur `WarehousePage.tsx` (à côté de "קליטת סחורה") : **"📸 ייבוא מהזמנת ספק"**.
- Ouvre un dialog `SupplierImportDialog.tsx` avec :
  1. Sélection optionnelle du fournisseur (`suppliers`).
  2. Upload PDF/JPG/PNG (≤ 8 Mo, drag & drop).
  3. Vue de prévisualisation (pages PDF / image).
  4. Bouton "נתח ועדכן מלאי".
  5. Tableau résultat : `[Produit détecté] → [Match warehouse_items proposé] [Quantité] [+ Ajouter / Ignorer]`.
  6. Confirmation finale → applique les mouvements (`stock_movements` + `warehouse_items.quantity += qty`).

### Backend (edge function `parse-supplier-receipt`)
- Reprend la structure de `parse-priority-pdf` (auth, CORS, Lovable AI Gateway).
- Modèle : `google/gemini-2.5-flash` (multimodal).
- Prompt : extraire `{ supplier_name?, items: [{ name, quantity, unit, price? }] }` à partir d'une image/PDF de bon de livraison.
- Côté client : pour chaque ligne, fuzzy-match avec la liste `warehouse_items` (par nom + supplier_id si fourni). Si aucun match : proposer "créer nouveau produit".
- Application du stock : insertion en `stock_movements` (`movement_type='supplier_receipt'`, `reason='Import bon ספק'`) + update `warehouse_items`.

### Sécurité
- Edge function `verify_jwt = false` (par défaut Lovable) + validation explicite du JWT in-code.
- RLS existante sur `warehouse_items` (admin only) → conserve la protection.

## 3. Poste Chef — événements cliquables + reschedule des tâches stock

### 3a. Événements cliquables dans "תכנית היום"
Dans `ChefDashboardPage.tsx`, section "משלוחים היום" :
- Chaque ligne devient `<button>` qui ouvre un nouveau dialog `EventChefDetailDialog.tsx`.
- Le dialog charge `event_items` (jointure `recipes`) groupés par `department` :
  - 🍳 מטבח / 🍞 מאפייה / 🍰 קונדיטוריה
  - Pour chaque ligne : nom plat, quantité, portions, notes, `recipe.servings` de référence.
- Boutons : "צור משימת ייצור" (insère dans `production_tasks` pour aujourd'hui), "סגור".

### 3b. Réorganisation Section B "משימות"
Déjà séparé en deux colonnes (📦 ייצור למלאי / 📋 לאירועים). On clarifie :
- Section "📋 לאירועים" : grouper les tâches par événement (en-tête = nom client + heure). Cliquable → réouvre `EventChefDetailDialog`.
- Section "📦 ייצור למלאי" : ajouter sur chaque carte un menu `⋯` avec :
  - **"📅 דחה לתאריך אחר"** → mini date-picker → met à jour `production_tasks.date` à la date choisie + toast `"נדחה ל־{date}"`.
  - **"❌ בטל היום"** → status `cancelled`.

### 3c. Hook
- Ajouter `rescheduleTask(id, newDate)` dans `useKitchenOps.ts` : `update({ date: newDate, status: 'pending', notes: notes + ' [נדחה מ־' + oldDate + ']' })`.

## 4. Poste Chef — Journal des événements & Pag Tokef

### 4a. Nouvel onglet "📅 יומן אירועים"
Dans `ChefDashboardPage.tsx`, ajouter un onglet de niveau supérieur (avant les départements) :
- KPI en haut :
  - "אירועים השבוע : N" (date entre lundi et dimanche, calcul Israéli — semaine commence dimanche)
  - "אירועים החודש : N"
- Liste des événements de la semaine (par jour) : nom, heure, client, nb invités → cliquable (ouvre `EventChefDetailDialog`).
- Filtre rapide : `[היום] [השבוע] [החודש]`.

### 4b. Panneau Pag Tokef (péremptions)
Nouvelle carte dans `ChefDashboardPage.tsx` (visible sur l'onglet יומן et en bas du dashboard) :
- Source : `reserve_items` où `expiry_date <= today + 7d` ET `quantity > 0`.
- Tri par date d'expiration croissante.
- Couleurs :
  - Rouge : déjà périmé (badge "פג")
  - Orange : ≤ 3 j
  - Jaune : ≤ 7 j
- Action : bouton "סמן כמושמד" (`adjustQuantity(item, 0, 'expired', 'פג תוקף')`).

## Détails techniques

### Fichiers créés
- `supabase/functions/parse-supplier-receipt/index.ts`
- `src/components/warehouse/SupplierImportDialog.tsx`
- `src/components/agenda/EventChefDetailDialog.tsx` (réutilisable)
- `src/components/kitchen/RescheduleTaskDialog.tsx`
- `src/components/kitchen/ExpiringItemsPanel.tsx`
- `src/components/kitchen/WeeklyEventsPanel.tsx`

### Fichiers modifiés
- `src/components/pages/ReservePage.tsx` (rename)
- `src/components/layout/Sidebar.tsx` + `BottomNav.tsx` (rename)
- `src/components/pages/WarehousePage.tsx` (bouton import)
- `src/components/pages/ChefDashboardPage.tsx` (onglet יומן, événements cliquables, panneau Pag Tokef, menu reschedule)
- `src/hooks/useKitchenOps.ts` (`rescheduleTask`)
- `src/hooks/useReserve.ts` (helper `markAsExpired`)

### Aucune migration SQL nécessaire
Toutes les colonnes existent déjà : `production_tasks.date/status/notes`, `reserve_items.expiry_date`, `events.date/time/delivery_time/client_name`, `event_items.department`, `stock_movements`.

### Sécurité
- Nouvelle edge function : auth JWT obligatoire, validation Zod du body (taille PDF, type MIME).
- Mises à jour stock côté client : déjà protégées par RLS admin sur `warehouse_items`.

## Hors-scope (non inclus)
- OCR offline / sans IA.
- Reconnaissance automatique du fournisseur depuis le logo du bon.
- Notifications push pour les péremptions (déjà géré par `check-alerts` cron).

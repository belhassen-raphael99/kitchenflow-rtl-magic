## Objectif

Refondre `ChefDashboardPage` en **un seul dashboard unifié** (zéro onglet top-level qui fait "changer d'écran"). Tout est visible en même temps, organisé en sections, et chaque interaction ouvre un **Dialog pop-up** par-dessus.

## Layout cible (une seule page scrollable)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Header : יום שני · 29/04/2026                  [🖨 הדפס]       │
├─────────────────────────────────────────────────────────────────┤
│  KPI strip (4 cartes compactes)                                 │
│  [סה״כ משימות] [בביצוע] [הושלמו] [% התקדמות + bar]              │
├──────────────────────────┬──────────────────────────────────────┤
│  🏪 מלאי (Stock)          │  🎉 אירועים הקרובים                  │
│  ───────────────────     │  ───────────────────                 │
│  Filtre dept :           │  Filtre : [היום][מחר][השבוע]         │
│  [🍳][🍞][🍰][🥐]         │                                      │
│                          │  ┌─ Card event 1 ─────────────┐      │
│  📋 תכנית היום           │  │ 👤 כהן · מחר 19:00 · 50    │      │
│  · pain — 10/15          │  │ 🍳 5 plats  🍞 3  🍰 2     │      │
│  · gateau — 0/8          │  │ [פתח פרטים]                │      │
│                          │  └─────────────────────────────┘      │
│  ⚡ משימות לביצוע         │  ┌─ Card event 2 ─────────────┐      │
│  · [▶️ התחל] pain x10    │  │ 👤 לוי · ה׳ 12:00 · 80      │      │
│  · [✅ סיים] gateau x8   │  │ ...                         │      │
│                          │  └─────────────────────────────┘      │
│  [🔄 ייצור אוטומטי]      │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│  📅 השבוע במספרים        │  ⚠️ פג תוקף קרוב                    │
│  אירועים : 4 · חודש : 12 │  · חלה — פג בעוד 2 ימים              │
│  Mini-calendar 7 jours   │  · קרם — פג מחר                      │
└─────────────────────────────────────────────────────────────────┘
```

**Tout est sur la même page**. Pas d'onglets `Tabs` top-level qui cachent du contenu. Sur mobile, les colonnes deviennent empilées.

## Comportement des clics → Dialog pop-up

Aucun clic ne navigue. Chaque clic ouvre un **Dialog modal** par-dessus le dashboard :

| Élément cliqué | Dialog ouvert |
|---|---|
| Carte d'événement à venir | `EventChefDetailDialog` (existant) — détails + items par dept |
| Item "תכנית היום" (planning stock) | Mini dialog "פרטי מוצר" : recette, durée vie, notes, qté en stock, bouton "צור משימה" |
| Tâche stock (carte משימה) | Reste inline (start/complete déjà sur la carte) ; menu `⋯` ouvre `RescheduleTaskDialog` (existant) |
| Item "פג תוקף" | Confirm dialog "סמן כמושמד ?" |
| KPI "השבוע במספרים" | `EventChefDetailDialog`-like : liste cliquable des événements de la semaine, chacun ouvre son propre dialog |

→ L'utilisateur reste **toujours sur le dashboard**. Les pop-ups se ferment et il retrouve sa vue.

## Sections détaillées

### 1. Header compact
Titre date + jour hébreu + bouton imprimer. Pas de description superflue.

### 2. KPI strip (4 cartes)
Identique à l'existant mais **toujours visible** (pas dans un onglet).

### 3. Colonne gauche — 🏪 מלאי
- Filtre département en haut (icônes + badge compteur, comme actuel).
- **תכנית היום** : items `storage_type='מלאי'` du dept actif. Cliquables → mini-dialog produit.
- **משימות לביצוע** : tâches `task_type='stock'` du dept actif. Cartes avec progress + boutons inline (`▶️ התחל`, `✅ סיים`). Menu `⋯` → reschedule/cancel.
- Bouton **🔄 ייצור אוטומטי** en bas de colonne.

### 4. Colonne droite — 🎉 אירועים הקרובים
- Filtre temporel : `[היום] [מחר] [השבוע]` (défaut : השבוע, semaine israélienne dim→sam).
- Liste de **cartes événements** triées par date+heure :
  - Header carte : nom client, date relative ("מחר", "ה׳ 02/05"), heure de livraison, badge nb invités.
  - Body : compteur compact par département (🍳 5 · 🍞 3 · 🍰 2) + barre de progression globale (tâches event complétées / total).
  - Footer : bouton **"פתח פרטים"** → `EventChefDetailDialog`.
- Carte cliquable en entier ouvre le même dialog.
- État vide stylé : "אין אירועים בתקופה זו".

### 5. Bandeau bas — Stats hebdo + Pag Tokef
Deux cartes côte à côte (sur mobile : empilées) :
- **📅 השבוע במספרים** : 2 KPI (semaine / mois) + mini-liste cliquable des prochains événements (3 max, "הצג הכל" ouvre dialog liste).
- **⚠️ פג תוקף קרוב** : `ExpiringItemsPanel` existant intégré directement (pas dans un onglet).

## Détails techniques

### Fichiers modifiés
- `src/components/pages/ChefDashboardPage.tsx` — suppression des `Tabs` top-level (`topTab`), passage à un layout `grid grid-cols-1 lg:grid-cols-2 gap-6`. Toutes les sections rendues simultanément. Conservation de la logique département (`activeDept`) à l'intérieur de la colonne stock uniquement.

### Fichiers nouveaux
- `src/components/kitchen/UpcomingEventsCard.tsx` — composant carte d'événement à venir (header client/date, compteurs dept, progress, bouton détails).
- `src/components/kitchen/UpcomingEventsColumn.tsx` — wrapper colonne droite : filtre temporel + map des `UpcomingEventsCard` + ouverture dialog.
- `src/components/kitchen/StockPlanItemDialog.tsx` — mini-dialog "פרטי מוצר" pour les items du planning stock (notes, durée vie, stock actuel, bouton "צור משימה").
- `src/components/kitchen/WeeklyMiniStatsCard.tsx` — version compacte de `WeeklyEventsPanel` (sans onglet, juste 2 KPI + liste courte).

### Fichiers conservés tels quels
- `EventChefDetailDialog.tsx`, `RescheduleTaskDialog.tsx`, `ExpiringItemsPanel.tsx` — réutilisés directement.
- `WeeklyEventsPanel.tsx` — peut rester pour usage futur ou être supprimé (zero-dead-code → suppression si plus appelé nulle part).

### Données
- Charger en parallèle (`Promise.all`) : `production_tasks` (today), `events` (today → +30j), `event_items` (events à venir, joint avec `recipe`), `production_schedule`, `reserve_items`, `reserve_items` proches expiration. Une seule requête initiale, tout le dashboard se peuple d'un coup.
- Pour chaque événement à venir : compter `event_items` par département + chercher les `production_tasks` associées pour calculer la progression.

### UI/UX
- Aucune navigation interne (pas de `Tabs` top-level, pas de `Link`).
- Tous les `Dialog` utilisent shadcn `Dialog` (overlay sombre, fermeture ESC/clic-outside).
- Coins 12px (cards) / 8px (mini-éléments) — règle projet.
- RTL conservé partout, heures en LTR avec `tabular-nums`, dates parsées avec `T00:00:00`.
- Responsive : `lg:grid-cols-2` pour les 2 colonnes principales, empilé sous lg.

### Hors-scope
- Pas de migration SQL.
- Pas de modification de `EventWizard` ni création d'événements depuis le dashboard chef.
- Pas de nouvelles notifications.

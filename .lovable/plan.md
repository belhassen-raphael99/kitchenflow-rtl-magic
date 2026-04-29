
# Poste Chef — Tâches d'événements + déduction auto du Marsan

## Objectif

Le chef ouvre son dashboard le matin et voit clairement, **par département**, **toutes les choses à préparer pour les événements du jour** (ex: "Mini tartelettes pour famille Cohen × 50"), à côté des tâches de stock (Itour) déjà existantes. Quand il clique "Sיימתי" (terminé), les ingrédients utilisés (selon la recette) sont **déduits automatiquement du Marsan**, exactement comme c'est déjà le cas pour les tâches de stock.

Tout part de la réserve / du Marsan : c'est le principe directeur.

---

## 1. UX — Comment ça se présente sur le dashboard chef

La grille principale reste : **Stock à gauche** | **Événements à droite**. On ajoute une **3e zone "אירועים — לבצע היום"** (Événements — à préparer aujourd'hui) directement sous le bandeau des livraisons, en pleine largeur, avant la grille Stock/Events.

```text
┌─────────────────────────────────────────────────────┐
│  KPIs (4 cartes)                                    │
├─────────────────────────────────────────────────────┤
│  🚚 משלוחים היום (bandeau livraisons)               │
├─────────────────────────────────────────────────────┤
│  🎉 הכנות לאירועי היום   [צור משימות מאירועים]    │ ← NOUVEAU
│  ┌───────────────┬───────────────┬───────────────┐  │
│  │ מטבח (5)      │ מאפייה (3)    │ קונד׳ (2)     │  │
│  │ ─ Mini tartes │ ─ Pain hallah │ ─ Carrot cake │  │
│  │   ×50 [▶️]    │   ×3 [✅]     │   ×2 [▶️]    │  │
│  │ ─ Houmous     │ ...           │ ...           │  │
│  │   ×2kg [⏳]   │               │               │  │
│  │ + famille Cohen badge sur chaque carte        │  │
│  └───────────────┴───────────────┴───────────────┘  │
├──────────────────────────┬──────────────────────────┤
│  📦 מלאי (existant)      │  🎉 אירועים הקרובים     │
└──────────────────────────┴──────────────────────────┘
```

Détails visuels de chaque carte tâche-événement :
- **En-tête** : nom du plat + badge cliquable du client/événement (`👰 משפחת כהן · 19:30`)
- **Quantité cible** : `×50 מנות` (recalculé : `event_items.quantity × event_items.servings`)
- **Recette liée** : petit lien "פתח מתכון" si `recipe_id` existe
- **Boutons** : `התחל` → `סיימתי` (mêmes que tâches stock)
- **Bordure colorée** par département (vert מטבח / orange מאפייה / rose קונד׳)
- **État `completed`** : carte se compresse comme pour les tâches stock

Au clic sur le badge client, le `EventChefDetailDialog` actuel s'ouvre (déjà existant).

---

## 2. Génération des tâches depuis les événements

### Bouton "צור משימות מאירועים" (en haut de la nouvelle zone)
Pour chaque événement du jour (status ≠ cancelled), pour chaque `event_item` :
- Crée une `production_tasks` avec :
  - `task_type = 'event'`
  - `event_id` = id de l'événement
  - `recipe_id` = recette liée (si présent dans `event_items.recipe_id`)
  - `name` = `event_items.name`
  - `target_quantity` = `quantity × servings` (1 si null)
  - `department` = `event_items.department` (mapper si besoin vers les 4 valeurs du dashboard)
  - `priority` = 5 (plus haute que stock pour qu'elles remontent)
  - `notes` = `אירוע: <client_name> · <heure>`
- **Anti-doublon** : skip si une tâche existe déjà avec même `(date, event_id, name)`.

### Génération automatique
Étendre `handleGenerateFromSchedule` (ou nouveau bouton dédié) pour faire les deux passes : stock + events. Idéalement, exécution automatique au premier chargement du jour (ex: si aucune tâche `event` n'existe pour aujourd'hui et qu'il y a des événements, propose un toast "Generate"). Pour rester sobre : **bouton manuel** au début, on automatisera plus tard si besoin.

---

## 3. Déduction automatique du Marsan (Itour des matières premières)

Cette logique **existe déjà** dans `handleCompleteTask` lignes 158-193 (`ChefDashboardPage.tsx`) pour les tâches qui ont un `recipe_id`. Elle :
1. Lit `recipe_ingredients` pour la recette
2. Pour chaque ingrédient avec `warehouse_item_id`, calcule `deduction = ingredient.quantity × target_quantity`
3. Décrémente `warehouse_items.quantity` (jamais en négatif)
4. Crée une notification `low_stock` si on passe sous le `min_stock`

**Ce qu'il faut ajouter** pour que ça fonctionne correctement aussi pour les tâches d'événements :
- **Mise à l'échelle par "servings de la recette"** : actuellement le code multiplie par `target_quantity` brut. Or `recipe_ingredients.quantity` est exprimée pour `recipes.servings` portions. Correction : `deduction = ingredient.quantity × (target_quantity / recipe.servings)`.
- **Traçabilité** : insérer un `stock_movements` (`item_type='warehouse'`, `movement_type='consume'`, `task_id`, `event_id`, `reason='ייצור משימה'`) pour chaque déduction → permettra audits + futurs rapports.
- **Garde-fou stock insuffisant** : si `wItem.quantity < deduction`, créer une notification `severity='critical'` mais laisser la déduction se faire (clamp à 0). Le chef est alerté qu'il faut acheter en urgence.
- **Recettes imbriquées (assembly)** : si la recette est de type `assembly_type='הרכבה'` ou `'שניהם'` et qu'elle référence un `reserve_item` (sous-recette déjà préparée), on déduit aussi du `reserve_items`. Phase 2 si le code n'est pas déjà prêt — on documentera.

---

## 4. Détails techniques

**Aucune migration SQL nécessaire** — `production_tasks` a déjà tous les champs requis (`task_type='event'`, `event_id`, `recipe_id`, `priority`, `notes`).

### Fichiers à modifier
- **`src/components/pages/ChefDashboardPage.tsx`**
  - Nouvelle section JSX "הכנות לאירועי היום" entre le bandeau livraisons et la grille principale.
  - Nouvelle fonction `handleGenerateEventTasks()` (ou fusion dans le bouton existant).
  - Corriger `handleCompleteTask` : récupérer `recipe.servings` avant calcul, diviser par lui.
  - Insérer un `stock_movements` pour chaque déduction (audit).
  - Filtrer/grouper `tasks.filter(t => t.task_type === 'event')` par département pour la nouvelle zone.

- **Nouveau composant** `src/components/kitchen/EventTaskCard.tsx` — variante de la carte stock avec badge client et lien event detail. Réutilise les boutons `התחל`/`סיימתי` (mêmes handlers).

- **Nouveau composant** `src/components/kitchen/EventTasksSection.tsx` — la zone 3-colonnes (par département) avec bouton "Générer".

### Pas de changement
- `src/integrations/supabase/types.ts` (auto-généré, schema inchangé)
- Edge functions
- RLS (déjà ouvertes en update aux admins + demo)

---

## 5. Hors-périmètre (à confirmer pour plus tard)

- **Notifications matinales automatiques** pour les événements du jour (similaire à `check-alerts` pour les reports) → peut être ajouté en phase 2.
- **Bouton "Reporter"** (`דחה`) sur tâches d'événements : techniquement on ne peut pas reporter au-delà de la date de l'événement. Pour l'instant, **pas de bouton reporter** sur les event-tasks (uniquement sur les stock-tasks comme actuellement).
- **Ajustement manuel** des quantités cuisinées (ex: chef a fait 52 au lieu de 50) → pour le moment on prend `target_quantity` au clic "סיימתי". Phase 2 : input numérique avant validation.

---

## Résumé des actions à exécuter (ordre)

1. Refactor `handleCompleteTask` pour diviser par `recipe.servings` + insérer `stock_movements`.
2. Ajouter `handleGenerateEventTasks()` (lit events du jour → crée tasks `task_type='event'`).
3. Créer `EventTaskCard.tsx` (carte avec badge client cliquable).
4. Créer `EventTasksSection.tsx` (groupé par département + bouton générer).
5. Insérer la nouvelle section dans `ChefDashboardPage.tsx`.
6. Toast de confirmation après génération + après complétion (avec liste des décréments).

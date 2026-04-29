## Objectif

Appliquer le même format **tuiles compactes en grille** (déjà utilisé pour `הכנות לאירועי היום`) à la section **משימות לביצוע — מלאי** dans le dashboard chef. Plus de scroll vertical : tout tient à l'écran, on appuie sur "סיימתי", la tuile disparaît.

## État actuel

La section "משימות לביצוע" du département actif affiche les tâches `task_type='stock'` via `renderTaskCard()` — chaque carte fait toute la largeur (~100px de haut), ce qui force un long scroll quand il y a 10–20 tâches.

```text
Aujourd'hui :              Cible :
┌──────────────────┐      ┌────┬────┬────┬────┬────┐
│ Pain hallah ×3   │      │Pain│Hou-│Tar-│Sou-│... │
│ [התחל] [דחה][⋮] │      │×3  │×2kg│×50 │×1L │    │
├──────────────────┤  →   │[▶] │[▶] │[✓] │[▶] │    │
│ Houmous ×2kg     │      └────┴────┴────┴────┴────┘
│ [התחל] [דחה][⋮] │      (grille dense, complétées disparaissent)
└──────────────────┘
```

## Approche

Réutiliser le pattern de `EventTaskCard` / `EventTasksSection` :
- Une nouvelle tuile compacte pour les tâches de stock.
- Tâches `completed` filtrées (n'apparaissent plus — le compteur `X/Y` reste visible en en-tête).
- Grille responsive : `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`.
- Garder les actions essentielles : **התחל**, **סיימתי**, et un menu compact (⋮) pour **דחה** (reporter) et **בטל** — ce sont des actions stock-spécifiques absentes des event-tasks.

## Modifications

### 1. Nouveau composant `src/components/kitchen/StockTaskTile.tsx`
Tuile compacte calquée sur `EventTaskCard.tsx` :
- En-tête : nom de la tâche (2 lignes max, `line-clamp-2`), quantité cible (`×3 ק״ג`).
- Si `rescheduled_from` : petit badge orange "נדחה".
- Si `notes` non vide : petite icône info au survol (tooltip), pas affiché en clair pour rester compact.
- Si `in-progress` : ring bleu + petite barre de progression fine.
- Boutons :
  - `pending` → bouton plein largeur **התחל**
  - `in-progress` → bouton plein largeur **סיימתי** (vert primary)
  - Menu kebab (⋮) en haut à droite → דחה (ouvre `RescheduleTaskDialog` existant), בטל
- Tuile masquée si `status === 'completed' || 'cancelled'`.

### 2. Modifs dans `src/components/pages/ChefDashboardPage.tsx`

Dans le bloc "Tasks to do" (lignes ~881–911) :
- Remplacer `deptStockTasks.map(renderTaskCard)` par une grille de `<StockTaskTile />`.
- Calculer `activeStockTasks = deptStockTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')`.
- Afficher dans l'en-tête le compteur `completed/total` (badge `X/Y`) comme dans `EventTasksSection`.
- Si toutes les tâches sont terminées → message "🎉 כל המשימות הושלמו!" (comme côté events).
- `renderTaskCard` peut être conservé pour l'instant ou supprimé si plus aucun appelant — vérifier qu'il n'est utilisé que là.

### 3. Pas de changement
- Logique de `handleStartTask`, `handleCompleteTask`, `handleCancelTask`, `setRescheduleTask` : inchangée, on passe juste les handlers à la tuile.
- Filtre par département (boutons en haut) : inchangé.
- Carte "תכנית היום" au-dessus : inchangée.

## Hors-périmètre

- Ne touche pas au composant `ProductionTaskCard.tsx` (utilisé ailleurs hypothétiquement, à garder).
- Pas de changement à la vue "אירועים" (déjà en tuiles).
- Pas de modification SQL ni d'edge functions.

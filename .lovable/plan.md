## Objectif

Sur le Dashboard Chef → colonne **מלאי (Itour)**, permettre au chef de **reporter facilement une tâche** à un autre jour, et garantir qu'**il sera rappelé** ce jour-là (dans le dashboard ET dans les notifications/alertes), en plus des tâches normales du jour.

## Constat actuel

- La fonction "דחה לתאריך אחר" existe déjà mais elle est cachée dans un menu `⋮` peu visible.
- Aucune trace n'est conservée qu'une tâche a été **reportée** (juste une note texte).
- Aucune notification n'est générée le jour J du report.
- Le dashboard ne distingue pas visuellement les tâches reportées des tâches normales du jour.

## Plan en 3 parties

### 1. Bouton "Déplacer" visible sur chaque tâche Itour

Dans `ChefDashboardPage.tsx` → `renderTaskCard` (uniquement pour les tâches `task_type === 'stock'`) :
- Sortir l'action **"דחה"** (Reporter) du menu `⋮` et la mettre comme bouton secondaire visible à côté de "התחל" / "סיימתי".
- Icône `CalendarClock` + libellé court "דחה" (variant outline).
- Le menu `⋮` ne garde plus que "בטל היום".
- Le `RescheduleTaskDialog` existant (déjà branché) reste utilisé tel quel.

### 2. Marquer une tâche comme "reportée" (base de données)

Migration SQL légère sur `production_tasks` :
- Ajouter `rescheduled_from date NULL` (date d'origine du report).
- Ajouter `original_date date NULL` (première date prévue, conservée même après plusieurs reports).
- Ajouter un index sur `(date, status)` pour les requêtes du dashboard.

`handleRescheduleTask` mis à jour pour remplir ces deux colonnes — sans toucher à la logique de `notes` actuelle.

### 3. Rappel le jour du report

**a. Sur le dashboard (colonne Itour) :**
- Quand on charge les tâches du jour, si une tâche a `rescheduled_from IS NOT NULL`, elle s'affiche avec :
  - Un badge orange "↩️ נדחה מ־{date}" en haut de la carte.
  - Une bordure gauche orange pour la distinguer.
  - Triée en premier dans la liste "משימות לביצוע".
- Petit bandeau récapitulatif au-dessus de la liste si ≥1 tâche reportée :
  > "⏰ {N} משימות שנדחו מגיעות היום — אל תשכח!"

**b. Dans les notifications (cloche en haut) :**
- Au moment du report, créer immédiatement une `notifications` row :
  - `type: 'system'`, `severity: 'warning'`
  - `title: "📅 משימה נדחתה"`, `message: "{task.name} — תזכורת תופיע ב־{newDate}"`.
- Étendre `supabase/functions/check-alerts/index.ts` pour ajouter une nouvelle vérification :
  - Récupérer `production_tasks` où `date = today` AND `status = 'pending'` AND `rescheduled_from IS NOT NULL`.
  - Pour chacune, créer une notification `type: 'system'`, `severity: 'warning'` :
    - `title: "🔔 משימה שנדחתה — להיום"`
    - `message: "{task.name} ({qty} {unit}) הייתה אמורה ב־{rescheduled_from}"`
  - Anti-doublon : ne pas recréer si une notif identique existe déjà avec `related_id = task.id` créée dans les dernières 20h.
- Le cron `check-alerts` tourne déjà → rappel généré automatiquement chaque matin.

## Détails techniques

- **Fichiers modifiés :**
  - `src/components/pages/ChefDashboardPage.tsx` (bouton Déplacer visible, badge "reportée", tri, bandeau, insertion notif au moment du report).
  - `supabase/functions/check-alerts/index.ts` (nouveau bloc de vérification).
- **Migration SQL :**
  ```sql
  ALTER TABLE public.production_tasks
    ADD COLUMN IF NOT EXISTS rescheduled_from date,
    ADD COLUMN IF NOT EXISTS original_date date;
  CREATE INDEX IF NOT EXISTS idx_production_tasks_date_status
    ON public.production_tasks(date, status);
  ```
- **Aucun nouveau composant** — tout passe par les composants existants (`RescheduleTaskDialog`, `Badge`, `NotificationBell`).
- **Pas de changement RLS** — les colonnes héritent des policies existantes.

## Hors périmètre

- Pas de récurrence/répétition de tâche.
- Pas de notification push/email — uniquement la cloche in-app (déjà branchée en realtime).
- Pas de modification du flux des tâches d'événement (`task_type === 'event'`) — uniquement Itour/stock.

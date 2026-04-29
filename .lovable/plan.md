## Problème identifié

Le chef voit la liste des plats d'un événement (via `EventChefDetailDialog`), mais il manque le cœur du métier :
- Quelles **quantités exactes d'ingrédients** sont nécessaires (en multipliant la recette par le nombre de couverts)
- Ce qu'il a **déjà en stock** (réserve produits finis + entrepôt matières premières)
- Ce qui **manque** pour réaliser l'événement
- Une **alerte critique** si stock insuffisant (sur dashboard chef ET dashboard manager)

## Plan d'implémentation

### 1. Refonte du `EventChefDetailDialog` — Vue "Mise en production"

Pour chaque événement ouvert depuis le dashboard chef, afficher 3 sections :

**A. En-tête (existant + résumé)**
- Client, heure, nombre de couverts (`guests`)
- Nouveau : badge global de **statut de faisabilité** : `✅ Tout en stock` / `⚠️ Manques partiels` / `🚨 Critique`
- Compte à rebours jusqu'à l'heure de livraison

**B. Plats à préparer (par département)**
Pour chaque `event_item`, calculer et afficher :
- Quantité commandée × multiplicateur de recette (basé sur `recipe.servings` vs `event.guests` ou `item.quantity`)
- Statut stock du **plat fini** (vérification dans `reserve_items` par nom/recipe_id)
  - Si stock fini suffisant → `✅ Disponible (X en réserve)` → 1 clic "Sortir du stock"
  - Sinon → `À produire : Y unités`
- Bouton "Créer tâche de production" → insère dans `production_tasks` (task_type='event')

**C. Liste de courses ingrédients (agrégée)**
- Parcourir tous les `event_items` → leurs `recipes` → `recipe_ingredients`
- Multiplier chaque ingrédient par : `(quantity_commandée / recipe.servings)` ou par le batch nécessaire
- Agréger les ingrédients identiques entre plusieurs plats
- Croiser avec `warehouse_items.quantity` :
  - `✅ OK` (stock ≥ besoin)
  - `⚠️ Limite` (stock < besoin × 1.2)
  - `🚨 Manque` (stock < besoin) → afficher quantité manquante en rouge
- Bouton "Ajouter manques à liste de courses" → insère dans `purchase_lists`

### 2. Pop-up d'alerte critique sur le Dashboard Chef

Au chargement du `ChefDashboardPage`, exécuter une vérification pré-calculée :
- Pour tous les événements de `today + tomorrow`, calculer le besoin total en matières premières
- Si un ou plusieurs ingrédients sont à 0 ou très faibles (< 50% du besoin) → afficher un **`AlertDialog` modal bloquant** au démarrage avec :
  - Titre : "🚨 התראה: מלאי קריטי"
  - Liste des ingrédients manquants par événement
  - Boutons : "צפה בפרטים" (ouvre le `EventChefDetailDialog` concerné) / "סגור"
- Stocker le dernier "vu" dans `localStorage` pour ne pas réouvrir à chaque refresh (sauf nouveau manque détecté)

### 3. Bandeau d'alerte permanent (haut du dashboard chef)

Sous le `PageHeader`, ajouter une bande rouge/orange quand des manques existent :
- `🚨 3 ingrédients critiques pour les événements aujourd'hui` → cliquable → ouvre dialogue récap

### 4. Notifications côté Manager

Lors du calcul des manques (étape 2), insérer dans `notifications` (avec `user_id = NULL` pour broadcast admins) :
- `type: 'critical_stock_for_event'`
- `severity: 'critical'`
- `message: "Manque X kg de Y pour l'événement Z (livraison 16h)"`
- `related_table: 'events'`, `related_id: event.id`

Le `NotificationBell` du manager affichera ces alertes en temps réel (cloche rouge animée).

### 5. Nouveau bouton "Préparer cet événement" sur les `UpcomingEventsCard`

Un raccourci direct qui :
1. Ouvre le dialogue détaillé
2. Génère automatiquement les `production_tasks` (type='event') pour tous les plats nécessitant production
3. Bascule la vue sur ces tâches dans la colonne stock/production

### 6. Nouveau hook `useEventProduction(eventId)`

Centralise toute la logique :
```ts
{
  items: EventItemEnriched[],     // plats + recipe + stock_fini
  ingredients: IngredientNeed[],  // agrégés + croisés warehouse
  feasibility: 'ok'|'partial'|'critical',
  missingCount: number,
  createTasksForAll: () => Promise<void>,
  addMissingToPurchaseList: () => Promise<void>,
}
```

### 7. Diagramme du flux

```text
ChefDashboard chargé
       │
       ▼
[fetchEvents today/tomorrow] ─→ [pour chaque event: calcul besoins]
       │                              │
       │                              ▼
       │                     [croisement warehouse_items]
       │                              │
       │                       manques détectés?
       │                              │
       │                    ┌─────────┴─────────┐
       │                    ▼                   ▼
       │              POP-UP modal       Bandeau rouge
       │              + notif admins     permanent
       ▼
[Click "Préparer"] ──► Dialog enrichi (3 sections)
       │
       ▼
[Boutons: créer tâches / sortir stock / liste courses]
```

## Détails techniques

**Tables utilisées (pas de schéma à modifier) :**
- `events`, `event_items` — déjà existant
- `recipes` (servings, total_weight_x1/x2/x3) — pour le scaling
- `recipe_ingredients` (warehouse_item_id, quantity, unit) — pour le calcul matières
- `warehouse_items` (quantity, min_stock, name) — pour vérif stock matières
- `reserve_items` (quantity, name, recipe_id) — pour vérif stock plats finis
- `production_tasks` — création des tâches type='event'
- `notifications` — alertes manager
- `purchase_lists` — ajout des manques

**Logique de scaling recette :**
```ts
// Pour un event_item :
//   batchMultiplier = ceil(item.quantity / recipe.servings)
// Pour chaque ingrédient de la recette :
//   needed = ingredient.quantity * batchMultiplier
// Agréger par warehouse_item_id à travers tous les event_items
```

**Composants à créer :**
- `src/hooks/useEventProduction.ts` — logique centrale
- `src/components/kitchen/EventProductionDialog.tsx` — remplace/étend `EventChefDetailDialog` (conservation du nom existant pour ne pas casser, on enrichit)
- `src/components/kitchen/IngredientNeedsList.tsx` — sous-composant section C
- `src/components/kitchen/CriticalStockAlertDialog.tsx` — pop-up modal d'alerte au chargement
- `src/components/kitchen/CriticalStockBanner.tsx` — bandeau permanent

**Composants à modifier :**
- `src/components/agenda/EventChefDetailDialog.tsx` — enrichi avec sections B/C et calculs
- `src/components/pages/ChefDashboardPage.tsx` — ajout bandeau + alert dialog au chargement
- `src/components/kitchen/UpcomingEventsCard.tsx` — bouton rapide "Préparer"
- `src/components/notifications/NotificationBell.tsx` — gestion du nouveau type `critical_stock_for_event` (probablement automatique)

**Performance :**
- Charger une seule fois au mount du dashboard : tous les `event_items` + toutes les recipes liées + leurs `recipe_ingredients` + tous les `warehouse_items` concernés (en `IN (...)` sur les ids)
- Mettre en cache dans le state du dashboard pour éviter recalculs

## Résultat attendu

Quand le chef arrive à 5h du matin et qu'un événement est prévu à 16h :
1. Une **pop-up rouge** s'affiche immédiatement s'il manque des ingrédients critiques
2. Il clique "Voir détails" → arrive sur le dialogue enrichi
3. Il voit : "10 personnes → besoin de 2 kg de farine, 500g sucre, 12 œufs..." avec à droite le stock actuel et le manque
4. Il clique "Sortir du stock pour les plats déjà préparés" + "Créer tâches pour le reste"
5. Le manager reçoit une notification "Stock critique : il manque X pour l'événement Cohen 16h"

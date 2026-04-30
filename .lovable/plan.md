## Objectif

Quand le chef clique sur le **nom d'une tuile de tâche d'événement** (ex: "מיני תפוחי אדמה ובטטה") dans le Dashboard Chef, ouvrir une **fenêtre pop-up** affichant la recette complète, avec les **quantités d'ingrédients déjà multipliées** selon le nombre de portions à préparer pour cet événement.

## Comportement attendu

- Clic sur le **titre de la recette** dans la tuile → ouvre un dialog.
- Le dialog affiche :
  - Nom de la recette + département + badge "×N portions pour cet événement".
  - Nom du client / événement + heure de service.
  - Liste des **ingrédients avec quantités automatiquement scalées** (en utilisant `qty_x2` / `qty_x3` du JSONB de la recette si N=2/3, sinon multiplication linéaire — exactement la même logique que `RecipeDetailDialog`).
  - Indicateur de stock insuffisant (rouge) si un ingrédient manque au mahsan.
  - Avertissement de capacité si le poids total dépasse `max_capacity_grams`.
  - Instructions de préparation numérotées.
  - Bouton "סיימתי" / "התחל" intégré pour pouvoir mettre à jour le statut sans fermer.
- Le **clic sur le nom du client** (déjà existant) garde son comportement actuel (ouvre le détail de l'événement). Seul le clic sur le **titre de la recette** déclenche la nouvelle pop-up.

## Implémentation technique

1. **Nouveau composant `src/components/kitchen/EventRecipePreviewDialog.tsx`**
   - Props : `open`, `onOpenChange`, `recipeId`, `portions` (= `target_quantity` de la tâche), `clientName`, `eventTime`, `department`.
   - Charge la recette via `useRecipes().fetchRecipeWithIngredients(recipeId)`.
   - Charge `warehouse_items` pour calculer manques + max portions possibles.
   - Réutilise la logique `getScaledQty` de `RecipeDetailDialog` (gestion `qty_x2` / `qty_x3` / multiplication linéaire).
   - Affiche aussi la durée totale, l'avertissement capacité, les instructions.
   - Pas d'édition d'ingrédient (vue chef en lecture seule).

2. **`EventTaskCard.tsx`**
   - Rendre le **titre `<p>` de la recette** cliquable (`<button>` stylé identiquement) avec un nouveau prop `onClickRecipe`.
   - Garder les boutons "התחל" / "סיימתי" et le clic sur le client séparés (stopPropagation).

3. **`EventTasksSection.tsx`**
   - Ajouter prop `onClickRecipe(task)` et la passer à chaque `EventTaskCard`.

4. **`ChefDashboardPage.tsx`**
   - Ajouter état local `previewTask: EventTaskCardData | null`.
   - Handler `onClickRecipe={(task) => setPreviewTask(task)}`.
   - Monter `<EventRecipePreviewDialog>` ouvert si `previewTask?.recipe_id`, en passant `portions={previewTask.target_quantity}` et les méta de l'événement.
   - Gérer le cas où `recipe_id` est null (tâche libre sans recette liée) → ne rien faire au clic / curseur normal.

## Notes

- Aucune migration DB nécessaire — toutes les données (recipe_id, target_quantity, ingrédients, qty_x2/x3) sont déjà persistées.
- Le dialog est **lecture seule** côté ingrédients : pas de bouton "הוסף מרכיב" ni "חשב עלות" pour le rôle chef.
- Style visuel cohérent avec `RecipeDetailDialog` (header dégradé primary, sections, RTL).

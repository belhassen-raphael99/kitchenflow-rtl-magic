import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Users,
  ChefHat,
  ListOrdered,
  Plus,
  Calculator,
  Loader2,
} from 'lucide-react';
import { Recipe, RecipeIngredient, useRecipes } from '@/hooks/useRecipes';
import { useAuth } from '@/hooks/useAuth';
import { IngredientDialog } from './IngredientDialog';
import { IngredientList } from './IngredientList';
import { cn } from '@/lib/utils';

interface RecipeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string | null;
}

export const RecipeDetailDialog = ({
  open,
  onOpenChange,
  recipeId,
}: RecipeDetailDialogProps) => {
  const { isAdmin } = useAuth();
  const { 
    fetchRecipeWithIngredients, 
    addIngredient, 
    updateIngredient,
    deleteIngredient,
    calculateRecipeCost,
  } = useRecipes();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);

  const loadRecipe = async () => {
    if (!recipeId) return;
    setLoading(true);
    const data = await fetchRecipeWithIngredients(recipeId);
    setRecipe(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && recipeId) {
      loadRecipe();
    } else {
      setRecipe(null);
    }
  }, [open, recipeId]);

  const handleAddIngredient = async (data: any) => {
    if (!recipeId) return;
    await addIngredient(recipeId, data);
    await loadRecipe();
    setIngredientDialogOpen(false);
  };

  const handleEditIngredient = async (data: any) => {
    if (!editingIngredient) return;
    await updateIngredient(editingIngredient.id, data);
    await loadRecipe();
    setEditingIngredient(null);
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    await deleteIngredient(ingredientId);
    await loadRecipe();
  };

  const handleCalculateCost = async () => {
    if (!recipeId) return;
    setCalculating(true);
    await calculateRecipeCost(recipeId);
    await loadRecipe();
    setCalculating(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!recipe) return null;

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-l from-primary to-primary/80 p-6 text-primary-foreground">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-primary-foreground mb-1">
                    {recipe.name}
                  </DialogTitle>
                  <Badge className="bg-white/20 text-primary-foreground border-white/30">
                    {recipe.category}
                  </Badge>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-3xl font-bold">{recipe.servings}</p>
                  <p className="text-sm">מנות</p>
                </div>
              </div>
              
              {recipe.description && (
                <p className="text-primary-foreground/80 mt-2">{recipe.description}</p>
              )}

              <div className="flex gap-3 mt-4">
                {totalTime > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-white/30 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {totalTime} דק׳
                  </Badge>
                )}
                {recipe.cost_per_serving > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-white/30">
                    עלות: ₪{recipe.cost_per_serving.toFixed(2)}
                  </Badge>
                )}
                {recipe.selling_price > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-white/30">
                    מחיר: ₪{recipe.selling_price.toFixed(2)}
                  </Badge>
                )}
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-6 space-y-6">
              {/* Ingredients Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">מרכיבים</h3>
                    {recipe.ingredients && (
                      <Badge variant="secondary">{recipe.ingredients.length}</Badge>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCalculateCost}
                        disabled={calculating}
                      >
                        {calculating ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-1" />
                        ) : (
                          <Calculator className="w-4 h-4 ml-1" />
                        )}
                        חשב עלות
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIngredientDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        הוסף מרכיב
                      </Button>
                    </div>
                  )}
                </div>

                <IngredientList
                  ingredients={recipe.ingredients || []}
                  onEdit={(ing) => setEditingIngredient(ing)}
                  onDelete={handleDeleteIngredient}
                />
              </section>

              {/* Instructions Section */}
              {recipe.instructions && recipe.instructions.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <ListOrdered className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-bold">הוראות הכנה</h3>
                    </div>

                    <div className="space-y-3">
                      {recipe.instructions.map((instruction, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-base leading-relaxed pt-1">{instruction}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Ingredient Dialog */}
      <IngredientDialog
        open={ingredientDialogOpen}
        onOpenChange={setIngredientDialogOpen}
        ingredient={null}
        onSave={handleAddIngredient}
      />

      {/* Edit Ingredient Dialog */}
      <IngredientDialog
        open={!!editingIngredient}
        onOpenChange={(open) => !open && setEditingIngredient(null)}
        ingredient={editingIngredient}
        onSave={handleEditIngredient}
      />
    </>
  );
};

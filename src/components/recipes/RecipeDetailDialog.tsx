import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Clock, Users, ChefHat, ListOrdered, Plus, Calculator, Loader2,
  AlertTriangle, Printer, Package,
} from 'lucide-react';
import { Recipe, RecipeIngredient, useRecipes } from '@/hooks/useRecipes';
import { useAuthContext } from '@/context/AuthContext';
import { IngredientDialog } from './IngredientDialog';
import { IngredientList } from './IngredientList';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RecipeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string | null;
}

interface WarehouseStock {
  id: string;
  name: string;
  quantity: number;
}

export const RecipeDetailDialog = ({
  open, onOpenChange, recipeId,
}: RecipeDetailDialogProps) => {
  const { isAdmin } = useAuthContext();
  const {
    fetchRecipeWithIngredients, addIngredient, updateIngredient,
    deleteIngredient, calculateRecipeCost,
  } = useRecipes();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);
  const [batchMultiplier, setBatchMultiplier] = useState(1);
  const [customMultiplier, setCustomMultiplier] = useState('');
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);

  const loadRecipe = async () => {
    if (!recipeId) return;
    setLoading(true);
    const data = await fetchRecipeWithIngredients(recipeId);
    setRecipe(data);
    // Load warehouse stock for max portions calc
    const { data: stock } = await supabase
      .from('warehouse_items')
      .select('id, name, quantity');
    setWarehouseStock(stock || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && recipeId) {
      loadRecipe();
      setBatchMultiplier(1);
      setCustomMultiplier('');
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

  // Batch scaling: get scaled quantity for an ingredient
  const getScaledQty = (ing: RecipeIngredient, mult: number): number => {
    if (mult === 2 && recipe?.qty_x2) {
      const x2 = recipe.qty_x2;
      if (x2[ing.name]) return x2[ing.name];
    }
    if (mult === 3 && recipe?.qty_x3) {
      const x3 = recipe.qty_x3;
      if (x3[ing.name]) return x3[ing.name];
    }
    return ing.quantity * mult;
  };

  // Calculate max portions based on warehouse stock
  const calcMaxPortions = (): { max: number; limiting: string | null } => {
    if (!recipe?.ingredients?.length) return { max: 0, limiting: null };
    let minPortions = Infinity;
    let limitingIng: string | null = null;

    for (const ing of recipe.ingredients) {
      if (!ing.warehouse_item_id || ing.quantity <= 0) continue;
      const stock = warehouseStock.find(w => w.id === ing.warehouse_item_id);
      if (!stock) continue;
      const portions = Math.floor(stock.quantity / ing.quantity);
      if (portions < minPortions) {
        minPortions = portions;
        limitingIng = ing.name;
      }
    }
    return { max: minPortions === Infinity ? 0 : minPortions, limiting: limitingIng };
  };

  // Check capacity warning
  const getTotalWeight = (): number => {
    if (!recipe?.ingredients) return 0;
    return recipe.ingredients.reduce((sum, ing) => sum + getScaledQty(ing, batchMultiplier), 0);
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
  const maxCap = (recipe as any).max_capacity_grams as number | null;
  const totalWeight = getTotalWeight();
  const exceedsCapacity = maxCap && totalWeight > maxCap;
  const batchesNeeded = maxCap && exceedsCapacity ? Math.ceil(totalWeight / maxCap) : 1;
  const { max: maxPortions, limiting: limitingIngredient } = calcMaxPortions();

  const handleBatchSelect = (mult: number) => {
    setBatchMultiplier(mult);
    setCustomMultiplier('');
  };

  const handleCustomBatch = () => {
    const val = parseFloat(customMultiplier);
    if (val > 0) setBatchMultiplier(val);
  };

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
                  <div className="flex gap-2">
                    <Badge className="bg-white/20 text-primary-foreground border-white/30">
                      {recipe.category}
                    </Badge>
                    {(recipe as any).assembly_type && (recipe as any).assembly_type !== 'מלאי' && (
                      <Badge className="bg-white/20 text-primary-foreground border-white/30">
                        <Package className="w-3 h-3 ml-1" />
                        {(recipe as any).assembly_type}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-center bg-white/20 backdrop-blur-sm rounded-md p-3">
                    <p className="text-3xl font-bold">{recipe.servings}</p>
                    <p className="text-sm">מנות</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20" onClick={() => window.print()}>
                    <Printer className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {recipe.description && (
                <p className="text-primary-foreground/80 mt-2">{recipe.description}</p>
              )}

              <div className="flex gap-3 mt-4 flex-wrap">
                {totalTime > 0 && (
                  <Badge className="bg-white/20 text-primary-foreground border-white/30 flex items-center gap-1">
                    <Clock className="w-4 h-4" />{totalTime} דק׳
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
              {/* Batch Selector */}
              <section className="bg-muted/30 rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm">כמות הכנה</h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 3].map(m => (
                    <Button
                      key={m}
                      size="sm"
                      variant={batchMultiplier === m && !customMultiplier ? 'default' : 'outline'}
                      className="min-w-[48px]"
                      onClick={() => handleBatchSelect(m)}
                    >
                      ×{m}
                    </Button>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="מותאם"
                      value={customMultiplier}
                      onChange={(e) => setCustomMultiplier(e.target.value)}
                      className="w-20 h-8 text-sm"
                      min={0.1}
                      step={0.5}
                    />
                    <Button size="sm" variant="outline" onClick={handleCustomBatch} disabled={!customMultiplier}>
                      ←
                    </Button>
                  </div>
                </div>

                {/* Capacity warning */}
                {maxCap && exceedsCapacity && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 dark:text-amber-300 font-medium">
                        כמות זו עולה על קיבולת המכשיר ({maxCap.toLocaleString()}g)
                      </p>
                      <p className="text-amber-600 dark:text-amber-400 text-xs">
                        מומלץ לחלק ל-{batchesNeeded} הכנות
                      </p>
                    </div>
                  </div>
                )}

                {/* Max portions */}
                {maxPortions > 0 && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    📊 ניתן להכין כרגע: <span className="font-bold text-foreground">{maxPortions}</span> מנות
                    {limitingIngredient && (
                      <span className="text-amber-600"> (מוגבל ע״י: {limitingIngredient})</span>
                    )}
                  </div>
                )}
              </section>

              {/* Ingredients Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">מרכיבים</h3>
                    {recipe.ingredients && <Badge variant="secondary">{recipe.ingredients.length}</Badge>}
                    {batchMultiplier !== 1 && (
                      <Badge variant="outline" className="text-primary border-primary/30">×{batchMultiplier}</Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCalculateCost} disabled={calculating}>
                        {calculating ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Calculator className="w-4 h-4 ml-1" />}
                        חשב עלות
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIngredientDialogOpen(true)}>
                        <Plus className="w-4 h-4 ml-1" />
                        הוסף מרכיב
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scaled ingredient list */}
                {batchMultiplier !== 1 && recipe.ingredients ? (
                  <div className="space-y-1.5">
                    {recipe.ingredients.map((ing) => {
                      const scaledQty = getScaledQty(ing, batchMultiplier);
                      const stock = warehouseStock.find(w => w.id === ing.warehouse_item_id);
                      const insufficient = stock && scaledQty > stock.quantity;
                      return (
                        <div key={ing.id} className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg border text-sm",
                          insufficient ? "bg-red-50 dark:bg-red-950/20 border-red-200" : "bg-muted/30 border-border/30"
                        )}>
                          <span className={cn("font-medium", insufficient && "text-red-700 dark:text-red-400")}>
                            {ing.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold tabular-nums">{scaledQty.toLocaleString()}</span>
                            <span className="text-muted-foreground text-xs">{ing.unit}</span>
                            {insufficient && (
                              <Badge variant="destructive" className="text-[10px] h-5">
                                חסר {Math.ceil(scaledQty - stock.quantity)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <IngredientList
                    ingredients={recipe.ingredients || []}
                    onEdit={(ing) => setEditingIngredient(ing)}
                    onDelete={handleDeleteIngredient}
                  />
                )}
              </section>

              {/* Instructions */}
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
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-md bg-muted/50 border">
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

      <IngredientDialog
        open={ingredientDialogOpen}
        onOpenChange={setIngredientDialogOpen}
        ingredient={null}
        onSave={handleAddIngredient}
      />
      <IngredientDialog
        open={!!editingIngredient}
        onOpenChange={(open) => !open && setEditingIngredient(null)}
        ingredient={editingIngredient}
        onSave={handleEditIngredient}
      />
    </>
  );
};

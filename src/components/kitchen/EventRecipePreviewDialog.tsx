import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock, Users, ChefHat, ListOrdered, Loader2, AlertTriangle, Package,
} from 'lucide-react';
import { Recipe, useRecipes } from '@/hooks/useRecipes';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface WarehouseStock { id: string; name: string; quantity: number; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string | null;
  portions: number;
  recipeName?: string;
  clientName?: string | null;
  eventTime?: string | null;
  department?: string | null;
}

export function EventRecipePreviewDialog({
  open, onOpenChange, recipeId, portions, recipeName, clientName, eventTime, department,
}: Props) {
  const { fetchRecipeWithIngredients } = useRecipes();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);

  useEffect(() => {
    if (!open || !recipeId) { setRecipe(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchRecipeWithIngredients(recipeId);
      const { data: stock } = await supabase
        .from('warehouse_items')
        .select('id, name, quantity');
      if (!cancelled) {
        setRecipe(data);
        setWarehouseStock(stock || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, recipeId]);

  // Multiplicateur = portions à préparer / portions de référence de la recette
  const referenceServings = Math.max(1, recipe?.servings || 1);
  const multiplier = portions / referenceServings;

  const getScaledQty = (ingName: string, baseQty: number): number => {
    // Snap aux tables pré-calculées si on est exactement à ×2 ou ×3
    const isInt = Math.abs(multiplier - Math.round(multiplier)) < 0.001;
    const m = Math.round(multiplier);
    if (isInt && m === 2 && recipe?.qty_x2 && recipe.qty_x2[ingName] != null) {
      return Number(recipe.qty_x2[ingName]);
    }
    if (isInt && m === 3 && recipe?.qty_x3 && recipe.qty_x3[ingName] != null) {
      return Number(recipe.qty_x3[ingName]);
    }
    return baseQty * multiplier;
  };

  const totalTime = ((recipe?.prep_time || 0) + (recipe?.cook_time || 0));
  const maxCap = (recipe as any)?.max_capacity_grams as number | null;
  const totalWeight = (recipe?.ingredients || []).reduce(
    (sum, ing) => sum + getScaledQty(ing.name, ing.quantity), 0
  );
  const exceedsCapacity = !!(maxCap && totalWeight > maxCap);
  const batchesNeeded = maxCap && exceedsCapacity ? Math.ceil(totalWeight / maxCap) : 1;
  const time = (eventTime || '').slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden" dir="rtl">
        {loading || !recipe ? (
          <div className="flex items-center justify-center py-16">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <div className="text-center text-muted-foreground p-6">
                <p className="font-medium">{recipeName || 'מתכון'}</p>
                <p className="text-sm mt-2">אין מתכון מקושר לפריט זה</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-l from-primary to-primary/80 p-5 text-primary-foreground">
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl font-bold text-primary-foreground mb-1">
                      {recipe.name}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-1.5">
                      {department && (
                        <Badge className="bg-white/20 text-primary-foreground border-white/30 text-[11px]">
                          {department}
                        </Badge>
                      )}
                      <Badge className="bg-white/20 text-primary-foreground border-white/30 text-[11px]">
                        {recipe.category}
                      </Badge>
                      {(recipe as any).assembly_type && (recipe as any).assembly_type !== 'מלאי' && (
                        <Badge className="bg-white/20 text-primary-foreground border-white/30 text-[11px]">
                          <Package className="w-3 h-3 ml-1" />
                          {(recipe as any).assembly_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-center bg-white/20 backdrop-blur-sm rounded-md p-2.5 shrink-0">
                    <p className="text-2xl font-bold tabular-nums">×{portions}</p>
                    <p className="text-[10px]">מנות לאירוע</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                  {clientName && (
                    <Badge className="bg-white/20 text-primary-foreground border-white/30">
                      <Users className="w-3 h-3 ml-1" />{clientName}
                    </Badge>
                  )}
                  {time && (
                    <Badge className="bg-white/20 text-primary-foreground border-white/30 tabular-nums" dir="ltr">
                      ⏱ {time}
                    </Badge>
                  )}
                  {totalTime > 0 && (
                    <Badge className="bg-white/20 text-primary-foreground border-white/30">
                      <Clock className="w-3 h-3 ml-1" />{totalTime} דק׳ הכנה
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-primary-foreground border-white/30">
                    מנת בסיס: {referenceServings}
                  </Badge>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="max-h-[65vh]">
              <div className="p-5 space-y-5" dir="rtl">
                {/* Capacity warning */}
                {exceedsCapacity && maxCap && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 dark:text-amber-300 font-medium">
                        כמות זו עולה על קיבולת המכשיר ({maxCap.toLocaleString()}g)
                      </p>
                      <p className="text-amber-600 dark:text-amber-400 text-xs">
                        מומלץ לחלק ל־{batchesNeeded} הכנות
                      </p>
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                      <ChefHat className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <h3 className="text-base font-bold">מרכיבים</h3>
                    {recipe.ingredients && (
                      <Badge variant="secondary" className="text-[10px]">{recipe.ingredients.length}</Badge>
                    )}
                    <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                      ×{multiplier % 1 === 0 ? multiplier : multiplier.toFixed(2)}
                    </Badge>
                  </div>

                  {(!recipe.ingredients || recipe.ingredients.length === 0) ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      אין מרכיבים רשומים למתכון זה
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {recipe.ingredients.map((ing) => {
                        const scaledQty = getScaledQty(ing.name, ing.quantity);
                        const stock = warehouseStock.find(w => w.id === ing.warehouse_item_id);
                        const insufficient = stock && scaledQty > stock.quantity;
                        return (
                          <div key={ing.id} className={cn(
                            "flex items-center justify-between p-2.5 rounded-lg border text-sm",
                            insufficient
                              ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                              : "bg-muted/30 border-border/30"
                          )}>
                            <span className={cn("font-medium", insufficient && "text-red-700 dark:text-red-400")}>
                              {ing.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold tabular-nums">
                                {scaledQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-muted-foreground text-xs">{ing.unit}</span>
                              {insufficient && stock && (
                                <Badge variant="destructive" className="text-[10px] h-5">
                                  חסר {Math.ceil(scaledQty - stock.quantity)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Instructions */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                          <ListOrdered className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <h3 className="text-base font-bold">הוראות הכנה</h3>
                      </div>
                      <div className="space-y-2">
                        {recipe.instructions.map((instruction, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-sm leading-relaxed pt-0.5">{instruction}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

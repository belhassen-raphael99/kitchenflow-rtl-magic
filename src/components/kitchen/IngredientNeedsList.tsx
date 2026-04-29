import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IngredientNeed } from '@/hooks/useEventProduction';

interface Props {
  ingredients: IngredientNeed[];
  missingCount: number;
  onAddToPurchaseList?: () => Promise<void> | void;
}

export function IngredientNeedsList({ ingredients, missingCount, onAddToPurchaseList }: Props) {
  if (ingredients.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4 italic">
        אין צורך בייצור ממלאי גלם — כל המנות זמינות במלאי המוכן
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {ingredients.length} רכיבי גלם · {missingCount > 0 && (
            <span className="text-destructive font-semibold">{missingCount} חסרים</span>
          )}
          {missingCount === 0 && <span className="text-emerald-600 font-semibold">הכל זמין</span>}
        </p>
        {missingCount > 0 && onAddToPurchaseList && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => onAddToPurchaseList()}>
            <ShoppingCart className="w-3.5 h-3.5" />
            הוסף חוסרים לרשימת קניות
          </Button>
        )}
      </div>

      <div className="rounded-lg border divide-y divide-border overflow-hidden">
        {ingredients.map((ing, idx) => {
          const isMissing = ing.status === 'missing';
          const isLimit = ing.status === 'limit';
          return (
            <div
              key={`${ing.warehouse_item_id || ing.name}-${idx}`}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors',
                isMissing && 'bg-destructive/5',
                isLimit && 'bg-amber-50/40 dark:bg-amber-950/10'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isMissing ? (
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                ) : isLimit ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{ing.name}</p>
                  {ing.usedIn.length > 0 && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ing.usedIn.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs tabular-nums">
                <Badge variant="outline" className="text-[10px]">
                  צריך: <span className="font-bold mr-1">{ing.needed}</span> {ing.unit}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    isMissing && 'border-destructive/40 text-destructive',
                    isLimit && 'border-amber-500/40 text-amber-700 dark:text-amber-400',
                    !isMissing && !isLimit && 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                  )}
                >
                  במלאי: <span className="font-bold mr-1">{ing.available}</span>
                </Badge>
                {isMissing && (
                  <Badge variant="destructive" className="text-[10px]">
                    חסר {ing.missing}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

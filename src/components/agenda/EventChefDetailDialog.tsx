import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Clock, MapPin, ChefHat, Plus, CheckCircle2, AlertTriangle, Package, Sparkles } from 'lucide-react';
import { useEventProduction } from '@/hooks/useEventProduction';
import { IngredientNeedsList } from '@/components/kitchen/IngredientNeedsList';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EventLite {
  id: string;
  name: string;
  client_name: string | null;
  date?: string;
  time?: string | null;
  delivery_time?: string | null;
  guests?: number;
  delivery_address?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventLite | null;
}

const deptIcons: Record<string, string> = {
  'מטבח': '🍳',
  'מאפייה': '🍞',
  'קונדיטוריה': '🍰',
  'קונדיטוריה-פטיסרי': '🍰',
  'קונדיטוריה-בצקים': '🥐',
};

export function EventChefDetailDialog({ open, onOpenChange, event }: Props) {
  const { toast } = useToast();
  const prod = useEventProduction(event?.id || null, open);

  const grouped = useMemo(() => {
    return prod.items.reduce<Record<string, typeof prod.items>>((acc, item) => {
      const key = item.department || 'אחר';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [prod.items]);

  if (!event) return null;
  const time = (event.delivery_time || event.time || '').slice(0, 5);

  const feasibilityBadge = (() => {
    if (prod.loading) return null;
    if (prod.feasibility === 'critical') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          חסר קריטי ({prod.missingCriticalCount})
        </Badge>
      );
    }
    if (prod.feasibility === 'partial') {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          חוסרים חלקיים
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        הכל זמין
      </Badge>
    );
  })();

  const handleCreateAll = async () => {
    const n = await prod.createTasksForAllToProduce();
    if (n > 0) toast({ title: `✅ נוצרו ${n} משימות ייצור`, description: 'כל המנות שדורשות ייצור' });
    else toast({ title: 'אין מה ליצור', description: 'כל המנות זמינות במלאי או כבר במשימות' });
  };

  const handleCreateOne = async (it: typeof prod.items[number]) => {
    await prod.createTaskForItem(it);
    toast({ title: '✅ משימה נוצרה', description: `${it.name} (${it.toProduce} מנות)` });
  };

  const handleAddPurchase = async () => {
    await prod.addMissingToPurchaseList();
    toast({ title: '🛒 נוסף לרשימת קניות', description: `${prod.missingCount} פריטים חסרים` });
  };

  const totalToProduce = prod.items.reduce((s, it) => s + it.toProduce, 0);
  const totalAvailable = prod.items.reduce((s, it) => s + Math.min(it.reserveStock, it.quantity), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <DialogTitle className="text-lg flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                {event.client_name || event.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 flex-wrap text-sm pt-1">
                {time && <span className="flex items-center gap-1" dir="ltr"><Clock className="w-3.5 h-3.5" /> {time}</span>}
                {typeof event.guests === 'number' && (
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.guests} סועדים</span>
                )}
                {event.delivery_address && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.delivery_address}</span>
                )}
              </DialogDescription>
            </div>
            <div className="shrink-0">{feasibilityBadge}</div>
          </div>
        </DialogHeader>

        {prod.loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : prod.items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">אין פריטים מוגדרים לאירוע זה</p>
        ) : (
          <div className="space-y-5">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">סה״כ מנות</p>
                <p className="text-xl font-bold tabular-nums">{prod.items.reduce((s, i) => s + i.quantity, 0)}</p>
              </div>
              <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/20 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">במלאי מוכן</p>
                <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{totalAvailable}</p>
              </div>
              <div className={cn(
                "rounded-lg border p-2.5 text-center",
                totalToProduce > 0 ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-500/20" : "bg-muted/30"
              )}>
                <p className="text-[10px] text-muted-foreground">לייצור</p>
                <p className={cn("text-xl font-bold tabular-nums", totalToProduce > 0 && "text-amber-700 dark:text-amber-400")}>{totalToProduce}</p>
              </div>
            </div>

            {/* Action bar */}
            {totalToProduce > 0 && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>צור משימות ייצור עבור כל המנות החסרות</span>
                </div>
                <Button size="sm" className="gap-1.5 h-8" onClick={handleCreateAll}>
                  <Plus className="w-3.5 h-3.5" />
                  צור הכל ({prod.items.filter(i => !i.hasTask && i.toProduce > 0).length})
                </Button>
              </div>
            )}

            {/* Section B: dishes by department */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                מנות להכנה (לפי מחלקה)
              </h3>
              {Object.entries(grouped).map(([dept, deptItems]) => (
                <div key={dept} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 font-semibold text-sm border-b border-border">
                    <span>{deptIcons[dept] || '📦'}</span>
                    <span>{dept}</span>
                    <Badge variant="secondary" className="text-[10px] mr-auto">{deptItems.length}</Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {deptItems.map((it) => {
                      const fullyAvailable = it.toProduce === 0;
                      return (
                        <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate flex items-center gap-1.5">
                              {it.name}
                              {it.hasTask && (
                                <Badge variant="outline" className="text-[9px] h-4 border-blue-500/40 text-blue-600">משימה קיימת</Badge>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              הוזמן: <span className="font-semibold tabular-nums">{it.quantity}</span> ·
                              במלאי: <span className={cn("font-semibold tabular-nums", it.reserveStock > 0 && "text-emerald-600")}>{it.reserveStock}</span>
                              {it.toProduce > 0 && (
                                <> · <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">לייצור: {it.toProduce}</span></>
                              )}
                              {it.recipe_servings && (
                                <> · <span className="text-muted-foreground/70">מתכון ל־{it.recipe_servings} מנות</span></>
                              )}
                            </p>
                            {it.notes && <p className="text-[11px] text-muted-foreground italic truncate mt-0.5">{it.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {fullyAvailable ? (
                              <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> זמין במלאי
                              </Badge>
                            ) : it.hasTask ? (
                              <Badge variant="outline" className="text-[10px]">{it.toProduce} מנות</Badge>
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCreateOne(it)}>
                                <Plus className="w-3 h-3" />
                                צור משימה
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Section C: ingredient needs */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-primary" />
                רכיבי גלם נדרשים
              </h3>
              <IngredientNeedsList
                ingredients={prod.ingredients}
                missingCount={prod.missingCount}
                onAddToPurchaseList={handleAddPurchase}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

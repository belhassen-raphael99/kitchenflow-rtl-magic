import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, AlertTriangle, Plus } from 'lucide-react';

export interface StockPlanItem {
  id: string;
  product_name: string;
  department: string;
  min_quantity: number | null;
  unit: string | null;
  storage_type: string | null;
  shelf_life_label: string | null;
  notes: string | null;
  currentStock: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockPlanItem | null;
  onCreateTask?: (item: StockPlanItem) => Promise<void> | void;
}

export function StockPlanItemDialog({ open, onOpenChange, item, onCreateTask }: Props) {
  if (!item) return null;
  const minQty = item.min_quantity || 0;
  const isLow = minQty > 0 && item.currentStock < minQty;
  const needed = Math.max(0, minQty - item.currentStock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {item.product_name}
          </DialogTitle>
          <DialogDescription>
            {item.department} · {item.storage_type || 'מלאי'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Stock status */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-3 text-center bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">מלאי נוכחי</p>
              <p className="text-2xl font-bold tabular-nums mt-0.5">{item.currentStock}</p>
              <p className="text-[10px] text-muted-foreground">{item.unit || 'יחידה'}</p>
            </div>
            <div className="rounded-lg border p-3 text-center bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">מינימום</p>
              <p className="text-2xl font-bold tabular-nums mt-0.5">{minQty || '—'}</p>
              <p className="text-[10px] text-muted-foreground">{item.unit || 'יחידה'}</p>
            </div>
          </div>

          {isLow && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span>חסרים <span className="font-bold tabular-nums">{needed}</span> {item.unit || 'יחידה'} להשלמה למינימום</span>
            </div>
          )}

          {item.shelf_life_label && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              משך חיים: <Badge variant="outline" className="text-[10px]">{item.shelf_life_label}</Badge>
            </div>
          )}

          {item.notes && (
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {item.notes}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>סגור</Button>
          {onCreateTask && needed > 0 && (
            <Button onClick={async () => { await onCreateTask(item); onOpenChange(false); }} className="gap-1">
              <Plus className="w-4 h-4" />
              צור משימת ייצור ({needed} {item.unit || 'יחידה'})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
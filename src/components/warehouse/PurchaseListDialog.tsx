import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
  price: number;
  supplier_name: string | null;
}

interface PurchaseListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PurchaseListDialog = ({ open, onOpenChange }: PurchaseListDialogProps) => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('warehouse_items')
        .select('id, name, quantity, min_stock, unit, price, suppliers:supplier_id(name)')
        .or('status.eq.low,status.eq.critical');

      const mapped: LowStockItem[] = (data || []).map((d: any) => ({
        id: d.id, name: d.name, quantity: d.quantity, min_stock: d.min_stock,
        unit: d.unit, price: d.price || 0,
        supplier_name: d.suppliers?.name || null,
      }));
      setItems(mapped);
      setSelected(new Set(mapped.map(i => i.id)));
      setLoading(false);
    };
    fetch();
  }, [open]);

  const grouped = useMemo(() => {
    const sel = items.filter(i => selected.has(i.id));
    const map: Record<string, LowStockItem[]> = {};
    sel.forEach(i => {
      const key = i.supplier_name || 'ללא ספק';
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    return map;
  }, [items, selected]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map(i => i.id)));
  const clearAll = () => setSelected(new Set());

  const handleGenerate = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    const selectedItems = items.filter(i => selected.has(i.id));
    const payload = selectedItems.map(i => ({
      item_id: i.id, name: i.name,
      missing_qty: Math.max(0, i.min_stock - i.quantity),
      unit: i.unit, supplier: i.supplier_name, price: i.price,
    }));

    const { error } = await supabase.from('purchase_lists').insert({
      items: payload, notes: `רשימה ידנית — ${selectedItems.length} פריטים`,
    });

    if (error) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '📋 רשימת קניות נוצרה', description: `${selectedItems.length} פריטים מקובצים לפי ספק` });
      onOpenChange(false);
    }
    setGenerating(false);
  };

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            רשימת קניות — מלאי נמוך
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="font-medium">✅ אין פריטים במלאי נמוך</p>
            <p className="text-sm">כל המוצרים מעל רמת המינימום</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>בחר הכל</Button>
              <Button variant="outline" size="sm" onClick={clearAll}>נקה</Button>
              <div className="flex-1" />
              <Badge variant="secondary">{selected.size}/{items.length} נבחרו</Badge>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {items.map(item => {
                const missing = Math.max(0, item.min_stock - item.quantity);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50">
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        חסר: <span className="font-bold text-destructive">{missing}</span> {item.unit}
                        {item.supplier_name && <> | ספק: {item.supplier_name}</>}
                        {item.price > 0 && <> | ₪{item.price}/{item.unit}</>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grouped preview */}
            {selected.size > 0 && (
              <div className="border-t pt-3 space-y-3 print-content">
                <h4 className="font-bold text-sm">תצוגה לפי ספק:</h4>
                {Object.entries(grouped).map(([supplier, sItems]) => (
                  <div key={supplier} className="bg-muted/30 rounded-lg p-3">
                    <p className="font-semibold text-sm mb-1">📦 {supplier}</p>
                    {sItems.map(i => (
                      <p key={i.id} className="text-xs text-muted-foreground mr-4">
                        • {i.name} — {Math.max(0, i.min_stock - i.quantity)} {i.unit}
                        {i.price > 0 && ` (₪${(i.price * Math.max(0, i.min_stock - i.quantity)).toFixed(0)})`}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={handlePrint} className="gap-1">
            <Printer className="w-4 h-4" />
            הדפס
          </Button>
          <Button onClick={handleGenerate} disabled={generating || selected.size === 0} className="gap-1">
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            צור רשימה ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

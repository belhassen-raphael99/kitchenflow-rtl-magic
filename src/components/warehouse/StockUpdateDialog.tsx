import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WarehouseItem } from '@/hooks/useWarehouse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WarehouseItem | null;
  onSuccess: () => void;
}

export function StockUpdateDialog({ open, onOpenChange, item, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [quantityChange, setQuantityChange] = useState(0);
  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add');

  if (!item) return null;

  const calculateNewQuantity = (): number => {
    switch (mode) {
      case 'add':
        return item.quantity + quantityChange;
      case 'subtract':
        return Math.max(0, item.quantity - quantityChange);
      case 'set':
        return quantityChange;
      default:
        return item.quantity;
    }
  };

  const calculateStatus = (quantity: number, minStock: number): string => {
    if (quantity <= 0) return 'critical';
    if (quantity <= minStock) return 'low';
    return 'ok';
  };

  const handleSubmit = async () => {
    const newQuantity = calculateNewQuantity();
    const newStatus = calculateStatus(newQuantity, item.min_stock);

    setLoading(true);
    try {
      const { error } = await supabase
        .from('warehouse_items')
        .update({ quantity: newQuantity, status: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      
      toast({ 
        title: 'הצלחה', 
        description: `המלאי עודכן: ${item.quantity} → ${newQuantity} ${item.unit}` 
      });
      onSuccess();
      onOpenChange(false);
      setQuantityChange(0);
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const newQuantity = calculateNewQuantity();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עדכון מלאי</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">מוצר</p>
            <p className="font-bold text-lg">{item.name}</p>
            <p className="text-sm">
              מלאי נוכחי: <span className="font-bold">{item.quantity}</span> {item.unit}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'add' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('add')}
            >
              <Plus className="w-4 h-4 ml-1" />
              הוספה
            </Button>
            <Button
              type="button"
              variant={mode === 'subtract' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('subtract')}
            >
              <Minus className="w-4 h-4 ml-1" />
              הורדה
            </Button>
            <Button
              type="button"
              variant={mode === 'set' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('set')}
            >
              קביעה
            </Button>
          </div>

          <div>
            <Label htmlFor="quantity">
              {mode === 'add' && 'כמות להוספה'}
              {mode === 'subtract' && 'כמות להורדה'}
              {mode === 'set' && 'כמות חדשה'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantityChange}
              onChange={(e) => setQuantityChange(parseFloat(e.target.value) || 0)}
              className="text-center text-lg font-bold"
            />
          </div>

          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">מלאי חדש</p>
            <p className="text-2xl font-bold text-primary">
              {newQuantity} {item.unit}
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              עדכן מלאי
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

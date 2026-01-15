import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Minus } from 'lucide-react';
import { ReserveItem } from '@/hooks/useReserve';

interface QuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ReserveItem | null;
  mode: 'produce' | 'consume';
  onConfirm: (quantity: number, notes?: string) => Promise<void>;
}

export const QuantityDialog = ({
  open,
  onOpenChange,
  item,
  mode,
  onConfirm,
}: QuantityDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || quantity <= 0) return;

    setLoading(true);
    await onConfirm(quantity, notes || undefined);
    setLoading(false);
    setQuantity(1);
    setNotes('');
    onOpenChange(false);
  };

  if (!item) return null;

  const isProduce = mode === 'produce';
  const newQuantity = isProduce 
    ? item.quantity + quantity 
    : Math.max(0, item.quantity - quantity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isProduce ? (
              <Plus className="w-5 h-5 text-green-600" />
            ) : (
              <Minus className="w-5 h-5 text-orange-600" />
            )}
            {isProduce ? 'ייצור מלאי' : 'צריכת מלאי'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="font-semibold text-lg">{item.name}</p>
            <p className="text-muted-foreground">
              מלאי נוכחי: {item.quantity} {item.unit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">כמות {isProduce ? 'לייצר' : 'לצרוך'}</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={isProduce ? undefined : item.quantity}
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">מלאי חדש:</p>
            <p className="text-2xl font-bold">
              {newQuantity} {item.unit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות (אופציונלי)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isProduce ? 'לדוגמה: הכנה לאירוע' : 'לדוגמה: נצרך לאירוע'}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={loading || quantity <= 0 || (!isProduce && quantity > item.quantity)}
              className={isProduce ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {isProduce ? 'ייצר' : 'צרוך'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

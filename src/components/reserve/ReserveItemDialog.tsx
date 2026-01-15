import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { ReserveItem, ReserveItemFormData, StorageType } from '@/hooks/useReserve';
import { useRecipes } from '@/hooks/useRecipes';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReserveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ReserveItem | null;
  onSave: (data: ReserveItemFormData) => Promise<void>;
}

const STORAGE_TYPES: { value: StorageType; label: string }[] = [
  { value: 'frozen', label: 'הקפאה' },
  { value: 'refrigerated', label: 'קירור' },
  { value: 'ambient', label: 'אחסון רגיל' },
];

const COMMON_UNITS = ['יחידה', 'ק״ג', 'גרם', 'ליטר', 'מ״ל', 'מנה', 'קופסה', 'שקית'];

export const ReserveItemDialog = ({
  open,
  onOpenChange,
  item,
  onSave,
}: ReserveItemDialogProps) => {
  const { recipes } = useRecipes();
  const [loading, setLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState<ReserveItemFormData>({
    name: '',
    recipe_id: undefined,
    storage_type: 'frozen',
    quantity: 0,
    unit: 'יחידה',
    min_stock: 0,
    expiry_date: undefined,
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        recipe_id: item.recipe_id || undefined,
        storage_type: item.storage_type,
        quantity: item.quantity,
        unit: item.unit,
        min_stock: item.min_stock,
        expiry_date: item.expiry_date || undefined,
        location: item.location || '',
        notes: item.notes || '',
      });
      setExpiryDate(item.expiry_date ? new Date(item.expiry_date) : undefined);
    } else {
      setFormData({
        name: '',
        recipe_id: undefined,
        storage_type: 'frozen',
        quantity: 0,
        unit: 'יחידה',
        min_stock: 0,
        expiry_date: undefined,
        location: '',
        notes: '',
      });
      setExpiryDate(undefined);
    }
  }, [item, open]);

  const handleRecipeChange = (recipeId: string) => {
    if (recipeId === 'none') {
      setFormData({ ...formData, recipe_id: undefined });
      return;
    }
    
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setFormData({
        ...formData,
        recipe_id: recipeId,
        name: formData.name || recipe.name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onSave({
      ...formData,
      expiry_date: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : undefined,
    });

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {item ? 'עריכת פריט רזרבה' : 'פריט רזרבה חדש'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to Recipe */}
          <div className="space-y-2">
            <Label>קישור למתכון (אופציונלי)</Label>
            <Select
              value={formData.recipe_id || 'none'}
              onValueChange={handleRecipeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מתכון..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא מתכון</SelectItem>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">שם הפריט *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: קציצות עוף"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג אחסון</Label>
              <Select
                value={formData.storage_type}
                onValueChange={(value: StorageType) => setFormData({ ...formData, storage_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">מיקום</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="לדוגמה: מקפיא 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">כמות התחלתית</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                disabled={!!item} // Can't change quantity directly when editing
              />
            </div>

            <div className="space-y-2">
              <Label>יחידה</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">מלאי מינימלי</Label>
              <Input
                id="min_stock"
                type="number"
                min={0}
                step="0.01"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>תאריך תפוגה</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {item ? 'שמור שינויים' : 'צור פריט'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Link, Unlink } from 'lucide-react';
import { RecipeIngredient, IngredientFormData } from '@/hooks/useRecipes';
import { useWarehouse, WarehouseItem } from '@/hooks/useWarehouse';

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: RecipeIngredient | null;
  onSave: (data: IngredientFormData) => Promise<void>;
}

const COMMON_UNITS = ['גרם', 'ק״ג', 'מ״ל', 'ליטר', 'יחידה', 'כפית', 'כף', 'כוס'];

export const IngredientDialog = ({
  open,
  onOpenChange,
  ingredient,
  onSave,
}: IngredientDialogProps) => {
  const { items: warehouseItems, loading: warehouseLoading } = useWarehouse();
  const [loading, setLoading] = useState(false);
  const [linkToWarehouse, setLinkToWarehouse] = useState(false);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    quantity: 0,
    unit: 'יחידה',
    warehouse_item_id: undefined,
    notes: '',
  });

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        warehouse_item_id: ingredient.warehouse_item_id || undefined,
        notes: ingredient.notes || '',
      });
      setLinkToWarehouse(!!ingredient.warehouse_item_id);
    } else {
      setFormData({
        name: '',
        quantity: 0,
        unit: 'יחידה',
        warehouse_item_id: undefined,
        notes: '',
      });
      setLinkToWarehouse(false);
    }
  }, [ingredient, open]);

  const handleWarehouseItemChange = (itemId: string) => {
    const item = warehouseItems.find(i => i.id === itemId);
    if (item) {
      setFormData({
        ...formData,
        warehouse_item_id: itemId,
        name: item.name,
        unit: item.unit,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onSave({
      ...formData,
      warehouse_item_id: linkToWarehouse ? formData.warehouse_item_id : undefined,
    });

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {ingredient ? 'עריכת מרכיב' : 'הוספת מרכיב'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Link to Warehouse */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={linkToWarehouse ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLinkToWarehouse(!linkToWarehouse)}
              className="gap-2"
            >
              {linkToWarehouse ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
              {linkToWarehouse ? 'מקושר למחסן' : 'קישור למחסן'}
            </Button>
          </div>

          {linkToWarehouse ? (
            <div className="space-y-2">
              <Label>בחר פריט מהמחסן</Label>
              <Select
                value={formData.warehouse_item_id || ''}
                onValueChange={handleWarehouseItemChange}
                disabled={warehouseLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר פריט..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouseItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="name">שם המרכיב *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="לדוגמה: קמח"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">כמות *</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">יחידה</Label>
              {linkToWarehouse ? (
                <Input
                  id="unit"
                  value={formData.unit}
                  disabled
                  className="bg-muted"
                />
              ) : (
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
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!formData.name && !formData.warehouse_item_id)}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {ingredient ? 'שמור' : 'הוסף'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

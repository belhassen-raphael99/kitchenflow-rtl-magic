import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Category, Supplier, WarehouseItem } from '@/hooks/useWarehouse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  suppliers: Supplier[];
  item?: WarehouseItem | null;
  onSuccess: () => void;
}

export function WarehouseItemDialog({
  open,
  onOpenChange,
  categories,
  suppliers,
  item,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    supplier_id: '',
    unit: 'יח\'',
    price: 0,
    quantity: 0,
    min_stock: 5,
    waste_percent: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code || '',
        category_id: item.category_id || '',
        supplier_id: item.supplier_id || '',
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
        min_stock: item.min_stock,
        waste_percent: item.waste_percent,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        category_id: '',
        supplier_id: '',
        unit: 'יח\'',
        price: 0,
        quantity: 0,
        min_stock: 5,
        waste_percent: 0,
      });
    }
  }, [item, open]);

  const calculateStatus = (quantity: number, minStock: number): string => {
    if (quantity <= 0) return 'critical';
    if (quantity <= minStock) return 'low';
    return 'ok';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין שם מוצר', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const status = calculateStatus(formData.quantity, formData.min_stock);
    
    const data = {
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      unit: formData.unit,
      price: formData.price,
      quantity: formData.quantity,
      min_stock: formData.min_stock,
      waste_percent: formData.waste_percent,
      status,
    };

    try {
      if (item) {
        const { error } = await supabase
          .from('warehouse_items')
          .update(data)
          .eq('id', item.id);
        if (error) throw error;
        toast({ title: 'הצלחה', description: 'המוצר עודכן בהצלחה' });
      } else {
        const { error } = await supabase
          .from('warehouse_items')
          .insert(data);
        if (error) throw error;
        toast({ title: 'הצלחה', description: 'המוצר נוסף בהצלחה' });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">
            {item ? 'עריכת מוצר' : 'קליטת סחורה חדשה'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">שם מוצר *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-right"
                placeholder="הכנס שם מוצר"
              />
            </div>

            <div>
              <Label htmlFor="code">קוד מוצר</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="text-right"
                placeholder="אופציונלי"
              />
            </div>

            <div>
              <Label htmlFor="unit">יחידת מידה</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="יח'">יח'</SelectItem>
                  <SelectItem value="ק&quot;ג">ק"ג</SelectItem>
                  <SelectItem value="ג'">ג'</SelectItem>
                  <SelectItem value="ל'">ל'</SelectItem>
                  <SelectItem value="מ&quot;ל">מ"ל</SelectItem>
                  <SelectItem value="קרטון">קרטון</SelectItem>
                  <SelectItem value="מארז">מארז</SelectItem>
                  <SelectItem value="אריזה">אריזה</SelectItem>
                  <SelectItem value="גלון">גלון</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">קטגוריה</Label>
              <Select
                value={formData.category_id}
                onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">ספק</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר ספק" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">כמות במלאי</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="min_stock">כמות מינימום (להתראה)</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                step="0.01"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="price">מחיר</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="waste">אחוז פחת</Label>
              <Input
                id="waste"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.waste_percent}
                onChange={(e) => setFormData({ ...formData, waste_percent: parseFloat(e.target.value) || 0 })}
                className="text-right"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {item ? 'שמור שינויים' : 'הוסף מוצר'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

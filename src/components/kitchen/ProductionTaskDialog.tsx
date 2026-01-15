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
import { Loader2 } from 'lucide-react';
import { ProductionTaskFormData, Department, TaskType } from '@/hooks/useKitchenOps';
import { useRecipes } from '@/hooks/useRecipes';
import { useReserve } from '@/hooks/useReserve';
import { format } from 'date-fns';

interface ProductionTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  date: Date;
  onSave: (data: ProductionTaskFormData) => Promise<void>;
}

const COMMON_UNITS = ['יחידה', 'מנה', 'ק״ג', 'גרם', 'ליטר', 'קופסה'];

export const ProductionTaskDialog = ({
  open,
  onOpenChange,
  department,
  date,
  onSave,
}: ProductionTaskDialogProps) => {
  const { recipes } = useRecipes();
  const { items: reserveItems } = useReserve();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductionTaskFormData>({
    date: format(date, 'yyyy-MM-dd'),
    department,
    task_type: 'stock',
    name: '',
    target_quantity: 1,
    unit: 'יחידה',
    priority: 0,
    assigned_to: '',
    notes: '',
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: format(date, 'yyyy-MM-dd'),
      department,
    }));
  }, [date, department, open]);

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

  const handleReserveItemChange = (itemId: string) => {
    if (itemId === 'none') {
      setFormData({ ...formData, reserve_item_id: undefined });
      return;
    }

    const item = reserveItems.find(i => i.id === itemId);
    if (item) {
      setFormData({
        ...formData,
        reserve_item_id: itemId,
        name: formData.name || item.name,
        unit: item.unit,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      date: format(date, 'yyyy-MM-dd'),
      department,
      task_type: 'stock',
      name: '',
      target_quantity: 1,
      unit: 'יחידה',
      priority: 0,
      assigned_to: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>משימת ייצור חדשה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג משימה</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value: TaskType) => setFormData({ ...formData, task_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">ייצור למלאי</SelectItem>
                  <SelectItem value="event">לאירוע</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>עדיפות</Label>
              <Select
                value={String(formData.priority)}
                onValueChange={(value) => setFormData({ ...formData, priority: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">רגילה</SelectItem>
                  <SelectItem value="1">גבוהה</SelectItem>
                  <SelectItem value="2">דחופה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.task_type === 'stock' && (
            <div className="space-y-2">
              <Label>קישור לפריט רזרבה (אופציונלי)</Label>
              <Select
                value={formData.reserve_item_id || 'none'}
                onValueChange={handleReserveItemChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר פריט..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא קישור</SelectItem>
                  {reserveItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label htmlFor="name">שם המשימה *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: הכנת קציצות"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_quantity">כמות יעד</Label>
              <Input
                id="target_quantity"
                type="number"
                min={1}
                value={formData.target_quantity}
                onChange={(e) => setFormData({ ...formData, target_quantity: Number(e.target.value) })}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">אחראי</Label>
            <Input
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="שם האחראי על המשימה"
            />
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
              צור משימה
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

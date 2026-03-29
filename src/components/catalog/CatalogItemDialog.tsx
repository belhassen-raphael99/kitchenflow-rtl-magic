import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CatalogItem {
  id: string;
  name_website: string;
  name_internal: string;
  recipe_id: string | null;
  department: string | null;
  unit_type: string | null;
  quantity_per_serving: number | null;
  size_option: string | null;
  notes: string | null;
  price: number | null;
  is_active: boolean;
}

interface CatalogItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItem | null;
  onSuccess: () => void;
}

const DEPARTMENTS = ['מטבח', 'מאפייה', 'קונדיטוריה'];

export const CatalogItemDialog = ({ open, onOpenChange, item, onSuccess }: CatalogItemDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [recipes, setRecipes] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name_website: '',
    name_internal: '',
    department: 'מטבח',
    recipe_id: '',
    unit_type: 'יחידות',
    quantity_per_serving: '',
    size_option: '',
    notes: '',
    price: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name_website: item.name_website,
        name_internal: item.name_internal,
        department: item.department || 'מטבח',
        recipe_id: item.recipe_id || '',
        unit_type: item.unit_type || 'יחידות',
        quantity_per_serving: item.quantity_per_serving?.toString() || '',
        size_option: item.size_option || '',
        notes: item.notes || '',
        price: item.price?.toString() || '',
      });
    } else {
      setForm({ name_website: '', name_internal: '', department: 'מטבח', recipe_id: '', unit_type: 'יחידות', quantity_per_serving: '', size_option: '', notes: '', price: '' });
    }
  }, [item, open]);

  useEffect(() => {
    if (open) {
      supabase.from('recipes').select('id, name').order('name').then(({ data }) => {
        setRecipes(data || []);
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.name_website.trim() || !form.name_internal.trim()) {
      toast({ title: 'נא למלא שם', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name_website: form.name_website,
      name_internal: form.name_internal,
      department: form.department,
      recipe_id: form.recipe_id || null,
      unit_type: form.unit_type,
      quantity_per_serving: form.quantity_per_serving ? parseFloat(form.quantity_per_serving) : null,
      size_option: form.size_option || null,
      notes: form.notes || null,
      price: form.price ? parseFloat(form.price) : null,
    };

    const { error } = item
      ? await supabase.from('catalog_items').update(payload).eq('id', item.id)
      : await supabase.from('catalog_items').insert(payload);

    if (error) {
      toast({ title: 'שגיאה בשמירה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: item ? 'פריט עודכן' : 'פריט נוסף' });
      onSuccess();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{item ? 'עריכת פריט' : 'פריט חדש'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>שם לאתר *</Label>
              <Input value={form.name_website} onChange={e => setForm(f => ({ ...f, name_website: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>שם פנימי *</Label>
              <Input value={form.name_internal} onChange={e => setForm(f => ({ ...f, name_internal: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>מחלקה</Label>
              <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>מתכון מקושר</Label>
              <Select value={form.recipe_id} onValueChange={v => setForm(f => ({ ...f, recipe_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="בחר מתכון..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ללא</SelectItem>
                  {recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>כמות למנה</Label>
              <Input type="number" value={form.quantity_per_serving} onChange={e => setForm(f => ({ ...f, quantity_per_serving: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>יחידה</Label>
              <Input value={form.unit_type} onChange={e => setForm(f => ({ ...f, unit_type: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>מחיר ₪</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>גודל / אופציה</Label>
            <Input value={form.size_option} onChange={e => setForm(f => ({ ...f, size_option: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label>הערות</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {item ? 'שמור' : 'הוסף'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

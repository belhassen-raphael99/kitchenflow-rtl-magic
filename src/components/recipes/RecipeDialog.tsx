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
import { Recipe, RecipeFormData } from '@/hooks/useRecipes';
import { Loader2 } from 'lucide-react';

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  onSave: (data: RecipeFormData) => Promise<void>;
  existingCategories: string[];
}

const DEFAULT_CATEGORIES = ['עיקריות', 'תוספות', 'קינוחים', 'סלטים', 'מרקים', 'מאפים', 'כללי'];

export const RecipeDialog = ({
  open,
  onOpenChange,
  recipe,
  onSave,
  existingCategories,
}: RecipeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    category: 'כללי',
    description: '',
    servings: 1,
    prep_time: undefined,
    cook_time: undefined,
    instructions: [],
    selling_price: 0,
  });
  const [instructionsText, setInstructionsText] = useState('');

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])];

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        category: recipe.category,
        description: recipe.description || '',
        servings: recipe.servings,
        prep_time: recipe.prep_time || undefined,
        cook_time: recipe.cook_time || undefined,
        instructions: recipe.instructions || [],
        selling_price: recipe.selling_price || 0,
      });
      setInstructionsText((recipe.instructions || []).join('\n'));
    } else {
      setFormData({
        name: '',
        category: 'כללי',
        description: '',
        servings: 1,
        prep_time: undefined,
        cook_time: undefined,
        instructions: [],
        selling_price: 0,
      });
      setInstructionsText('');
    }
  }, [recipe, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const instructions = instructionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    await onSave({
      ...formData,
      instructions,
    });

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {recipe ? 'עריכת מתכון' : 'מתכון חדש'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם המתכון *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: שניצל עוף"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">מספר מנות</Label>
              <Input
                id="servings"
                type="number"
                min={1}
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תיאור קצר של המתכון..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep_time">זמן הכנה (דק׳)</Label>
              <Input
                id="prep_time"
                type="number"
                min={0}
                value={formData.prep_time || ''}
                onChange={(e) => setFormData({ ...formData, prep_time: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cook_time">זמן בישול (דק׳)</Label>
              <Input
                id="cook_time"
                type="number"
                min={0}
                value={formData.cook_time || ''}
                onChange={(e) => setFormData({ ...formData, cook_time: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">מחיר מכירה (₪)</Label>
              <Input
                id="selling_price"
                type="number"
                min={0}
                step={0.01}
                value={formData.selling_price || ''}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">הוראות הכנה (שורה לכל שלב)</Label>
            <Textarea
              id="instructions"
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder="1. לחמם שמן במחבת&#10;2. לטגן את העוף..."
              rows={5}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {recipe ? 'שמור שינויים' : 'צור מתכון'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

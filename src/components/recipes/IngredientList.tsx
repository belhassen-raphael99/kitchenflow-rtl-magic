import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Link } from 'lucide-react';
import { RecipeIngredient } from '@/hooks/useRecipes';
import { useAuthContext } from '@/context/AuthContext';

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  onEdit: (ingredient: RecipeIngredient) => void;
  onDelete: (ingredientId: string) => void;
}

export const IngredientList = ({ ingredients, onEdit, onDelete }: IngredientListProps) => {
  const { isAdmin } = useAuthContext();

  if (ingredients.length === 0) {
    return (
      <div className="bg-muted/50 rounded-md p-6 text-center text-muted-foreground">
        <p>אין מרכיבים עדיין</p>
        <p className="text-sm mt-1">הוסף מרכיבים למתכון זה</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-md p-4">
      <div className="space-y-2">
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            className="flex items-center justify-between bg-background rounded-lg p-3 border border-border"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{ing.name}</span>
              {ing.warehouse_item_id && (
                <span title="מקושר למחסן"><Link className="w-3 h-3 text-primary" /></span>
              )}
              {ing.notes && (
                <span className="text-xs text-muted-foreground">({ing.notes})</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {ing.quantity} {ing.unit}
              </Badge>
              
              {isAdmin && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(ing)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(ing.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

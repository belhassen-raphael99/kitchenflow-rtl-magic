import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  DollarSign, 
  Edit, 
  Trash2,
  ChefHat
} from 'lucide-react';
import { Recipe } from '@/hooks/useRecipes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { recipeImages } from '@/assets/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onClick: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onEdit, onDelete, onClick }: RecipeCardProps) => {
  const { isAdmin } = useAuth();

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const profitMargin = recipe.selling_price > 0 && recipe.cost_per_serving > 0
    ? ((recipe.selling_price - recipe.cost_per_serving) / recipe.selling_price * 100).toFixed(0)
    : null;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(recipe)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {recipe.name}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {recipe.category}
            </Badge>
          </div>
          {(recipe.image_url || recipeImages[recipe.id]) ? (
            <img 
              src={recipe.image_url || recipeImages[recipe.id]} 
              alt={recipe.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          {totalTime > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{totalTime} דק׳</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} מנות</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm">
            {recipe.cost_per_serving > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">עלות:</span>
                <span className="font-medium">₪{recipe.cost_per_serving.toFixed(2)}</span>
              </div>
            )}
            {recipe.selling_price > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">מחיר:</span>
                <span className="font-medium text-primary">₪{recipe.selling_price.toFixed(2)}</span>
              </div>
            )}
            {profitMargin && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  Number(profitMargin) >= 30 ? "border-green-500 text-green-600" : 
                  Number(profitMargin) >= 15 ? "border-orange-500 text-orange-600" : 
                  "border-red-500 text-red-600"
                )}
              >
                {profitMargin}% רווח
              </Badge>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(recipe)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(recipe)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

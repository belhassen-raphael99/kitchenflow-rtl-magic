import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { 
  Clock, 
  Users, 
  Edit, 
  Trash2,
  ChefHat
} from 'lucide-react';
import { Recipe } from '@/hooks/useRecipes';
import { useAuthContext } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { recipeImages } from '@/assets/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onClick: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onEdit, onDelete, onClick }: RecipeCardProps) => {
  const { isAdmin, canWrite, canDelete } = useAuthContext();

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const imageUrl = recipe.image_url || recipeImages[recipe.id];

  const profitMargin = recipe.selling_price > 0 && recipe.cost_per_serving > 0
    ? ((recipe.selling_price - recipe.cost_per_serving) / recipe.selling_price * 100).toFixed(0)
    : null;

  return (
    <Card 
      className="group overflow-hidden rounded-lg border border-border hover:shadow-card transition-all duration-300 cursor-pointer"
      onClick={() => onClick(recipe)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={16 / 10}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </AspectRatio>

        {/* Overlay badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge className="bg-card/90 backdrop-blur-sm text-foreground text-xs shadow-soft border-0">
            {recipe.category}
          </Badge>
        </div>

        {/* Bottom gradient overlay with title */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-10">
          <h3 className="font-bold text-lg text-white leading-tight group-hover:text-white/90 transition-colors">
            {recipe.name}
          </h3>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
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

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-sm">
            {recipe.cost_per_serving > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">עלות:</span>
                <span className="font-semibold">₪{recipe.cost_per_serving.toFixed(2)}</span>
              </div>
            )}
            {recipe.selling_price > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">מחיר:</span>
                <span className="font-semibold text-primary">₪{recipe.selling_price.toFixed(2)}</span>
              </div>
            )}
            {profitMargin && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  Number(profitMargin) >= 30 ? "border-primary/50 text-primary bg-primary/5" : 
                  Number(profitMargin) >= 15 ? "border-amber-500/50 text-amber-600 bg-amber-500/5" : 
                  "border-destructive/50 text-destructive bg-destructive/5"
                )}
              >
                {profitMargin}% רווח
              </Badge>
            )}
          </div>

          {canWrite && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => onEdit(recipe)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                  onClick={() => onDelete(recipe)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

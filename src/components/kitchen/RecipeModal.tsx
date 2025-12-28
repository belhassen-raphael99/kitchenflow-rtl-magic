import { StockProduction } from '@/data/kitchenOpsData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Snowflake, 
  Refrigerator, 
  Package,
  ChefHat,
  ListOrdered
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeModalProps {
  recipe: StockProduction | null;
  onClose: () => void;
  departmentColor: {
    bg: string;
    bgLight: string;
    border: string;
    text: string;
  };
}

export const RecipeModal = ({ recipe, onClose, departmentColor }: RecipeModalProps) => {
  if (!recipe) return null;

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'frozen': return <Snowflake className="w-5 h-5" />;
      case 'refrigerated': return <Refrigerator className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStorageLabel = (type: string) => {
    switch (type) {
      case 'frozen': return 'הקפאה';
      case 'refrigerated': return 'קירור';
      default: return 'אחסון';
    }
  };

  return (
    <Dialog open={!!recipe} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0 overflow-hidden" 
        dir="rtl"
      >
        {/* Header with gradient */}
        <div className={cn(
          "p-6 text-white",
          recipe.department === 'bakery' 
            ? "bg-gradient-to-l from-amber-500 to-amber-600" 
            : "bg-gradient-to-l from-emerald-500 to-emerald-600"
        )}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  {recipe.nameHe}
                </DialogTitle>
                <p className="text-white/80">{recipe.name}</p>
              </div>
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <p className="text-3xl font-bold">{recipe.targetQuantity}</p>
                <p className="text-sm">{recipe.unit}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-white/20 text-white border-white/30 flex items-center gap-1">
                {getStorageIcon(recipe.storageType)}
                {getStorageLabel(recipe.storageType)}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Ingredients Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  departmentColor.bg
                )}>
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">מרכיבים</h3>
              </div>
              
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  {recipe.ingredients.map((ing, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-background rounded-lg p-3 border border-border"
                    >
                      <span className="font-medium">{ing.nameHe}</span>
                      <Badge variant="secondary">
                        {ing.amount} {ing.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Separator />

            {/* Instructions Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  departmentColor.bg
                )}>
                  <ListOrdered className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">הוראות הכנה</h3>
              </div>
              
              <div className="space-y-3">
                {recipe.instructionsHe.map((instruction, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 transition-all",
                      departmentColor.bgLight,
                      departmentColor.border
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                      departmentColor.bg,
                      "text-white"
                    )}>
                      {idx + 1}
                    </div>
                    <p className="text-lg leading-relaxed pt-2">{instruction}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, ChefHat, Package, X, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Recipe } from '@/data/mockData';

export const RecipesPage = () => {
  const { recipes, selectedRecipe, setSelectedRecipe } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.includes(searchQuery) || recipe.category.includes(searchQuery)
  );

  return (
    <div className="flex gap-6 animate-fade-in-up">
      {/* Recipe List - Sidebar */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="text-xl font-bold text-foreground">ספר מתכונים</span>
          <ChefHat className="w-6 h-6" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="חפש מתכון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 rounded-xl"
          />
        </div>

        {/* Recipe Cards */}
        <div className="space-y-3">
          {filteredRecipes.map((recipe, index) => (
            <button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className={`w-full text-right p-4 rounded-2xl transition-all duration-200 animate-fade-in-up ${
                selectedRecipe?.id === recipe.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-card shadow-soft hover:shadow-card'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <h3 className="font-semibold text-foreground">{recipe.name}</h3>
              <p className="text-sm text-muted-foreground">{recipe.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Detail */}
      <div className="hidden lg:block flex-1">
        {selectedRecipe ? (
          <RecipeDetail recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        ) : (
          <div className="h-full flex items-center justify-center bg-card rounded-3xl shadow-soft">
            <div className="text-center text-muted-foreground">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>בחר מתכון מהרשימה</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Recipe Modal */}
      {selectedRecipe && (
        <div className="lg:hidden fixed inset-0 bg-background z-50 overflow-y-auto">
          <RecipeDetail recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        </div>
      )}
    </div>
  );
};

const RecipeDetail = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
  return (
    <div className="bg-card rounded-3xl shadow-soft overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="gradient-hero-soft p-6 text-primary-foreground relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-card/20 hover:bg-card/30 rounded-lg transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">{recipe.name}</h2>
        <div className="flex items-center gap-3 mt-3">
          <span className="px-3 py-1 bg-card/20 rounded-lg text-sm">
            {recipe.category}
          </span>
          <span className="px-3 py-1 bg-card/20 rounded-lg text-sm">
            מחיר מכירה: ₪{recipe.price}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid md:grid-cols-2 gap-6">
        {/* Ingredients */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-foreground">רכיבים להרכבה</h3>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-xl"
              >
                <span className={`px-2 py-1 text-xs rounded ${
                  ing.source === 'warehouse' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-kpi-reserve/10 text-kpi-reserve'
                }`}>
                  {ing.source === 'warehouse' ? 'מהמחסן' : 'מהרזרבה'}
                </span>
                <div className="text-right">
                  <span className="text-foreground font-medium">{ing.name}</span>
                  <span className="text-muted-foreground mr-2">{ing.amount} {ing.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-foreground">הוראות הכנה</h3>
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            {recipe.instructions.map((step, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium">
                  {idx + 1}
                </span>
                <p className="text-foreground pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Search,
  Plus,
  Database,
  Loader2,
} from 'lucide-react';
import { useRecipes, Recipe, RecipeFormData } from '@/hooks/useRecipes';
import { useAuth } from '@/hooks/useAuth';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDialog } from '@/components/recipes/RecipeDialog';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { DeleteRecipeDialog } from '@/components/recipes/DeleteRecipeDialog';

export const RecipesPage = () => {
  const { isAdmin } = useAuth();
  const { 
    recipes, 
    loading, 
    createRecipe, 
    updateRecipe, 
    deleteRecipe,
    getRecipeCategories,
  } = useRecipes();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Dialog states
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipeId, setViewingRecipeId] = useState<string | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);

  const categories = getRecipeCategories();

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveRecipe = async (data: RecipeFormData) => {
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, data);
    } else {
      await createRecipe(data);
    }
    setEditingRecipe(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingRecipe) {
      await deleteRecipe(deletingRecipe.id);
      setDeletingRecipe(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            ספר מתכונים
          </h1>
          <p className="text-muted-foreground">ניהול מתכונים ומחירים</p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setRecipeDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            מתכון חדש
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש מתכון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {recipes.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{recipes.length} מתכונים</span>
          <span>•</span>
          <span>{categories.length} קטגוריות</span>
          {filteredRecipes.length !== recipes.length && (
            <>
              <span>•</span>
              <span>{filteredRecipes.length} מוצגים</span>
            </>
          )}
        </div>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={(r) => {
                setEditingRecipe(r);
                setRecipeDialogOpen(true);
              }}
              onDelete={setDeletingRecipe}
              onClick={(r) => setViewingRecipeId(r.id)}
            />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Database className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                אין מתכונים עדיין
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                התחל ליצור מתכונים לספר המתכונים שלך
              </p>
              {isAdmin && (
                <Button onClick={() => setRecipeDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  צור מתכון ראשון
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No Results */
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                לא נמצאו תוצאות
              </h3>
              <p className="text-sm text-muted-foreground">
                נסה לחפש מונח אחר או שנה את הסינון
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <RecipeDialog
        open={recipeDialogOpen}
        onOpenChange={(open) => {
          setRecipeDialogOpen(open);
          if (!open) setEditingRecipe(null);
        }}
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
        existingCategories={categories}
      />

      <RecipeDetailDialog
        open={!!viewingRecipeId}
        onOpenChange={(open) => !open && setViewingRecipeId(null)}
        recipeId={viewingRecipeId}
      />

      <DeleteRecipeDialog
        open={!!deletingRecipe}
        onOpenChange={(open) => !open && setDeletingRecipe(null)}
        recipe={deletingRecipe}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

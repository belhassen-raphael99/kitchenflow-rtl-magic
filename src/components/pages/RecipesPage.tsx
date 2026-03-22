import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { useRecipes, Recipe, RecipeFormData } from '@/hooks/useRecipes';
import { useAuth } from '@/hooks/useAuth';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDialog } from '@/components/recipes/RecipeDialog';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { DeleteRecipeDialog } from '@/components/recipes/DeleteRecipeDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { CardSkeleton } from '@/components/layout/CardSkeleton';
import { EmptyState } from '@/components/layout/EmptyState';

export const RecipesPage = () => {
  const { canWrite } = useAuth();
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
      <div className="space-y-6" dir="rtl">
        <PageHeader
          icon={BookOpen}
          title="ספר מתכונים"
          description="ניהול מתכונים ומחירים"
          accentColor="rose"
        />
        <CardSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <PageHeader
        icon={BookOpen}
        title="ספר מתכונים"
        description="ניהול מתכונים ומחירים"
        accentColor="rose"
        actions={
          canWrite ? (
            <Button className="gap-2 rounded-xl" onClick={() => setRecipeDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              מתכון חדש
            </Button>
          ) : undefined
        }
      />

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
        <div data-demo-tour="recipes-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <Card className="rounded-2xl">
          <CardContent className="py-16">
            <EmptyState
              icon={Database}
              title="אין מתכונים עדיין"
              description="התחל ליצור מתכונים לספר המתכונים שלך"
              action={canWrite ? (
                <Button onClick={() => setRecipeDialogOpen(true)} className="rounded-xl">
                  <Plus className="w-4 h-4 ml-2" />
                  צור מתכון ראשון
                </Button>
              ) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <EmptyState
              icon={Search}
              title="לא נמצאו תוצאות"
              description="נסה לחפש מונח אחר או שנה את הסינון"
            />
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

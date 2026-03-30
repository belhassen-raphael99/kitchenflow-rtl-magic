import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  warehouse_item_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  warehouse_item?: {
    id: string;
    name: string;
    price: number;
    unit: string;
  };
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string | null;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  instructions: string[] | null;
  image_url: string | null;
  cost_per_serving: number;
  selling_price: number;
  max_capacity_grams: number | null;
  assembly_type: string | null;
  qty_x2: any;
  qty_x3: any;
  created_at: string;
  updated_at: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeFormData {
  name: string;
  category: string;
  description?: string;
  servings: number;
  prep_time?: number;
  cook_time?: number;
  instructions?: string[];
  image_url?: string;
  selling_price?: number;
}

export interface IngredientFormData {
  warehouse_item_id?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, category, description, servings, prep_time, cook_time, cost_per_serving, selling_price, image_url, instructions, created_at, updated_at, max_capacity_grams, assembly_type, qty_x2, qty_x3')
      .order('name');

    if (error) {
      toast({
        title: 'שגיאה בטעינת מתכונים',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setRecipes((data || []) as unknown as Recipe[]);
    }
    
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const fetchRecipeWithIngredients = async (recipeId: string): Promise<Recipe | null> => {
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name, category, description, servings, prep_time, cook_time, cost_per_serving, selling_price, image_url, instructions, assembly_type, max_capacity_grams, qty_x2, qty_x3, created_at, updated_at')
      .eq('id', recipeId)
      .single();

    if (recipeError) {
      toast({
        title: 'שגיאה בטעינת מתכון',
        description: recipeError.message,
        variant: 'destructive',
      });
      return null;
    }

    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select(`
        *,
        warehouse_item:warehouse_items(id, name, price, unit)
      `)
      .eq('recipe_id', recipeId);

    if (ingredientsError) {
      toast({
        title: 'שגיאה בטעינת מרכיבים',
        description: ingredientsError.message,
        variant: 'destructive',
      });
    }

    return {
      ...recipe,
      ingredients: ingredients || [],
    } as unknown as Recipe;
  };

  const createRecipe = async (data: RecipeFormData): Promise<Recipe | null> => {
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert([{
        name: data.name,
        category: data.category,
        description: data.description || null,
        servings: data.servings,
        prep_time: data.prep_time || null,
        cook_time: data.cook_time || null,
        instructions: data.instructions || null,
        image_url: data.image_url || null,
        selling_price: data.selling_price || 0,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'שגיאה ביצירת מתכון',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    toast({
      title: 'מתכון נוצר בהצלחה',
      description: `המתכון "${data.name}" נוסף לספר המתכונים`,
    });

    await fetchRecipes();
    return recipe as unknown as Recipe;
  };

  const updateRecipe = async (id: string, data: Partial<RecipeFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('recipes')
      .update({
        name: data.name,
        category: data.category,
        description: data.description || null,
        servings: data.servings,
        prep_time: data.prep_time || null,
        cook_time: data.cook_time || null,
        instructions: data.instructions || null,
        image_url: data.image_url || null,
        selling_price: data.selling_price || 0,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה בעדכון מתכון',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'מתכון עודכן בהצלחה',
    });

    await fetchRecipes();
    return true;
  };

  const deleteRecipe = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה במחיקת מתכון',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'מתכון נמחק בהצלחה',
    });

    await fetchRecipes();
    return true;
  };

  const addIngredient = async (recipeId: string, data: IngredientFormData): Promise<boolean> => {
    const { error } = await supabase
      .from('recipe_ingredients')
      .insert([{
        recipe_id: recipeId,
        warehouse_item_id: data.warehouse_item_id || null,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        notes: data.notes || null,
      }]);

    if (error) {
      toast({
        title: 'שגיאה בהוספת מרכיב',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const updateIngredient = async (ingredientId: string, data: Partial<IngredientFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('recipe_ingredients')
      .update({
        warehouse_item_id: data.warehouse_item_id || null,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        notes: data.notes || null,
      })
      .eq('id', ingredientId);

    if (error) {
      toast({
        title: 'שגיאה בעדכון מרכיב',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const deleteIngredient = async (ingredientId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('id', ingredientId);

    if (error) {
      toast({
        title: 'שגיאה במחיקת מרכיב',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const calculateRecipeCost = async (recipeId: string): Promise<number> => {
    const recipe = await fetchRecipeWithIngredients(recipeId);
    if (!recipe || !recipe.ingredients) return 0;

    let totalCost = 0;
    for (const ing of recipe.ingredients) {
      if (ing.warehouse_item) {
        totalCost += ing.warehouse_item.price * ing.quantity;
      }
    }

    const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : totalCost;

    // Update the recipe with calculated cost
    await supabase
      .from('recipes')
      .update({ cost_per_serving: costPerServing })
      .eq('id', recipeId);

    return costPerServing;
  };

  const getRecipeCategories = (): string[] => {
    const categories = new Set(recipes.map(r => r.category));
    return Array.from(categories);
  };

  return {
    recipes,
    loading,
    fetchRecipes,
    fetchRecipeWithIngredients,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    calculateRecipeCost,
    getRecipeCategories,
  };
}

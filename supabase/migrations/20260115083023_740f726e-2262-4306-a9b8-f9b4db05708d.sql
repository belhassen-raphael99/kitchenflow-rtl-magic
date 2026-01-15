-- =====================================================
-- SPRINT 3: Système de Recettes
-- =====================================================

-- Table des recettes
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'כללי',
  description TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time INTEGER, -- en minutes
  cook_time INTEGER, -- en minutes
  instructions TEXT[], -- array d'instructions
  image_url TEXT,
  cost_per_serving NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des ingrédients de recettes (lien vers warehouse_items)
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  warehouse_item_id UUID REFERENCES public.warehouse_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL, -- Nom de l'ingrédient (backup si pas lié au warehouse)
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'יחידה',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes
CREATE POLICY "Authenticated users can view recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recipes"
  ON public.recipes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recipes"
  ON public.recipes FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for recipe_ingredients
CREATE POLICY "Authenticated users can view recipe_ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert recipe_ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recipe_ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recipe_ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at sur recipes
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_warehouse_item_id ON public.recipe_ingredients(warehouse_item_id);
CREATE INDEX idx_recipes_category ON public.recipes(category);
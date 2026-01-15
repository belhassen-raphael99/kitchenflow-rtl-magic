-- =====================================================
-- SPRINT 4: Système de Réserve
-- =====================================================

-- Table des éléments de réserve (produits préparés en stock)
CREATE TABLE public.reserve_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  storage_type TEXT NOT NULL DEFAULT 'frozen', -- 'frozen', 'refrigerated', 'ambient'
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'יחידה',
  min_stock NUMERIC NOT NULL DEFAULT 0,
  expiry_date DATE,
  location TEXT, -- emplacement dans le stockage
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des logs de production (historique des productions)
CREATE TABLE public.production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserve_item_id UUID NOT NULL REFERENCES public.reserve_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'produced', 'consumed', 'adjusted', 'expired'
  quantity NUMERIC NOT NULL,
  previous_quantity NUMERIC NOT NULL DEFAULT 0,
  new_quantity NUMERIC NOT NULL DEFAULT 0,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reserve_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reserve_items
CREATE POLICY "Authenticated users can view reserve_items"
  ON public.reserve_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert reserve_items"
  ON public.reserve_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reserve_items"
  ON public.reserve_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reserve_items"
  ON public.reserve_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for production_logs
CREATE POLICY "Authenticated users can view production_logs"
  ON public.production_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert production_logs"
  ON public.production_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at sur reserve_items
CREATE TRIGGER update_reserve_items_updated_at
  BEFORE UPDATE ON public.reserve_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_reserve_items_recipe_id ON public.reserve_items(recipe_id);
CREATE INDEX idx_reserve_items_storage_type ON public.reserve_items(storage_type);
CREATE INDEX idx_production_logs_reserve_item_id ON public.production_logs(reserve_item_id);
CREATE INDEX idx_production_logs_created_at ON public.production_logs(created_at DESC);
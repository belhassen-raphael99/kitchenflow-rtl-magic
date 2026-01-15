-- =====================================================
-- SPRINT 5: Kitchen Ops - Production Tasks
-- =====================================================

-- Table des tâches de production (ייצור למלאי ou préparation pour événement)
CREATE TABLE public.production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  department TEXT NOT NULL DEFAULT 'kitchen', -- 'kitchen' ou 'bakery'
  task_type TEXT NOT NULL DEFAULT 'stock', -- 'stock' (ייצור למלאי) ou 'event' (הזמנה לאירוע)
  
  -- Lien vers recette ou reserve item
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  reserve_item_id UUID REFERENCES public.reserve_items(id) ON DELETE SET NULL,
  
  -- Lien vers événement (si task_type = 'event')
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  target_quantity NUMERIC NOT NULL DEFAULT 0,
  completed_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'יחידה',
  
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'cancelled'
  priority INTEGER NOT NULL DEFAULT 0, -- 0 = normal, 1 = haute, 2 = urgente
  
  assigned_to TEXT, -- nom de la personne assignée
  notes TEXT,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view production_tasks"
  ON public.production_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert production_tasks"
  ON public.production_tasks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update production_tasks"
  ON public.production_tasks FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete production_tasks"
  ON public.production_tasks FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_production_tasks_updated_at
  BEFORE UPDATE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_production_tasks_date ON public.production_tasks(date);
CREATE INDEX idx_production_tasks_department ON public.production_tasks(department);
CREATE INDEX idx_production_tasks_status ON public.production_tasks(status);
CREATE INDEX idx_production_tasks_event_id ON public.production_tasks(event_id);
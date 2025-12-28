-- ========================================
-- MIGRATION DE SÉCURITÉ COMPLÈTE - CASSEROLE
-- Architecture Zero Trust - Principe du moindre privilège
-- ========================================

-- 1. SUPPRESSION DES POLICIES TROP PERMISSIVES
-- =============================================

-- Categories: Retirer les policies permettant à tous les utilisateurs de modifier
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;

-- Suppliers: Retirer les policies trop permissives
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;

-- Warehouse items: Retirer les policies permettant à tous de tout faire
DROP POLICY IF EXISTS "Authenticated users can insert warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Authenticated users can update warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Authenticated users can delete warehouse items" ON public.warehouse_items;

-- 2. NOUVELLES POLICIES BASÉES SUR LES RÔLES (RBAC)
-- ==================================================

-- CATEGORIES: Seuls les admins peuvent créer/modifier
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- SUPPLIERS: Seuls les admins peuvent gérer les fournisseurs
CREATE POLICY "Admins can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update suppliers"
ON public.suppliers FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- WAREHOUSE_ITEMS: Lecture pour tous, écriture pour admins seulement
CREATE POLICY "Admins can insert warehouse items"
ON public.warehouse_items FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update warehouse items"
ON public.warehouse_items FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete warehouse items"
ON public.warehouse_items FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. TABLE D'AUDIT POUR LA TRAÇABILITÉ
-- =====================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS sur audit_logs: Lecture admin seulement, insertion via trigger
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Index pour performances sur les requêtes d'audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- 4. TABLE DE RATE LIMITING
-- =========================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP ou user_id
  action text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Pas de policy SELECT publique - accès uniquement via Edge Functions
CREATE POLICY "No public access to rate limits"
ON public.rate_limits FOR ALL
USING (false);

-- Index pour lookup rapide
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_action 
ON public.rate_limits(identifier, action, window_start);

-- Fonction de nettoyage des anciennes entrées de rate limit
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- 5. FONCTION D'AUDIT AUTOMATIQUE
-- ================================
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers d'audit sur les tables sensibles
DROP TRIGGER IF EXISTS audit_warehouse_items ON public.warehouse_items;
CREATE TRIGGER audit_warehouse_items
AFTER INSERT OR UPDATE OR DELETE ON public.warehouse_items
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_categories ON public.categories;
CREATE TRIGGER audit_categories
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_suppliers ON public.suppliers;
CREATE TRIGGER audit_suppliers
AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 6. FONCTION DE VÉRIFICATION DE RATE LIMIT
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  -- Calcul de la fenêtre de temps
  v_window_start := date_trunc('second', now()) - (extract(epoch from now())::integer % p_window_seconds) * interval '1 second';
  
  -- Upsert du compteur
  INSERT INTO public.rate_limits (identifier, action, request_count, window_start)
  VALUES (p_identifier, p_action, 1, v_window_start)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Vérification de la limite
  RETURN v_current_count <= p_max_requests;
END;
$$;
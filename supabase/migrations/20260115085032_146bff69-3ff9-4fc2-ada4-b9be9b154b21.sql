-- =====================================================
-- NOTIFICATIONS SYSTEM
-- =====================================================

-- Table des notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- null = pour tous les admins
  type TEXT NOT NULL, -- 'low_stock', 'expiring', 'upcoming_event', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  
  -- Liens contextuels
  related_table TEXT, -- 'warehouse_items', 'reserve_items', 'events'
  related_id UUID,
  
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can see all notifications (null user_id) or their own
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') 
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can insert notifications (via edge function with service role)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR (user_id IS NULL AND has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Index pour améliorer les performances
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
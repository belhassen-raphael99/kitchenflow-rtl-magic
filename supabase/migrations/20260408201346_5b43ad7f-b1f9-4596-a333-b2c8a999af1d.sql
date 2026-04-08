-- Index events par date (requête principale de l'agenda)
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date DESC);

-- Index events par status (filtrage)
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Index composite pour check-alerts (events à venir non annulés)
CREATE INDEX IF NOT EXISTS idx_events_date_status
  ON public.events(date, status)
  WHERE status != 'cancelled';

-- Index production_tasks par event_id (jointure fréquente)
CREATE INDEX IF NOT EXISTS idx_production_tasks_event_id
  ON public.production_tasks(event_id);

-- Index event_items par event_id
CREATE INDEX IF NOT EXISTS idx_event_items_event_id
  ON public.event_items(event_id);

-- Index notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON public.notifications(is_read) WHERE is_read = false;

-- Index reserve_items par date d'expiration
CREATE INDEX IF NOT EXISTS idx_reserve_items_expiry
  ON public.reserve_items(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- Index warehouse_items par status (alertes stock bas)
CREATE INDEX IF NOT EXISTS idx_warehouse_items_status
  ON public.warehouse_items(status);
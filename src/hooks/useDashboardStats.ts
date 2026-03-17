import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface NextEvent {
  name: string;
  client_name: string | null;
  date: string;
  guests: number;
  daysUntil: number;
}

interface DashboardStats {
  totalRecipes: number;
  eventsThisWeek: number;
  guestsThisWeek: number;
  activeTasks: number;
  totalWarehouseItems: number;
  lowStockItems: number;
  criticalStockItems: number;
  pendingInvoices: number;
  nextEvent: NextEvent | null;
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipes: 0,
    eventsThisWeek: 0,
    guestsThisWeek: 0,
    activeTasks: 0,
    totalWarehouseItems: 0,
    lowStockItems: 0,
    criticalStockItems: 0,
    pendingInvoices: 0,
    nextEvent: null,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);

      const todayStr = today.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const [recipesRes, eventsRes, tasksRes, totalItemsRes, lowRes, criticalRes, invoiceRes, nextEventRes] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id, guests').gte('date', todayStr).lte('date', weekEndStr),
        supabase.from('production_tasks').select('id', { count: 'exact', head: true }).neq('status', 'completed').eq('date', todayStr),
        supabase.from('warehouse_items').select('id', { count: 'exact', head: true }),
        supabase.from('warehouse_items').select('id', { count: 'exact', head: true }).eq('status', 'low'),
        supabase.from('warehouse_items').select('id', { count: 'exact', head: true }).eq('status', 'critical'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('invoice_status', 'sent').gte('date', todayStr),
        supabase.from('events').select('name, client_name, date, guests').gte('date', todayStr).order('date', { ascending: true }).limit(1),
      ]);

      const eventsData = eventsRes.data || [];
      const nextEventData = nextEventRes.data?.[0] || null;

      let nextEvent: NextEvent | null = null;
      if (nextEventData) {
        const eventDate = new Date(nextEventData.date);
        const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        nextEvent = {
          name: nextEventData.name,
          client_name: nextEventData.client_name,
          date: nextEventData.date,
          guests: nextEventData.guests,
          daysUntil: diffDays,
        };
      }

      setStats({
        totalRecipes: recipesRes.count ?? 0,
        eventsThisWeek: eventsData.length,
        guestsThisWeek: eventsData.reduce((sum, e) => sum + (e.guests || 0), 0),
        activeTasks: tasksRes.count ?? 0,
        totalWarehouseItems: totalItemsRes.count ?? 0,
        lowStockItems: lowRes.count ?? 0,
        criticalStockItems: criticalRes.count ?? 0,
        pendingInvoices: invoiceRes.count ?? 0,
        nextEvent,
        loading: false,
      });
    };

    fetchStats();
  }, []);

  return stats;
}

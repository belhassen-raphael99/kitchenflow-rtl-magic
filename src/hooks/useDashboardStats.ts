import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, startOfToday, endOfToday } from 'date-fns';

interface DashboardStats {
  // Events
  eventsThisWeek: number;
  eventsToday: number;
  guestsThisWeek: number;
  upcomingEvents: Array<{
    id: string;
    name: string;
    date: string;
    time: string;
    guests: number;
    status: string;
    client_name: string | null;
  }>;
  // Tasks
  tasksToday: number;
  tasksInProgress: number;
  tasksCompleted: number;
  tasksPending: number;
  // Recipes
  totalRecipes: number;
  // Reserve
  lowStockReserve: number;
  expiringItems: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    eventsThisWeek: 0,
    eventsToday: 0,
    guestsThisWeek: 0,
    upcomingEvents: [],
    tasksToday: 0,
    tasksInProgress: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    totalRecipes: 0,
    lowStockReserve: 0,
    expiringItems: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date();
      const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekFromNow = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      // Fetch events this week with client info
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id, name, date, time, guests, status,
          clients(name)
        `)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .neq('status', 'cancelled')
        .order('date')
        .order('time');

      const eventsThisWeek = eventsData?.length || 0;
      const eventsToday = eventsData?.filter(e => e.date === todayStr).length || 0;
      const guestsThisWeek = eventsData?.reduce((sum, e) => sum + (e.guests || 0), 0) || 0;
      
      // Get upcoming events (next 5)
      const upcomingEvents = (eventsData || [])
        .filter(e => e.date >= todayStr)
        .slice(0, 5)
        .map(e => ({
          id: e.id,
          name: e.name,
          date: e.date,
          time: e.time,
          guests: e.guests,
          status: e.status,
          client_name: (e.clients as { name: string } | null)?.name || null,
        }));

      // Fetch tasks for today
      const { data: tasksData } = await supabase
        .from('production_tasks')
        .select('id, status')
        .eq('date', todayStr);

      const tasksToday = tasksData?.length || 0;
      const tasksInProgress = tasksData?.filter(t => t.status === 'in-progress').length || 0;
      const tasksCompleted = tasksData?.filter(t => t.status === 'completed').length || 0;
      const tasksPending = tasksData?.filter(t => t.status === 'pending').length || 0;

      // Fetch recipes count
      const { count: recipesCount } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true });

      // Fetch reserve items with low stock
      const { data: reserveData } = await supabase
        .from('reserve_items')
        .select('id, quantity, min_stock');

      const lowStockReserve = reserveData?.filter(r => r.quantity <= r.min_stock).length || 0;

      // Fetch expiring items (within 7 days)
      const { data: expiringData } = await supabase
        .from('reserve_items')
        .select('id')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', weekFromNow)
        .gt('quantity', 0);

      const expiringItems = expiringData?.length || 0;

      setStats({
        eventsThisWeek,
        eventsToday,
        guestsThisWeek,
        upcomingEvents,
        tasksToday,
        tasksInProgress,
        tasksCompleted,
        tasksPending,
        totalRecipes: recipesCount || 0,
        lowStockReserve,
        expiringItems,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Set up realtime subscriptions for automatic updates
    const eventsChannel = supabase
      .channel('dashboard-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchStats()
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_tasks' },
        () => fetchStats()
      )
      .subscribe();

    const reserveChannel = supabase
      .channel('dashboard-reserve')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reserve_items' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(reserveChannel);
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

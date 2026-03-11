import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalRecipes: number;
  eventsThisWeek: number;
  guestsThisWeek: number;
  activeTasks: number;
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipes: 0,
    eventsThisWeek: 0,
    guestsThisWeek: 0,
    activeTasks: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);

      const todayStr = today.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const [recipesRes, eventsRes, tasksRes] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id, guests').gte('date', todayStr).lte('date', weekEndStr),
        supabase.from('production_tasks').select('id', { count: 'exact', head: true }).neq('status', 'completed').eq('date', todayStr),
      ]);

      const eventsData = eventsRes.data || [];

      setStats({
        totalRecipes: recipesRes.count ?? 0,
        eventsThisWeek: eventsData.length,
        guestsThisWeek: eventsData.reduce((sum, e) => sum + (e.guests || 0), 0),
        activeTasks: tasksRes.count ?? 0,
        loading: false,
      });
    };

    fetchStats();
  }, []);

  return stats;
}

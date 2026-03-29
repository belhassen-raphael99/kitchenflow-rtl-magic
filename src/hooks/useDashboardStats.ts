import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NextEvent {
  name: string;
  client_name: string | null;
  date: string;
  time: string;
  guests: number;
  daysUntil: number;
  delivery_time: string | null;
  delivery_address: string | null;
  status: string;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
}

interface ExpiringItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  daysUntil: number;
}

interface UrgentTask {
  id: string;
  name: string;
  department: string;
  target_quantity: number;
  unit: string;
  event_date?: string;
}

export interface DashboardStats {
  totalRecipes: number;
  eventsThisWeek: number;
  guestsThisWeek: number;
  activeTasks: number;
  totalWarehouseItems: number;
  lowStockItems: number;
  criticalStockItems: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  todayDeliveries: number;
  alertCount: number;
  nextEvent: NextEvent | null;
  weekEvents: NextEvent[];
  todayDeliveryEvents: NextEvent[];
  lowStockList: LowStockItem[];
  expiringItems: ExpiringItem[];
  urgentTasks: UrgentTask[];
  nextWeekEvents: NextEvent[];
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
    monthlyRevenue: 0,
    todayDeliveries: 0,
    alertCount: 0,
    nextEvent: null,
    weekEvents: [],
    todayDeliveryEvents: [],
    lowStockList: [],
    expiringItems: [],
    urgentTasks: [],
    nextWeekEvents: [],
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Calculate week boundaries (Sunday to Saturday)
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Next week
      const nextWeekStart = new Date(weekEnd);
      nextWeekStart.setDate(weekEnd.getDate() + 1);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      // Month boundaries
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      // Expiry check (today + 2 days)
      const twoDaysLater = new Date(today);
      twoDaysLater.setDate(today.getDate() + 2);
      const twoDaysStr = twoDaysLater.toISOString().split('T')[0];

      // 3 days for urgent tasks
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

      const [
        recipesRes, weekEventsRes, tasksRes, totalItemsRes, lowRes, criticalRes,
        invoiceRes, revenueRes, todayEventsRes, lowStockListRes, expiringRes,
        urgentTasksRes, nextWeekRes
      ] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('name, client_name, date, time, guests, delivery_time, delivery_address, status')
          .gte('date', weekStartStr).lte('date', weekEndStr).order('date'),
        supabase.from('production_tasks').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
        supabase.from('warehouse_items').select('id', { count: 'exact', head: true }),
        supabase.from('warehouse_items').select('id', { count: 'exact', head: true }).eq('status', 'low'),
        supabase.from('warehouse_items').select('id', { count: 'exact', head: true }).eq('status', 'critical'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('invoice_status', 'sent').gte('date', todayStr),
        supabase.from('events').select('invoice_amount').gte('date', monthStart).lte('date', monthEnd).eq('invoice_status', 'paid'),
        supabase.from('events').select('name, client_name, date, time, guests, delivery_time, delivery_address, status')
          .eq('date', todayStr).order('delivery_time'),
        supabase.from('warehouse_items').select('id, name, quantity, min_stock, unit')
          .or('status.eq.low,status.eq.critical').limit(10),
        supabase.from('reserve_items').select('id, name, quantity, unit, expiry_date')
          .not('expiry_date', 'is', null).lte('expiry_date', twoDaysStr).gte('expiry_date', todayStr),
        supabase.from('production_tasks').select('id, name, department, target_quantity, unit')
          .eq('status', 'pending').lte('date', threeDaysStr),
        supabase.from('events').select('name, client_name, date, time, guests, delivery_time, delivery_address, status')
          .gte('date', nextWeekStart.toISOString().split('T')[0])
          .lte('date', nextWeekEnd.toISOString().split('T')[0]).order('date'),
      ]);

      const weekEventsData = weekEventsRes.data || [];
      const todayEventsData = todayEventsRes.data || [];
      const revenueData = revenueRes.data || [];
      const monthlyRevenue = revenueData.reduce((sum, e) => sum + (Number(e.invoice_amount) || 0), 0);

      const mapEvent = (e: any): NextEvent => {
        const eventDate = new Date(e.date);
        const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: e.name,
          client_name: e.client_name,
          date: e.date,
          time: e.time,
          guests: e.guests,
          daysUntil: Math.max(0, diffDays),
          delivery_time: e.delivery_time,
          delivery_address: e.delivery_address,
          status: e.status,
        };
      };

      const weekEvents = weekEventsData.map(mapEvent);
      const todayDeliveryEvents = todayEventsData.map(mapEvent);
      const nextWeekEvents = (nextWeekRes.data || []).map(mapEvent);

      const lowStockList: LowStockItem[] = (lowStockListRes.data || []).map((i: any) => ({
        id: i.id, name: i.name, quantity: Number(i.quantity), min_stock: Number(i.min_stock), unit: i.unit,
      }));

      const expiringItems: ExpiringItem[] = (expiringRes.data || []).map((i: any) => {
        const expDate = new Date(i.expiry_date);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: i.id, name: i.name, quantity: Number(i.quantity), unit: i.unit,
          expiry_date: i.expiry_date, daysUntil: Math.max(0, diffDays),
        };
      });

      const urgentTasks: UrgentTask[] = (urgentTasksRes.data || []).map((t: any) => ({
        id: t.id, name: t.name, department: t.department,
        target_quantity: Number(t.target_quantity), unit: t.unit,
      }));

      const alertCount = lowStockList.length + expiringItems.length + urgentTasks.length;

      setStats({
        totalRecipes: recipesRes.count ?? 0,
        eventsThisWeek: weekEventsData.length,
        guestsThisWeek: weekEventsData.reduce((sum, e) => sum + (e.guests || 0), 0),
        activeTasks: tasksRes.count ?? 0,
        totalWarehouseItems: totalItemsRes.count ?? 0,
        lowStockItems: lowRes.count ?? 0,
        criticalStockItems: criticalRes.count ?? 0,
        pendingInvoices: invoiceRes.count ?? 0,
        monthlyRevenue,
        todayDeliveries: todayEventsData.length,
        alertCount,
        nextEvent: weekEvents.find(e => e.daysUntil >= 0) || null,
        weekEvents,
        todayDeliveryEvents,
        lowStockList,
        expiringItems,
        urgentTasks,
        nextWeekEvents,
        loading: false,
      });
    };

    fetchStats();
  }, []);

  return stats;
}

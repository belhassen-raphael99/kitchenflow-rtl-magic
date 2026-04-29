import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChefHat, Truck, Users, Clock, Printer, Loader2,
  CheckCircle, PlayCircle, Package, AlertTriangle, RefreshCw,
  Scale, ClipboardList, ChevronDown, ChevronUp,
  MoreVertical, CalendarClock, XCircle, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { EventChefDetailDialog } from '@/components/agenda/EventChefDetailDialog';
import { RescheduleTaskDialog } from '@/components/kitchen/RescheduleTaskDialog';
import { ExpiringItemsPanel } from '@/components/kitchen/ExpiringItemsPanel';
import { UpcomingEventsColumn } from '@/components/kitchen/UpcomingEventsColumn';
import { WeeklyMiniStatsCard } from '@/components/kitchen/WeeklyMiniStatsCard';
import { StockPlanItemDialog, type StockPlanItem } from '@/components/kitchen/StockPlanItemDialog';
import { CriticalStockBanner } from '@/components/kitchen/CriticalStockBanner';
import { CriticalStockAlertDialog } from '@/components/kitchen/CriticalStockAlertDialog';
import { useCriticalStockAlerts } from '@/hooks/useCriticalStockAlerts';

interface ChefTask {
  id: string;
  name: string;
  department: string;
  target_quantity: number;
  completed_quantity: number;
  unit: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  event_id: string | null;
  task_type: string;
  recipe_id: string | null;
  reserve_item_id: string | null;
  notes: string | null;
}

interface TodayDelivery {
  id: string;
  name: string;
  client_name: string | null;
  delivery_time: string | null;
  time: string;
  guests: number;
  status: string;
  delivery_address: string | null;
}

interface ScheduleItem {
  id: string;
  department: string;
  product_name: string;
  min_quantity: number | null;
  unit: string | null;
  storage_type: string | null;
  production_day_label: string | null;
  day_of_week: number | null;
  shelf_life_label: string | null;
  notes: string | null;
}

interface ReserveStock {
  id: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
}

const departments = [
  { key: 'מטבח', label: 'מטבח', icon: '🍳' },
  { key: 'מאפייה', label: 'מאפייה', icon: '🍞' },
  { key: 'קונדיטוריה-פטיסרי', label: 'קונד׳-פטיסרי', icon: '🍰' },
  { key: 'קונדיטוריה-בצקים', label: 'קונד׳-בצקים', icon: '🥐' },
];

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const ChefDashboardPage = () => {
  const [tasks, setTasks] = useState<ChefTask[]>([]);
  const [deliveries, setDeliveries] = useState<TodayDelivery[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [reserveStock, setReserveStock] = useState<ReserveStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('מטבח');
  const [updating, setUpdating] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showFullWeek, setShowFullWeek] = useState(false);
  const [expandedCompleted, setExpandedCompleted] = useState<Set<string>>(new Set());
  const [eventDialog, setEventDialog] = useState<TodayDelivery | null>(null);
  const [rescheduleTask, setRescheduleTask] = useState<ChefTask | null>(null);
  const [planItemDialog, setPlanItemDialog] = useState<StockPlanItem | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const { toast } = useToast();
  const criticalAlerts = useCriticalStockAlerts();

  // Auto-open critical alert dialog once per session if new missing detected
  useEffect(() => {
    if (criticalAlerts.loading) return;
    if (criticalAlerts.totalMissing === 0) return;
    const sig = criticalAlerts.alerts
      .map(a => `${a.eventId}:${a.missingIngredients.length}`)
      .sort()
      .join('|');
    const lastSig = typeof window !== 'undefined' ? localStorage.getItem('chef_critical_alert_sig') : '';
    if (sig && sig !== lastSig) {
      setAlertDialogOpen(true);
      try { localStorage.setItem('chef_critical_alert_sig', sig); } catch { /* ignore */ }
      // Fire admin notifications (broadcast — user_id = null) once per signature
      (async () => {
        const rows = criticalAlerts.alerts.map(a => ({
          type: 'critical_stock_for_event',
          title: '🚨 חוסרים קריטיים לאירוע',
          message: `${a.clientName || a.eventName} (${a.date} ${a.time?.slice(0, 5)}) — חסרים ${a.missingIngredients.length} רכיבים`,
          severity: 'critical',
          related_table: 'events',
          related_id: a.eventId,
          user_id: null,
        }));
        if (rows.length > 0) {
          // Best-effort: only admins/demo can insert; silently ignore RLS failures for employees
          await supabase.from('notifications').insert(rows);
        }
      })();
    }
  }, [criticalAlerts.loading, criticalAlerts.totalMissing, criticalAlerts.alerts]);

  const openEventDialogById = useCallback(async (eventId: string) => {
    const { data } = await supabase
      .from('events')
      .select('id, name, client_name, delivery_time, time, guests, status, delivery_address')
      .eq('id', eventId)
      .maybeSingle();
    if (data) setEventDialog(data as TodayDelivery);
  }, []);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, deliveriesRes, scheduleRes, reserveRes] = await Promise.all([
      supabase.from('production_tasks').select('id, name, department, task_type, status, target_quantity, completed_quantity, unit, priority, notes, event_id, recipe_id, reserve_item_id, assigned_to, started_at, completed_at, date').eq('date', todayStr).order('priority', { ascending: false }),
      supabase.from('events').select('id, name, client_name, delivery_time, time, guests, status, delivery_address')
        .eq('date', todayStr).in('status', ['confirmed', 'pending', 'in-progress']).order('delivery_time', { ascending: true }),
      supabase.from('production_schedule' as any).select('id, day_of_week, department, product_name, min_quantity, unit, storage_type, production_day_label, shelf_life_label, notes'),
      supabase.from('reserve_items').select('id, name, quantity, min_stock, unit'),
    ]);

    setTasks((tasksRes.data || []) as ChefTask[]);
    setDeliveries((deliveriesRes.data || []) as TodayDelivery[]);
    setSchedule((scheduleRes.data || []) as unknown as ScheduleItem[]);
    setReserveStock((reserveRes.data || []) as ReserveStock[]);
    setLoading(false);
  }, [todayStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartTask = async (task: ChefTask) => {
    setUpdating(task.id);
    await supabase.from('production_tasks').update({ status: 'in-progress', started_at: new Date().toISOString() }).eq('id', task.id);
    toast({ title: '▶️ משימה התחילה', description: task.name });
    await fetchData();
    setUpdating(null);
  };

  const handleCompleteTask = async (task: ChefTask) => {
    setUpdating(task.id);
    await supabase.from('production_tasks').update({
      status: 'completed',
      completed_quantity: task.target_quantity,
      completed_at: new Date().toISOString(),
    }).eq('id', task.id);

    if (task.reserve_item_id) {
      const stock = reserveStock.find(s => s.id === task.reserve_item_id);
      if (stock) {
        const newQty = stock.quantity + task.target_quantity;
        await supabase.from('reserve_items').update({ quantity: newQty }).eq('id', task.reserve_item_id);
        await supabase.from('production_logs').insert([{
          reserve_item_id: task.reserve_item_id,
          action: 'production',
          quantity: task.target_quantity,
          previous_quantity: stock.quantity,
          new_quantity: newQty,
          notes: `משימה הושלמה: ${task.name}`,
        }]);
      }
    }

    if (task.recipe_id) {
      const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select('warehouse_item_id, quantity')
        .eq('recipe_id', task.recipe_id);

      if (ingredients) {
        const batchMultiplier = task.target_quantity;
        for (const ing of ingredients) {
          if (ing.warehouse_item_id) {
            const { data: wItem } = await supabase
              .from('warehouse_items')
              .select('quantity, min_stock, name')
              .eq('id', ing.warehouse_item_id)
              .single();

            if (wItem) {
              const deduction = ing.quantity * batchMultiplier;
              const newQty = Math.max(0, wItem.quantity - deduction);
              await supabase.from('warehouse_items').update({ quantity: newQty }).eq('id', ing.warehouse_item_id);

              if (newQty < wItem.min_stock) {
                await supabase.from('notifications').insert([{
                  type: 'low_stock',
                  title: 'מלאי נמוך',
                  message: `${wItem.name}: ${newQty} (מינימום: ${wItem.min_stock})`,
                  severity: newQty === 0 ? 'critical' : 'warning',
                  related_table: 'warehouse_items',
                  related_id: ing.warehouse_item_id,
                }]);
              }
            }
          }
        }
      }
    }

    toast({ title: '✅ משימה הושלמה', description: task.name });
    await fetchData();
    setUpdating(null);
  };

  const handleGenerateFromSchedule = async () => {
    setGenerating(true);
    const existingNames = new Set(tasks.map(t => `${t.department}-${t.name}`));
    let created = 0;

    for (const item of schedule) {
      const key = `${item.department}-${item.product_name}`;
      if (existingNames.has(key)) continue;

      const stock = reserveStock.find(s => s.name === item.product_name);
      const currentQty = stock?.quantity || 0;
      const minQty = item.min_quantity || 0;

      if (currentQty < minQty) {
        const needed = minQty - currentQty;
        await supabase.from('production_tasks').insert([{
          date: todayStr,
          department: item.department,
          task_type: 'stock',
          name: item.product_name,
          target_quantity: needed,
          unit: item.unit || 'יחידה',
          priority: currentQty === 0 ? 3 : currentQty < minQty / 2 ? 2 : 1,
          reserve_item_id: stock?.id || null,
          notes: `ייצור אוטומטי — מלאי נוכחי: ${currentQty}, מינימום: ${minQty}`,
        }]);
        created++;
      }
    }

    if (created > 0) {
      toast({ title: `🔄 נוצרו ${created} משימות ייצור`, description: 'לפי תכנית הייצור והמלאי' });
    } else {
      toast({ title: '✅ המלאי תקין', description: 'אין צורך בייצור נוסף כרגע' });
    }

    await fetchData();
    setGenerating(false);
  };

  const handleCreateTaskFromPlan = async (item: StockPlanItem) => {
    const needed = Math.max(0, (item.min_quantity || 0) - item.currentStock);
    if (needed <= 0) return;
    const stock = reserveStock.find(s => s.name === item.product_name);
    const { error } = await supabase.from('production_tasks').insert([{
      date: todayStr,
      department: item.department,
      task_type: 'stock',
      name: item.product_name,
      target_quantity: needed,
      unit: item.unit || 'יחידה',
      priority: item.currentStock === 0 ? 3 : 2,
      reserve_item_id: stock?.id || null,
      notes: `נוסף ידנית — מלאי: ${item.currentStock}/${item.min_quantity}`,
    }]);
    if (error) {
      toast({ title: 'שגיאה ביצירת משימה', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ משימה נוצרה', description: `${item.product_name} (${needed} ${item.unit || 'יחידה'})` });
    await fetchData();
  };

  const handleRescheduleTask = async (task: ChefTask, newDate: string) => {
    const note = `[נדחה מ־${todayStr}] ${task.notes || ''}`.trim();
    const { error } = await supabase
      .from('production_tasks')
      .update({ date: newDate, status: 'pending', notes: note })
      .eq('id', task.id);
    if (error) {
      toast({ title: 'שגיאה בדחיית המשימה', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '📅 המשימה נדחתה', description: `${task.name} → ${newDate}` });
    await fetchData();
  };

  const handleCancelTask = async (task: ChefTask) => {
    const { error } = await supabase
      .from('production_tasks')
      .update({ status: 'cancelled' })
      .eq('id', task.id);
    if (error) {
      toast({ title: 'שגיאה בביטול', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '❌ המשימה בוטלה', description: task.name });
    await fetchData();
  };

  // --- Derived data ---
  const stockTasksAll = tasks.filter(t => t.task_type === 'stock');
  const deptStockTasks = stockTasksAll.filter(t => t.department === activeDept);

  const deptScheduleAll = schedule.filter(s => s.department === activeDept);
  const deptScheduleStock = deptScheduleAll.filter(s => s.storage_type === 'מלאי' || !s.storage_type);
  const deptSchedule = showFullWeek
    ? deptScheduleStock
    : deptScheduleStock.filter(s => s.day_of_week === dayOfWeek || s.day_of_week === null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const toggleCompletedExpand = (id: string) => {
    setExpandedCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // --- Task card (stock only) ---
  const renderTaskCard = (task: ChefTask) => {
    const percent = task.target_quantity > 0 ? Math.round((task.completed_quantity / task.target_quantity) * 100) : 0;
    const isCompleted = task.status === 'completed';
    const isExpanded = expandedCompleted.has(task.id);

    if (isCompleted && !isExpanded) {
      return (
        <div
          key={task.id}
          className="flex items-center justify-between p-2 rounded-md bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleCompletedExpand(task.id)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground line-through truncate">{task.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">✅</Badge>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      );
    }

    return (
      <Card key={task.id} className={cn(
        "rounded-md transition-all",
        isCompleted && "bg-muted/30 border-muted",
        task.status === 'in-progress' && "border-blue-300 shadow-sm ring-1 ring-blue-200/50"
      )}>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
              {task.status === 'in-progress' && <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />}
              {task.status === 'pending' && <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
              <span className="font-medium text-sm truncate">{task.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-xs gap-1">
                <Scale className="w-3 h-3" />
                {task.target_quantity} {task.unit}
              </Badge>
              {isCompleted && (
                <button onClick={() => toggleCompletedExpand(task.id)} className="text-muted-foreground hover:text-foreground">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {task.notes && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 truncate">{task.notes}</p>
          )}

          <Progress value={percent} className="h-1.5" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {task.completed_quantity}/{task.target_quantity} ({percent}%)
            </span>
            <div className="flex gap-1.5 no-print">
              {task.status === 'pending' && (
                <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => handleStartTask(task)} disabled={updating === task.id}>
                  {updating === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                  התחל
                </Button>
              )}
              {task.status === 'in-progress' && (
                <Button size="sm" className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90" onClick={() => handleCompleteTask(task)} disabled={updating === task.id}>
                  {updating === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  סיימתי
                </Button>
              )}
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setRescheduleTask(task)} className="gap-2">
                      <CalendarClock className="w-4 h-4" />
                      דחה לתאריך אחר
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCancelTask(task)} className="gap-2 text-destructive focus:text-destructive">
                      <XCircle className="w-4 h-4" />
                      בטל היום
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // --- Plan item row ---
  const renderPlanItem = (item: ScheduleItem) => {
    const stock = reserveStock.find(s => s.name === item.product_name);
    const qty = stock?.quantity || 0;
    const minQty = item.min_quantity || 0;
    const isLow = minQty > 0 && qty < minQty;
    const hasWarningNote = item.notes?.startsWith('⚠️');

    const planItem: StockPlanItem = {
      id: item.id,
      product_name: item.product_name,
      department: item.department,
      min_quantity: item.min_quantity,
      unit: item.unit,
      storage_type: item.storage_type,
      shelf_life_label: item.shelf_life_label,
      notes: item.notes,
      currentStock: qty,
    };

    return (
      <button
        key={item.id}
        onClick={() => setPlanItemDialog(planItem)}
        className={cn(
          "w-full text-right py-2 px-2.5 rounded-md border transition-colors hover:bg-muted/50",
          hasWarningNote
            ? "bg-amber-50/60 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700/60"
            : isLow
              ? "border-destructive/30 bg-destructive/5"
              : "border-border/50"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{item.product_name}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {minQty > 0 ? (
              <span className={cn(
                "text-xs tabular-nums font-semibold",
                isLow ? "text-destructive" : "text-muted-foreground"
              )}>
                {qty}/{minQty}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">לפי צורך</span>
            )}
            {isLow && <AlertTriangle className="w-3 h-3 text-destructive" />}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-5 print-content" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between print-header">
        <PageHeader
          title={`יום ${hebrewDays[dayOfWeek]} — ${format(today, 'dd/MM/yyyy')}`}
          description="דשבורד שף"
          icon={ChefHat}
          accentColor="orange"
        />
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            הדפס
          </Button>
        </div>
      </div>

      {/* Critical stock banner */}
      {!criticalAlerts.loading && criticalAlerts.totalMissing > 0 && (
        <CriticalStockBanner
          totalMissing={criticalAlerts.totalMissing}
          affectedEvents={criticalAlerts.alerts.length}
          onClick={() => setAlertDialogOpen(true)}
        />
      )}

      {/* KPI strip — always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{totalTasks}</p>
            <p className="text-xs text-muted-foreground">סה״כ משימות</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-500 tabular-nums">{inProgressTasks}</p>
            <p className="text-xs text-muted-foreground">בביצוע</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{completedTasks}</p>
            <p className="text-xs text-muted-foreground">הושלמו</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{overallProgress}%</p>
            <Progress value={overallProgress} className="h-1.5 mt-1" />
            <p className="text-[10px] text-muted-foreground mt-1">{completedTasks}/{totalTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's deliveries — full width banner */}
      {deliveries.length > 0 && (
        <Card className="rounded-xl border-kpi-events/30 bg-kpi-events/[0.03]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-kpi-events" />
              משלוחים היום ({deliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {deliveries.map(d => (
                <button
                  key={d.id}
                  onClick={() => setEventDialog(d)}
                  className="flex items-center justify-between gap-2 p-2.5 bg-background hover:bg-muted/60 rounded-md text-sm border border-border/50 transition-colors text-right"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-base tabular-nums shrink-0" dir="ltr">{(d.delivery_time || d.time || '').slice(0, 5)}</span>
                    <div className="min-w-0">
                      <span className="font-medium truncate block">{d.client_name || d.name}</span>
                      {d.delivery_address && (
                        <p className="text-[11px] text-muted-foreground truncate">{d.delivery_address}</p>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"><Users className="w-3.5 h-3.5" />{d.guests}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAIN GRID: Stock (left) | Upcoming events (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ═══ Colonne gauche : Stock ═══ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              מלאי
              <span className="text-xs font-normal text-muted-foreground">— ייצור קבוע</span>
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 no-print"
              onClick={handleGenerateFromSchedule}
              disabled={generating}
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              ייצור אוטומטי
            </Button>
          </div>

          {/* Department filter */}
          <div className="flex gap-1 overflow-x-auto no-print">
            {departments.map(d => {
              const taskCount = stockTasksAll.filter(t => t.department === d.key && t.status !== 'completed').length;
              const isActive = activeDept === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setActiveDept(d.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                >
                  <span>{d.icon}</span>
                  {d.label}
                  {taskCount > 0 && (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className="text-[10px] px-1 h-4 mr-0.5"
                    >
                      {taskCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Plan today */}
          <Card className="rounded-xl">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  תכנית היום
                  <span className="text-[10px] font-normal text-muted-foreground">({deptSchedule.length})</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] text-muted-foreground"
                  onClick={() => setShowFullWeek(!showFullWeek)}
                >
                  {showFullWeek ? 'היום בלבד' : 'שבוע מלא'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1.5">
              {deptSchedule.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 italic">אין פריטים מתוכננים</p>
              ) : (
                deptSchedule.map(renderPlanItem)
              )}
            </CardContent>
          </Card>

          {/* Tasks to do */}
          <Card className="rounded-xl">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-primary" />
                משימות לביצוע
                <span className="text-[10px] font-normal text-muted-foreground">({deptStockTasks.filter(t => t.status !== 'completed').length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {deptStockTasks.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">אין משימות מלאי</p>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handleGenerateFromSchedule} disabled={generating}>
                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    ייצור אוטומטי
                  </Button>
                </div>
              ) : (
                deptStockTasks.map(renderTaskCard)
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══ Colonne droite : Upcoming events ═══ */}
        <div>
          <UpcomingEventsColumn />
        </div>
      </div>

      {/* Bottom row: weekly stats + expiring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeeklyMiniStatsCard />
        <ExpiringItemsPanel />
      </div>

      {/* Print-only summary */}
      <div className="hidden print:block">
        <div className="page-break" />
        <h2 className="text-lg font-bold mb-4">סיכום ייצור יומי — {format(today, 'dd/MM/yyyy')}</h2>
        {departments.map(dept => {
          const dt = tasks.filter(t => t.department === dept.key);
          if (dt.length === 0) return null;
          return (
            <div key={dept.key} className="print-section mb-4">
              <h3 className="font-bold text-sm mb-2">{dept.icon} {dept.label}</h3>
              <table className="print-table">
                <thead>
                  <tr><th>מוצר</th><th>כמות</th><th>יח׳</th><th>סוג</th><th>סטטוס</th></tr>
                </thead>
                <tbody>
                  {dt.map(t => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.target_quantity}</td>
                      <td>{t.unit}</td>
                      <td>{t.task_type === 'event' ? 'אירוע' : 'מלאי'}</td>
                      <td>{t.status === 'completed' ? '✅' : t.status === 'in-progress' ? '▶️' : '⏳'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {deliveries.length > 0 && (
          <div className="print-section">
            <h3 className="font-bold text-sm mb-2">🚚 משלוחים היום</h3>
            <table className="print-table">
              <thead><tr><th>שעה</th><th>לקוח</th><th>אורחים</th><th>כתובת</th><th>סטטוס</th></tr></thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id}>
                    <td>{(d.delivery_time || d.time || '').slice(0, 5)}</td>
                    <td>{d.client_name || d.name}</td>
                    <td>{d.guests}</td>
                    <td>{d.delivery_address || '-'}</td>
                    <td>{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EventChefDetailDialog
        open={!!eventDialog}
        onOpenChange={(o) => !o && setEventDialog(null)}
        event={eventDialog}
      />
      {rescheduleTask && (
        <RescheduleTaskDialog
          open={!!rescheduleTask}
          onOpenChange={(o) => !o && setRescheduleTask(null)}
          taskName={rescheduleTask.name}
          currentDate={todayStr}
          onConfirm={(newDate) => handleRescheduleTask(rescheduleTask, newDate)}
        />
      )}
      <StockPlanItemDialog
        open={!!planItemDialog}
        onOpenChange={(o) => !o && setPlanItemDialog(null)}
        item={planItemDialog}
        onCreateTask={handleCreateTaskFromPlan}
      />
      <CriticalStockAlertDialog
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        alerts={criticalAlerts.alerts}
        onViewEvent={(id) => { void openEventDialogById(id); }}
      />
    </div>
  );
};

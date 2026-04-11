import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ChefHat, Truck, Users, Clock, Printer, Loader2,
  CheckCircle, PlayCircle, Package, AlertTriangle, RefreshCw,
  Scale, ClipboardList, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';

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
  const { toast } = useToast();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, deliveriesRes, scheduleRes, reserveRes] = await Promise.all([
      supabase.from('production_tasks').select('id, name, department, task_type, status, target_quantity, completed_quantity, unit, priority, notes, event_id, recipe_id, reserve_item_id, assigned_to, started_at, completed_at, date').eq('date', todayStr).order('priority', { ascending: false }),
      supabase.from('events').select('id, name, client_name, delivery_time, time, guests, status, delivery_address')
        .eq('date', todayStr).in('status', ['confirmed', 'pending', 'in-progress']).order('delivery_time', { ascending: true }),
      supabase.from('production_schedule' as any).select('id, day_of_week, department, product_name, min_quantity, unit, storage_type, production_day_label, notes'),
      supabase.from('reserve_items').select('id, name, quantity, min_stock, unit'),
    ]);

    setTasks((tasksRes.data || []) as ChefTask[]);
    setDeliveries((deliveriesRes.data || []) as TodayDelivery[]);
    setSchedule((scheduleRes.data || []) as unknown as ScheduleItem[]);
    setReserveStock((reserveRes.data || []) as ReserveStock[]);
    setLoading(false);
  }, [todayStr, dayOfWeek]);

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
      toast({ title: `🔄 נוצרו ${created} משימות ייצור`, description: 'לפי תכנית הייצור השבועית ומצב המלאי' });
    } else {
      toast({ title: '✅ המלאי תקין', description: 'אין צורך בייצור נוסף כרגע' });
    }

    await fetchData();
    setGenerating(false);
  };

  const deptTasks = tasks.filter(t => t.department === activeDept);
  const deptScheduleAll = schedule.filter(s => s.department === activeDept);
  const deptSchedule = showFullWeek 
    ? deptScheduleAll 
    : deptScheduleAll.filter(s => s.day_of_week === dayOfWeek || s.day_of_week === null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const nonCompletedCount = totalTasks - completedTasks;
  const hasActiveWork = inProgressTasks > 0;

  const deptLowStock = reserveStock.filter(s => {
    const scheduleItem = schedule.find(sc => sc.product_name === s.name && sc.department === activeDept);
    return scheduleItem && s.quantity < s.min_stock;
  });

  // Split tasks by type
  const stockTasks = deptTasks.filter(t => t.task_type === 'stock');
  const eventTasks = deptTasks.filter(t => t.task_type === 'event');

  const [mainTab, setMainTab] = useState('plan');

  // Auto-select tab when tasks load
  useEffect(() => {
    if (!loading) {
      setMainTab((pendingTasks > 0 || inProgressTasks > 0) ? 'tasks' : 'plan');
    }
  }, [loading, pendingTasks, inProgressTasks]);

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

  // --- Step guide ---
  const StepGuide = () => {
    // Collapse if user already has tasks in progress
    if (hasActiveWork) return null;

    const steps = [
      { num: 1, label: 'צור משימות', desc: 'לחץ "ייצור אוטומטי" ליצירת משימות מהתכנית', icon: RefreshCw, done: totalTasks > 0 },
      { num: 2, label: 'התחל הכנה', desc: 'עבור ל"משימות לביצוע" ולחץ "התחל הכנה"', icon: PlayCircle, done: inProgressTasks > 0 || completedTasks > 0 },
      { num: 3, label: 'סיים ועדכן מלאי', desc: 'לחץ "סיימתי" — המלאי מתעדכן אוטומטית', icon: CheckCircle, done: completedTasks > 0 },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        {steps.map(step => (
          <Card key={step.num} className={cn(
            "rounded-lg border-2 transition-all",
            step.done 
              ? "border-primary/30 bg-primary/5" 
              : "border-dashed border-muted-foreground/20"
          )}>
            <CardContent className="p-3 flex items-start gap-3">
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                step.done 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {step.done ? '✓' : step.num}
              </div>
              <div className="min-w-0">
                <p className={cn("font-semibold text-sm", step.done && "text-primary")}>{step.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // --- Task card with improved UX ---
  const renderTaskCard = (task: ChefTask) => {
    const percent = task.target_quantity > 0 ? Math.round((task.completed_quantity / task.target_quantity) * 100) : 0;
    const isCompleted = task.status === 'completed';
    const isExpanded = expandedCompleted.has(task.id);

    // Collapsed completed card
    if (isCompleted && !isExpanded) {
      return (
        <Card
          key={task.id}
          className="rounded-md bg-muted/30 border-muted cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleCompletedExpand(task.id)}
        >
          <CardContent className="p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground line-through">{task.name}</span>
              {task.task_type === 'event' && (
                <Badge variant="outline" className="text-[10px] border-kpi-events/30 text-kpi-events">אירוע</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">✅ הושלם</Badge>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={task.id} className={cn(
        "rounded-md transition-all",
        isCompleted && "bg-muted/30 border-muted",
        task.status === 'in-progress' && "border-blue-300 shadow-sm ring-1 ring-blue-200/50"
      )}>
        <CardContent className="p-3 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-primary" />}
              {task.status === 'in-progress' && <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse" />}
              {task.status === 'pending' && <Clock className="w-4 h-4 text-muted-foreground" />}
              <span className="font-medium text-sm">{task.name}</span>
              {task.task_type === 'event' && (
                <Badge variant="outline" className="text-[10px] border-kpi-events/30 text-kpi-events">אירוע</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
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

          {/* Mini status breadcrumb — always visible on pending/in-progress */}
          {!isCompleted && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={cn(
                "px-1.5 py-0.5 rounded",
                task.status === 'pending' ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
              )}>⏳ ממתין</span>
              <span className="text-muted-foreground">→</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded",
                task.status === 'in-progress' ? "bg-blue-100 dark:bg-blue-950 font-semibold text-blue-700 dark:text-blue-300" : "text-muted-foreground"
              )}>▶️ בביצוע</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">✅ הושלם</span>
            </div>
          )}

          {task.notes && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">{task.notes}</p>
          )}

          <Progress value={percent} className="h-1.5" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {task.completed_quantity}/{task.target_quantity} {task.unit} ({percent}%)
            </span>
            <div className="flex gap-1.5 no-print">
              {task.status === 'pending' && (
                <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => handleStartTask(task)} disabled={updating === task.id}>
                  {updating === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                  התחל הכנה
                </Button>
              )}
              {task.status === 'in-progress' && (
                <Button size="sm" variant="default" className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90" onClick={() => handleCompleteTask(task)} disabled={updating === task.id}>
                  {updating === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  סיימתי
                </Button>
              )}
              {task.status === 'completed' && (
                <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">✅ הושלם</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-5 print-content" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between print-header">
        <PageHeader
          title={`דשבורד שף — יום ${hebrewDays[dayOfWeek]}`}
          description={format(today, 'dd/MM/yyyy')}
          icon={ChefHat}
          accentColor="orange"
        />
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateFromSchedule} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            ייצור אוטומטי
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            הדפס
          </Button>
        </div>
      </div>

      {/* Step Guide */}
      <StepGuide />

      {/* Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{totalTasks}</p>
            <p className="text-xs text-muted-foreground">סה״כ משימות</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{inProgressTasks}</p>
            <p className="text-xs text-muted-foreground">בביצוע</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{completedTasks}</p>
            <p className="text-xs text-muted-foreground">הושלמו</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{overallProgress}%</p>
            <Progress value={overallProgress} className="h-1.5 mt-1" />
            <p className="text-[10px] text-muted-foreground mt-1">הושלמו {completedTasks} מתוך {totalTasks} משימות</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="no-print grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="plan" className="gap-2">
            📋 תכנית היום
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            ⚡ משימות לביצוע
            {nonCompletedCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 mr-1">{nonCompletedCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: תכנית היום (read-only plan) */}
        <TabsContent value="plan" className="space-y-4 mt-4">
          {/* Read-only notice */}
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 no-print">
            📖 תצוגת תכנית בלבד — למשימות לחץ על הכרטיסייה &quot;משימות לביצוע&quot;
          </p>

          {/* CTA when no tasks exist */}
          {totalTasks === 0 && (
            <Card className="rounded-lg border-2 border-dashed border-primary/30 no-print">
              <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">🔄</div>
                <h3 className="font-bold text-base">לא נוצרו משימות עדיין</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  לחץ על &quot;ייצור אוטומטי&quot; כדי ליצור משימות לפי תכנית הייצור ומצב המלאי הנוכחי
                </p>
                <Button size="lg" className="gap-2 mt-1" onClick={handleGenerateFromSchedule} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  ייצור אוטומטי
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Today's deliveries */}
          {deliveries.length > 0 && (
            <Card className="rounded-lg">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-kpi-events" />
                  משלוחים היום ({deliveries.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {deliveries.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-md text-sm border border-border/30">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base tabular-nums">{(d.delivery_time || d.time || '').slice(0, 5)}</span>
                        <div>
                          <span className="font-medium">{d.client_name || d.name}</span>
                          {d.delivery_address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.delivery_address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="flex items-center gap-1 text-xs"><Users className="w-3.5 h-3.5" />{d.guests}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {d.status === 'in-progress' ? '🔵 בדרך' : d.status === 'confirmed' ? '🟢 מאושר' : '⏳ ממתין'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Production plan for today by department */}
          <Tabs value={activeDept} onValueChange={setActiveDept}>
            <TabsList className="no-print w-full justify-start">
              {departments.map(d => {
                const count = schedule.filter(s => s.department === d.key).length;
                return (
                  <TabsTrigger key={d.key} value={d.key} className="text-xs sm:text-sm gap-1">
                    <span>{d.icon}</span>
                    {d.label}
                    {count > 0 && <Badge variant="secondary" className="text-[10px] px-1 h-4">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {departments.map(dept => (
              <TabsContent key={dept.key} value={dept.key} className="space-y-4 mt-4">
                {/* Low stock alerts */}
                {deptLowStock.length > 0 && activeDept === dept.key && (
                  <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 rounded-md">
                    <CardContent className="p-3">
                      <p className="text-xs font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        מלאי נמוך — {dept.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {deptLowStock.map(s => (
                          <Badge key={s.id} variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
                            {s.name}: {s.quantity}/{s.min_stock} {s.unit}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Schedule items with stock status */}
                {deptSchedule.length > 0 && activeDept === dept.key && (
                  <Card className="rounded-md">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {showFullWeek ? 'תכנית ייצור שבועית' : `תכנית ייצור — יום ${hebrewDays[dayOfWeek]}`}
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs no-print" onClick={() => setShowFullWeek(!showFullWeek)}>
                        {showFullWeek ? 'הצג היום בלבד' : 'הצג שבוע מלא'}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="divide-y">
                        {deptSchedule.map(item => {
                          const stock = reserveStock.find(s => s.name === item.product_name);
                          const qty = stock?.quantity || 0;
                          const minQty = item.min_quantity || 0;
                          const isLow = minQty > 0 && qty < minQty;
                          const isAssembly = item.storage_type === 'הרכבה';
                          const percent = minQty > 0 ? Math.min(100, Math.round((qty / minQty) * 100)) : 100;
                          return (
                            <div key={item.id} className="py-2.5 space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.product_name}</span>
                                  {showFullWeek && item.production_day_label && (
                                    <span className="text-[10px] text-muted-foreground">({item.production_day_label})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {minQty > 0 ? (
                                    <span className={cn("text-xs", isLow ? "text-destructive font-bold" : "text-muted-foreground")}>
                                      {qty}/{minQty} {item.unit}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">כמות לפי הזמנה</span>
                                  )}
                                  <Badge variant="outline" className={cn(
                                    "text-[10px]",
                                    isAssembly && "border-amber-300 text-amber-700 dark:text-amber-400",
                                    isLow && !isAssembly && "border-destructive/30 text-destructive"
                                  )}>
                                    {isAssembly ? 'הרכבה ביום המשלוח' : item.storage_type}
                                  </Badge>
                                </div>
                              </div>
                              {minQty > 0 && <Progress value={percent} className={cn("h-1.5", isLow && "[&>div]:bg-destructive")} />}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {deptSchedule.length === 0 && activeDept === dept.key && (
                  <EmptyState 
                    icon={Package} 
                    title={showFullWeek ? `אין תכנית ייצור ל${dept.label}` : `אין פריטים מתוכננים להיום`}
                    description={!showFullWeek ? 'לחץ ״הצג שבוע מלא״ לתכנית השבועית' : undefined}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Tab 2: משימות לביצוע (action tab) */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Tabs value={activeDept} onValueChange={setActiveDept}>
            <TabsList className="no-print w-full justify-start">
              {departments.map(d => {
                const count = tasks.filter(t => t.department === d.key && t.status !== 'completed').length;
                return (
                  <TabsTrigger key={d.key} value={d.key} className="text-xs sm:text-sm gap-1">
                    <span>{d.icon}</span>
                    {d.label}
                    {count > 0 && <Badge variant="secondary" className="text-[10px] px-1 h-4">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {departments.map(dept => (
              <TabsContent key={dept.key} value={dept.key} className="space-y-4 mt-4">
                {activeDept === dept.key && (
                  <>
                    {deptTasks.length === 0 ? (
                      /* Improved empty state with CTA */
                      <Card className="rounded-lg border-2 border-dashed border-primary/30">
                        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl">🔄</div>
                          <h3 className="font-bold text-lg">לא נוצרו משימות עדיין</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            לחץ על &quot;ייצור אוטומטי&quot; כדי ליצור משימות לפי תכנית הייצור ומצב המלאי
                          </p>
                          <Button size="lg" className="gap-2 mt-2" onClick={handleGenerateFromSchedule} disabled={generating}>
                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                            ייצור אוטומטי
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Stock Tasks */}
                        <div className="space-y-3">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            ייצור למלאי
                            <Badge variant="secondary" className="text-[10px]">{stockTasks.length}</Badge>
                          </h3>
                          {stockTasks.length > 0 ? (
                            <div className="space-y-2">{stockTasks.map(renderTaskCard)}</div>
                          ) : (
                            <Card className="border-dashed rounded-md">
                              <CardContent className="py-6 text-center text-muted-foreground text-sm">אין משימות למלאי</CardContent>
                            </Card>
                          )}
                        </div>

                        {/* Event Tasks */}
                        <div className="space-y-3">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            הזמנות לאירועים
                            <Badge variant="secondary" className="text-[10px]">{eventTasks.length}</Badge>
                          </h3>
                          {eventTasks.length > 0 ? (
                            <div className="space-y-2">{eventTasks.map(renderTaskCard)}</div>
                          ) : (
                            <Card className="border-dashed rounded-md">
                              <CardContent className="py-6 text-center text-muted-foreground text-sm">אין הזמנות לאירועים</CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>

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
    </div>
  );
};

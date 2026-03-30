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
  Scale, ClipboardList, Eye,
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
  const [mainTab, setMainTab] = useState('overview');
  const { toast } = useToast();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, deliveriesRes, scheduleRes, reserveRes] = await Promise.all([
      supabase.from('production_tasks').select('*').eq('date', todayStr).order('priority', { ascending: false }),
      supabase.from('events').select('id, name, client_name, delivery_time, time, guests, status, delivery_address')
        .eq('date', todayStr).in('status', ['confirmed', 'pending', 'in-progress']).order('delivery_time', { ascending: true }),
      supabase.from('production_schedule' as any).select('*').eq('day_of_week', dayOfWeek),
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
  const deptSchedule = schedule.filter(s => s.department === activeDept);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const deptLowStock = reserveStock.filter(s => {
    const scheduleItem = schedule.find(sc => sc.product_name === s.name && sc.department === activeDept);
    return scheduleItem && s.quantity < s.min_stock;
  });

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-primary" />;
    if (status === 'in-progress') return <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  // Split tasks by type
  const stockTasks = deptTasks.filter(t => t.task_type === 'stock');
  const eventTasks = deptTasks.filter(t => t.task_type === 'event');

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const renderTaskCard = (task: ChefTask) => {
    const percent = task.target_quantity > 0 ? Math.round((task.completed_quantity / task.target_quantity) * 100) : 0;
    return (
      <Card key={task.id} className={cn(
        "rounded-md transition-all",
        task.status === 'completed' && "opacity-60",
        task.status === 'in-progress' && "border-blue-300 shadow-sm"
      )}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon(task.status)}
              <span className="font-medium text-sm">{task.name}</span>
              {task.task_type === 'event' && (
                <Badge variant="outline" className="text-[10px] border-kpi-events/30 text-kpi-events">אירוע</Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-xs gap-1">
              <Scale className="w-3 h-3" />
              {task.target_quantity} {task.unit}
            </Badge>
          </div>

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
                <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => handleStartTask(task)} disabled={updating === task.id}>
                  {updating === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                  התחל
                </Button>
              )}
              {(task.status === 'in-progress' || task.status === 'pending') && (
                <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => handleCompleteTask(task)} disabled={updating === task.id}>
                  {updating === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  סיים
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
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Day Overview + Production Tasks */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="no-print grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="w-4 h-4" />
            סקירת יום
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            משימות ייצור
          </TabsTrigger>
        </TabsList>

        {/* Tab A: Day Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
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
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        תכנית ייצור — יום {hebrewDays[dayOfWeek]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="divide-y">
                        {deptSchedule.map(item => {
                          const stock = reserveStock.find(s => s.name === item.product_name);
                          const qty = stock?.quantity || 0;
                          const minQty = item.min_quantity || 0;
                          const isLow = qty < minQty;
                          const percent = minQty > 0 ? Math.min(100, Math.round((qty / minQty) * 100)) : 100;
                          return (
                            <div key={item.id} className="py-2.5 space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{item.product_name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs", isLow ? "text-destructive font-bold" : "text-muted-foreground")}>
                                    {qty}/{minQty} {item.unit}
                                  </span>
                                  <Badge variant="outline" className={cn("text-[10px]", isLow && "border-destructive/30 text-destructive")}>
                                    {item.storage_type}
                                  </Badge>
                                </div>
                              </div>
                              <Progress value={percent} className={cn("h-1.5", isLow && "[&>div]:bg-destructive")} />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {deptSchedule.length === 0 && activeDept === dept.key && (
                  <EmptyState icon={Package} title={`אין תכנית ייצור ל${dept.label} היום`} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Tab B: Production Tasks (merged Kitchen Ops) */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Tabs value={activeDept} onValueChange={setActiveDept}>
            <TabsList className="no-print w-full justify-start">
              {departments.map(d => {
                const count = tasks.filter(t => t.department === d.key).length;
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
                      <EmptyState icon={Package} title={`אין משימות ל${dept.label} היום`} description="לחץ 'ייצור אוטומטי' ליצירת משימות לפי תכנית הייצור" />
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

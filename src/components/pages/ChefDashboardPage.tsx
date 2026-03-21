import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ChefHat, Truck, Users, Clock, MapPin, Printer, Loader2,
  CheckCircle, PlayCircle, Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
}

interface TodayDelivery {
  id: string;
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
  min_quantity: number;
  unit: string;
  storage_type: string;
}

const departments = [
  { key: 'מטבח', label: 'מטבח' },
  { key: 'מאפייה', label: 'מאפייה' },
  { key: 'קונדיטוריה-פטיסרי', label: 'קונד׳-פטיסרי' },
  { key: 'קונדיטוריה-בצקים', label: 'קונד׳-בצקים' },
];

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const ChefDashboardPage = () => {
  const [tasks, setTasks] = useState<ChefTask[]>([]);
  const [deliveries, setDeliveries] = useState<TodayDelivery[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('מטבח');
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay(); // 0=Sunday

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tasksRes, deliveriesRes, scheduleRes] = await Promise.all([
      supabase.from('production_tasks').select('*').eq('date', todayStr).order('priority', { ascending: false }),
      supabase.from('events').select('id, client_name, delivery_time, time, guests, status, delivery_address')
        .eq('date', todayStr).in('status', ['confirmed', 'pending', 'in-progress']).order('delivery_time', { ascending: true }),
      supabase.from('production_schedule' as any).select('*').eq('day_of_week', dayOfWeek),
    ]);

    setTasks((tasksRes.data || []) as ChefTask[]);
    setDeliveries((deliveriesRes.data || []) as TodayDelivery[]);
    setSchedule((scheduleRes.data || []) as unknown as ScheduleItem[]);
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
    toast({ title: '✅ משימה הושלמה', description: task.name });
    await fetchData();
    setUpdating(null);
  };

  const deptTasks = tasks.filter(t => t.department === activeDept || 
    (activeDept === 'מטבח' && t.department === 'kitchen') ||
    (activeDept === 'מאפייה' && t.department === 'bakery'));

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-primary" />;
    if (status === 'in-progress') return <PlayCircle className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const deptSchedule = schedule.filter(s => s.department === activeDept);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 print-content" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            דשבורד שף — יום {hebrewDays[dayOfWeek]} {format(today, 'dd/MM/yyyy')}
          </h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          הדפס תכנית יום
        </Button>
      </div>

      {/* Today's deliveries */}
      {deliveries.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              משלוחים היום ({deliveries.length})
            </h2>
            <div className="space-y-2">
              {deliveries.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base">{(d.delivery_time || d.time || '').slice(0, 5)}</span>
                    <span className="font-medium">{d.client_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{d.guests}</span>
                    <Badge variant="outline" className="text-xs">
                      {d.status === 'in-progress' ? '🔵 בדרך' : d.status === 'confirmed' ? '🟡 מאושר' : '⏳ ממתין'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department tabs */}
      <Tabs value={activeDept} onValueChange={setActiveDept}>
        <TabsList className="no-print w-full justify-start">
          {departments.map(d => (
            <TabsTrigger key={d.key} value={d.key} className="text-xs sm:text-sm">{d.label}</TabsTrigger>
          ))}
        </TabsList>

        {departments.map(dept => (
          <TabsContent key={dept.key} value={dept.key} className="space-y-4 mt-4">
            {/* Tasks */}
            <div>
              <h3 className="font-bold text-sm mb-3">משימות היום — {dept.label}</h3>
              {deptTasks.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">אין משימות ל{dept.label} היום</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {deptTasks.map(task => {
                    const percent = task.target_quantity > 0 ? Math.round((task.completed_quantity / task.target_quantity) * 100) : 0;
                    return (
                      <Card key={task.id}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {statusIcon(task.status)}
                              <span className="font-medium text-sm">{task.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {task.completed_quantity}/{task.target_quantity} {task.unit}
                            </span>
                          </div>
                          <Progress value={percent} className="h-2" />
                          <div className="flex gap-2 no-print">
                            {task.status === 'pending' && (
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleStartTask(task)} disabled={updating === task.id}>
                                {updating === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                התחל
                              </Button>
                            )}
                            {(task.status === 'in-progress' || task.status === 'pending') && (
                              <Button size="sm" className="gap-1.5" onClick={() => handleCompleteTask(task)} disabled={updating === task.id}>
                                {updating === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                סיים
                              </Button>
                            )}
                            {task.status === 'completed' && (
                              <Badge variant="outline" className="text-primary border-primary/30">✅ הושלם</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly schedule for this department */}
            {deptSchedule.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    תכנית ייצור להיום (יום {hebrewDays[dayOfWeek]})
                  </h3>
                  <div className="divide-y">
                    {deptSchedule.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{item.product_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.min_quantity} {item.unit}</span>
                          <Badge variant="outline" className="text-[10px]">{item.storage_type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

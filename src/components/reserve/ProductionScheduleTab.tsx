import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  id: string;
  department: string;
  product_name: string;
  min_quantity: number | null;
  unit: string | null;
  storage_type: string | null;
  day_of_week: number;
}

interface ReserveStock {
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
}

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const workDays = [0, 1, 2, 3, 4]; // Sun-Thu

const departments = [
  { key: 'מטבח', label: 'מטבח', icon: '🍳' },
  { key: 'מאפייה', label: 'מאפייה', icon: '🍞' },
  { key: 'קונדיטוריה-פטיסרי', label: 'קונד׳-פטיסרי', icon: '🍰' },
  { key: 'קונדיטוריה-בצקים', label: 'קונד׳-בצקים', icon: '🥐' },
];

export const ProductionScheduleTab = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [stock, setStock] = useState<ReserveStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('מטבח');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [scheduleRes, stockRes] = await Promise.all([
      supabase.from('production_schedule' as any).select('id, day_of_week, department, product_name, min_quantity, unit, storage_type, notes'),
      supabase.from('reserve_items').select('name, quantity, min_stock, unit'),
    ]);
    setSchedule((scheduleRes.data || []) as unknown as ScheduleItem[]);
    setStock((stockRes.data || []) as ReserveStock[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const todayDow = new Date().getDay();

  return (
    <div className="space-y-4">
      <Tabs value={activeDept} onValueChange={setActiveDept}>
        <TabsList className="w-full justify-start">
          {departments.map(d => {
            const count = schedule.filter(s => s.department === d.key).length;
            return (
              <TabsTrigger key={d.key} value={d.key} className="text-xs sm:text-sm gap-1">
                {d.icon} {d.label}
                {count > 0 && <Badge variant="secondary" className="text-[10px] px-1 h-4">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {departments.map(dept => {
          const deptItems = schedule.filter(s => s.department === dept.key);

          return (
            <TabsContent key={dept.key} value={dept.key} className="mt-4">
              {deptItems.length === 0 ? (
                <Card className="rounded-md">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    אין תכנית ייצור ל{dept.label}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {workDays.map(day => {
                    const dayItems = deptItems.filter(i => i.day_of_week === day);
                    if (dayItems.length === 0) return null;
                    const isToday = day === todayDow;

                    return (
                      <Card key={day} className={cn("rounded-md", isToday && "border-primary/50 shadow-sm")}>
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs font-bold flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            יום {hebrewDays[day]}
                            {isToday && <Badge className="text-[10px] bg-primary">היום</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="divide-y">
                            {dayItems.map(item => {
                              const currentStock = stock.find(s => s.name === item.product_name);
                              const qty = currentStock?.quantity || 0;
                              const minQty = item.min_quantity || 0;
                              const isLow = qty < minQty;

                              return (
                                <div key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                                  <span className="font-medium">{item.product_name}</span>
                                  <div className="flex items-center gap-2">
                                    {isLow && <AlertTriangle className="w-3 h-3 text-destructive" />}
                                    <span className={cn("text-xs", isLow ? "text-destructive font-bold" : "text-muted-foreground")}>
                                      {qty}/{minQty} {item.unit}
                                    </span>
                                    <Badge variant="outline" className="text-[9px]">{item.storage_type}</Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
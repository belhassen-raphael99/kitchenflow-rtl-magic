import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Users, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { EventChefDetailDialog } from '@/components/agenda/EventChefDetailDialog';

interface EventRow {
  id: string;
  name: string;
  client_name: string | null;
  date: string;
  time: string;
  delivery_time: string | null;
  guests: number;
  status: string;
  delivery_address: string | null;
}

type RangeKey = 'today' | 'week' | 'month';

function getRange(key: RangeKey): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  const to = new Date(today);

  if (key === 'today') {
    // from = to = today
  } else if (key === 'week') {
    // Israeli week: Sunday start
    const dow = today.getDay(); // 0 = Sun
    from.setDate(today.getDate() - dow);
    to.setDate(from.getDate() + 6);
  } else {
    from.setDate(1);
    to.setMonth(today.getMonth() + 1, 0);
  }

  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

export function WeeklyEventsPanel() {
  const [range, setRange] = useState<RangeKey>('week');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [counts, setCounts] = useState({ week: 0, month: 0 });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange(range);
    const { data } = await supabase
      .from('events')
      .select('id, name, client_name, date, time, delivery_time, guests, status, delivery_address')
      .gte('date', from)
      .lte('date', to)
      .neq('status', 'cancelled')
      .order('date')
      .order('time');
    setEvents((data || []) as EventRow[]);
    setLoading(false);
  }, [range]);

  const fetchCounts = useCallback(async () => {
    const week = getRange('week');
    const month = getRange('month');
    const [w, m] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('date', week.from).lte('date', week.to).neq('status', 'cancelled'),
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('date', month.from).lte('date', month.to).neq('status', 'cancelled'),
    ]);
    setCounts({ week: w.count || 0, month: m.count || 0 });
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const grouped = useMemo(() => {
    return events.reduce<Record<string, EventRow[]>>((acc, ev) => {
      (acc[ev.date] ||= []).push(ev);
      return acc;
    }, {});
  }, [events]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{counts.week}</p>
            <p className="text-xs text-muted-foreground mt-1">אירועים השבוע</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{counts.month}</p>
            <p className="text-xs text-muted-foreground mt-1">אירועים החודש</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 justify-center">
        {(['today', 'week', 'month'] as RangeKey[]).map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? 'default' : 'outline'}
            onClick={() => setRange(r)}
          >
            {r === 'today' ? 'היום' : r === 'week' ? 'השבוע' : 'החודש'}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card className="rounded-lg">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-kpi-events" />
            יומן אירועים — {events.length} אירועים
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">אין אירועים בתקופה זו</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([date, dayEvents]) => {
                const d = new Date(date + 'T00:00:00');
                return (
                  <div key={date}>
                    <p className="text-xs font-bold text-muted-foreground mb-1.5">
                      {format(d, 'EEEE, dd/MM', { locale: he })}
                    </p>
                    <div className="space-y-1.5">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelected(ev)}
                          className="w-full flex items-center justify-between p-2.5 bg-muted/40 hover:bg-muted rounded-md text-sm border border-border/30 transition-colors text-right"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-bold text-base tabular-nums shrink-0">
                              {(ev.delivery_time || ev.time || '').slice(0, 5)}
                            </span>
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{ev.client_name || ev.name}</span>
                              {ev.delivery_address && (
                                <span className="text-[11px] text-muted-foreground truncate block">{ev.delivery_address}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Users className="w-3 h-3" /> {ev.guests}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EventChefDetailDialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        event={selected}
      />
    </div>
  );
}
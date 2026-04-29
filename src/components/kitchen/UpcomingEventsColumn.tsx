import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CalendarHeart, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { EventChefDetailDialog } from '@/components/agenda/EventChefDetailDialog';
import { UpcomingEventsCard, type UpcomingEvent } from './UpcomingEventsCard';

type RangeKey = 'today' | 'tomorrow' | 'week';

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

function getRange(key: RangeKey): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  const to = new Date(today);

  if (key === 'today') {
    // same day
  } else if (key === 'tomorrow') {
    from.setDate(today.getDate() + 1);
    to.setDate(today.getDate() + 1);
  } else {
    // Israeli week: Sunday start, from today through Saturday
    const dow = today.getDay();
    to.setDate(today.getDate() + (6 - dow));
  }

  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

export function UpcomingEventsColumn() {
  const [range, setRange] = useState<RangeKey>('week');
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UpcomingEvent | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange(range);

    const { data: rows } = await supabase
      .from('events')
      .select('id, name, client_name, date, time, delivery_time, guests, status, delivery_address')
      .gte('date', from)
      .lte('date', to)
      .neq('status', 'cancelled')
      .order('date')
      .order('delivery_time', { ascending: true, nullsFirst: false })
      .order('time');

    const eventRows = (rows || []) as EventRow[];
    if (eventRows.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const ids = eventRows.map((e) => e.id);
    const [itemsRes, tasksRes] = await Promise.all([
      supabase
        .from('event_items')
        .select('event_id, department, quantity')
        .in('event_id', ids),
      supabase
        .from('production_tasks')
        .select('event_id, status')
        .eq('task_type', 'event')
        .in('event_id', ids),
    ]);

    const itemsByEvent = new Map<string, Array<{ department: string | null; quantity: number }>>();
    for (const it of itemsRes.data || []) {
      const arr = itemsByEvent.get(it.event_id) || [];
      arr.push({ department: it.department, quantity: it.quantity });
      itemsByEvent.set(it.event_id, arr);
    }

    const tasksByEvent = new Map<string, { total: number; completed: number }>();
    for (const t of tasksRes.data || []) {
      if (!t.event_id) continue;
      const acc = tasksByEvent.get(t.event_id) || { total: 0, completed: 0 };
      acc.total += 1;
      if (t.status === 'completed') acc.completed += 1;
      tasksByEvent.set(t.event_id, acc);
    }

    const enriched: UpcomingEvent[] = eventRows.map((ev) => {
      const items = itemsByEvent.get(ev.id) || [];
      const deptCounts: Record<string, number> = {};
      let totalItems = 0;
      for (const it of items) {
        const dept = it.department || 'אחר';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        totalItems += 1;
      }
      const tasks = tasksByEvent.get(ev.id) || { total: 0, completed: 0 };
      return {
        ...ev,
        deptCounts,
        totalItems,
        completedTasks: tasks.completed,
        totalTasks: tasks.total,
      };
    });

    setEvents(enriched);
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ranges: Array<{ key: RangeKey; label: string }> = useMemo(
    () => [
      { key: 'today', label: 'היום' },
      { key: 'tomorrow', label: 'מחר' },
      { key: 'week', label: 'השבוע' },
    ],
    []
  );

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold flex items-center gap-2">
          <PartyPopper className="w-4 h-4 text-kpi-events" />
          אירועים הקרובים
          {events.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({events.length})</span>
          )}
        </h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? 'default' : 'outline'}
              className="h-7 text-xs px-2.5"
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Card className="rounded-xl">
          <CardContent className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
            <CalendarHeart className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">אין אירועים בתקופה זו</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {events.map((ev) => (
            <UpcomingEventsCard key={ev.id} event={ev} onClick={() => setSelected(ev)} />
          ))}
        </div>
      )}

      <EventChefDetailDialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        event={selected}
      />
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInCalendarDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { EventChefDetailDialog } from '@/components/agenda/EventChefDetailDialog';

interface MiniEvent {
  id: string;
  name: string;
  client_name: string | null;
  date: string;
  time: string;
  delivery_time: string | null;
  guests: number;
  delivery_address: string | null;
}

function getRange(key: 'week' | 'month'): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  const to = new Date(today);
  if (key === 'week') {
    const dow = today.getDay();
    from.setDate(today.getDate() - dow);
    to.setDate(from.getDate() + 6);
  } else {
    from.setDate(1);
    to.setMonth(today.getMonth() + 1, 0);
  }
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

function relativeLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(d, today);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff > 1 && diff <= 6) return format(d, 'EEEE', { locale: he });
  return format(d, 'dd/MM', { locale: he });
}

export function WeeklyMiniStatsCard() {
  const [counts, setCounts] = useState({ week: 0, month: 0 });
  const [upcoming, setUpcoming] = useState<MiniEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MiniEvent | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const week = getRange('week');
    const month = getRange('month');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const [w, m, up] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('date', week.from).lte('date', week.to).neq('status', 'cancelled'),
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('date', month.from).lte('date', month.to).neq('status', 'cancelled'),
      supabase.from('events')
        .select('id, name, client_name, date, time, delivery_time, guests, delivery_address')
        .gte('date', todayStr)
        .lte('date', week.to)
        .neq('status', 'cancelled')
        .order('date').order('time')
        .limit(5),
    ]);

    setCounts({ week: w.count || 0, month: m.count || 0 });
    setUpcoming((up.data || []) as MiniEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Card className="rounded-xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-kpi-events" />
          השבוע במספרים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{counts.week}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">השבוע</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{counts.month}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">החודש</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">אין אירועים קרובים</p>
        ) : (
          <div className="space-y-1.5">
            {upcoming.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelected(ev)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted/60 text-right transition-colors text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    {relativeLabel(ev.date)}
                  </Badge>
                  <span className="font-medium truncate">{ev.client_name || ev.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                  <span className="text-[11px] tabular-nums" dir="ltr">{(ev.delivery_time || ev.time || '').slice(0, 5)}</span>
                  <span className="flex items-center gap-0.5 text-[11px]">
                    <Users className="w-3 h-3" />{ev.guests}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <EventChefDetailDialog
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          event={selected}
        />
      </CardContent>
    </Card>
  );
}
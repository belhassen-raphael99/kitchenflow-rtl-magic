import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, ChevronLeft } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface UpcomingEvent {
  id: string;
  name: string;
  client_name: string | null;
  date: string;
  time: string;
  delivery_time: string | null;
  guests: number;
  status: string;
  delivery_address: string | null;
  deptCounts: Record<string, number>;
  totalItems: number;
  completedTasks: number;
  totalTasks: number;
}

interface Props {
  event: UpcomingEvent;
  onClick: () => void;
}

const deptIcons: Record<string, string> = {
  'מטבח': '🍳',
  'מאפייה': '🍞',
  'קונדיטוריה': '🍰',
  'קונדיטוריה-פטיסרי': '🍰',
  'קונדיטוריה-בצקים': '🥐',
};

function relativeDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(d, today);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff > 1 && diff <= 6) return format(d, 'EEEE', { locale: he });
  return format(d, 'EEEE dd/MM', { locale: he });
}

export function UpcomingEventsCard({ event, onClick }: Props) {
  const time = (event.delivery_time || event.time || '').slice(0, 5);
  const dayLabel = relativeDayLabel(event.date);
  const progress = event.totalTasks > 0
    ? Math.round((event.completedTasks / event.totalTasks) * 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date + 'T00:00:00');
  const diff = differenceInCalendarDays(eventDate, today);
  const urgent = diff <= 1;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group',
        urgent && 'border-primary/30 bg-primary/[0.02]'
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={urgent ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0"
              >
                {dayLabel}
              </Badge>
              {time && (
                <span className="text-sm font-bold tabular-nums flex items-center gap-1" dir="ltr">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {time}
                </span>
              )}
            </div>
            <p className="font-semibold text-sm mt-1.5 truncate">
              {event.client_name || event.name}
            </p>
            {event.delivery_address && (
              <p className="text-[11px] text-muted-foreground truncate">{event.delivery_address}</p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-[10px] gap-1">
              <Users className="w-3 h-3" /> {event.guests}
            </Badge>
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Department counts */}
        {event.totalItems > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(event.deptCounts).map(([dept, count]) => (
              <Badge
                key={dept}
                variant="outline"
                className="text-[11px] gap-1 bg-muted/30 font-normal"
              >
                <span>{deptIcons[dept] || '📦'}</span>
                <span className="text-muted-foreground">{dept}</span>
                <span className="font-bold text-foreground">{count}</span>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">אין פריטים מוגדרים</p>
        )}

        {/* Progress */}
        {event.totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>התקדמות ייצור</span>
              <span className="tabular-nums">{event.completedTasks}/{event.totalTasks}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs justify-center hover:bg-primary/10"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          פתח פרטים מלאים
        </Button>
      </CardContent>
    </Card>
  );
}
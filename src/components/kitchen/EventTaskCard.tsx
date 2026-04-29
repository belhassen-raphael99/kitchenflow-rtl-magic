import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventTaskCardData {
  id: string;
  name: string;
  department: string;
  target_quantity: number;
  completed_quantity: number;
  unit: string;
  status: string;
  event_id: string | null;
  recipe_id: string | null;
  notes: string | null;
  client_name?: string | null;
  event_time?: string | null;
  event_name?: string | null;
}

interface Props {
  task: EventTaskCardData;
  updating: boolean;
  onStart: () => void;
  onComplete: () => void;
  onClickEvent: () => void;
}

export function EventTaskCard({ task, updating, onStart, onComplete, onClickEvent }: Props) {
  // Une fois complété, la tuile disparaît (filtrée par le parent)
  if (task.status === 'completed') return null;

  const time = (task.event_time || '').slice(0, 5);
  const clientLabel = task.client_name || task.event_name || 'אירוע';
  const isInProgress = task.status === 'in-progress';

  return (
    <Card className={cn(
      'rounded-lg transition-all hover:shadow-md',
      isInProgress && 'ring-1 ring-blue-300 bg-blue-50/30 dark:bg-blue-950/10',
    )}>
      <CardContent className="p-2.5 space-y-2">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.4em]">
            {task.name}
          </p>
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <button
              type="button"
              onClick={onClickEvent}
              className="text-kpi-events hover:underline truncate font-medium min-w-0"
              title={clientLabel}
            >
              {clientLabel}
            </button>
            <span className="tabular-nums font-bold shrink-0">×{task.target_quantity}</span>
          </div>
          {time && (
            <p className="text-[10px] text-muted-foreground tabular-nums" dir="ltr">⏱ {time}</p>
          )}
        </div>

        <div className="no-print">
          {task.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs gap-1"
              onClick={onStart}
              disabled={updating}
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
              התחל
            </Button>
          )}
          {isInProgress && (
            <Button
              size="sm"
              className="w-full h-8 text-xs gap-1 bg-primary hover:bg-primary/90"
              onClick={onComplete}
              disabled={updating}
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              סיימתי
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

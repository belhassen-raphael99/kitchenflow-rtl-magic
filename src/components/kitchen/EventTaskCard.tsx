import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, PlayCircle, Clock, Scale, Loader2, PartyPopper, ChevronUp, ChevronDown,
} from 'lucide-react';
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
  // enrichment
  client_name?: string | null;
  event_time?: string | null;
  event_name?: string | null;
}

interface Props {
  task: EventTaskCardData;
  updating: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStart: () => void;
  onComplete: () => void;
  onClickEvent: () => void;
}

export function EventTaskCard({ task, updating, isExpanded, onToggleExpand, onStart, onComplete, onClickEvent }: Props) {
  const percent = task.target_quantity > 0
    ? Math.round((task.completed_quantity / task.target_quantity) * 100)
    : 0;
  const isCompleted = task.status === 'completed';
  const time = (task.event_time || '').slice(0, 5);
  const clientLabel = task.client_name || task.event_name || 'אירוע';

  if (isCompleted && !isExpanded) {
    return (
      <div
        className="flex items-center justify-between p-2 rounded-md bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground line-through truncate">
            {task.name} · {clientLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">✅</Badge>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "rounded-md transition-all border-r-4 border-r-kpi-events/70",
      isCompleted && "bg-muted/30 border-muted",
      task.status === 'in-progress' && "border-blue-300 shadow-sm ring-1 ring-blue-200/50",
    )}>
      <CardContent className="p-3 space-y-2.5">
        {/* Client badge */}
        <button
          type="button"
          onClick={onClickEvent}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-kpi-events hover:underline"
        >
          <PartyPopper className="w-3 h-3" />
          {clientLabel}
          {time && <span className="text-muted-foreground" dir="ltr">· {time}</span>}
        </button>

        <div className="flex items-center justify-between gap-2">
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
              <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground">
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
              <Button size="sm" className="gap-1 h-7 text-xs" onClick={onStart} disabled={updating}>
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                התחל
              </Button>
            )}
            {task.status === 'in-progress' && (
              <Button size="sm" className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90" onClick={onComplete} disabled={updating}>
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                סיימתי
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
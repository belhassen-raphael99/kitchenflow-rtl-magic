import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, PlayCircle, Loader2, MoreVertical, CalendarClock, XCircle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface StockTaskTileData {
  id: string;
  name: string;
  target_quantity: number;
  completed_quantity: number;
  unit: string;
  status: string;
  notes: string | null;
  rescheduled_from?: string | null;
}

interface Props {
  task: StockTaskTileData;
  updating: boolean;
  onStart: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}

export function StockTaskTile({ task, updating, onStart, onComplete, onReschedule, onCancel }: Props) {
  if (task.status === 'completed' || task.status === 'cancelled') return null;

  const isInProgress = task.status === 'in-progress';
  const isRescheduled = !!task.rescheduled_from;
  const percent = task.target_quantity > 0
    ? Math.round((task.completed_quantity / task.target_quantity) * 100)
    : 0;

  return (
    <Card
      className={cn(
        'rounded-lg transition-all hover:shadow-md relative',
        isInProgress && 'ring-1 ring-blue-300 bg-blue-50/30 dark:bg-blue-950/10',
        isRescheduled && 'border-r-4 border-r-orange-500',
      )}
      title={task.notes || undefined}
    >
      <CardContent className="p-2.5 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.4em] flex-1">
            {task.name}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 -mt-1 -mr-1 shrink-0 no-print">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onReschedule} className="gap-2">
                <CalendarClock className="w-4 h-4" />
                דחה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCancel} className="gap-2 text-destructive focus:text-destructive">
                <XCircle className="w-4 h-4" />
                בטל היום
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between gap-1 text-[10px]">
          {isRescheduled ? (
            <Badge variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-400 text-[9px] px-1 h-4 gap-0.5">
              <CalendarClock className="w-2.5 h-2.5" />
              נדחה
            </Badge>
          ) : <span />}
          <span className="tabular-nums font-bold shrink-0">
            ×{task.target_quantity} {task.unit}
          </span>
        </div>

        {isInProgress && (
          <Progress value={percent} className="h-1" />
        )}

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
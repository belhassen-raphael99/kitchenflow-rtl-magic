import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Check,
  X,
  Clock,
  Users,
  ChefHat,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ProductionTask, TaskStatus } from '@/hooks/useKitchenOps';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface ProductionTaskCardProps {
  task: ProductionTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  departmentColor: {
    bg: string;
    bgLight: string;
    border: string;
    text: string;
  };
}

export const ProductionTaskCard = ({
  task,
  onStatusChange,
  departmentColor,
}: ProductionTaskCardProps) => {
  const { isAdmin } = useAuth();

  const progress = task.target_quantity > 0
    ? Math.round((task.completed_quantity / task.target_quantity) * 100)
    : 0;

  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return <Badge variant="secondary">ממתין</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">בביצוע</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">הושלם</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">בוטל</Badge>;
    }
  };

  const getPriorityIndicator = () => {
    if (task.priority === 2) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          דחוף
        </Badge>
      );
    }
    if (task.priority === 1) {
      return <Badge variant="outline" className="border-orange-400 text-orange-600">עדיפות גבוהה</Badge>;
    }
    return null;
  };

  return (
    <Card className={cn(
      "transition-all",
      task.status === 'completed' && "opacity-60",
      task.priority === 2 && "border-red-300 bg-red-50/30"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{task.name}</h4>
              {getPriorityIndicator()}
            </div>
            
            {task.event && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>{task.event.name}</span>
                <span>•</span>
                <span>{task.event.time}</span>
                {task.event.client && (
                  <>
                    <span>•</span>
                    <span>{task.event.client.name}</span>
                  </>
                )}
              </div>
            )}

            {task.task_type === 'stock' && task.reserve_item && (
              <p className="text-sm text-muted-foreground mt-1">
                לרזרבה: {task.reserve_item.name}
              </p>
            )}
          </div>

          <div className="text-left shrink-0">
            <p className="text-xl font-bold">{task.target_quantity}</p>
            <p className="text-xs text-muted-foreground">{task.unit}</p>
          </div>
        </div>

        {/* Progress (for in-progress tasks) */}
        {task.status === 'in-progress' && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>התקדמות</span>
              <span>{task.completed_quantity}/{task.target_quantity} ({progress}%)</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {getStatusBadge()}
          
          {task.assigned_to && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{task.assigned_to}</span>
            </div>
          )}

          {task.started_at && task.status === 'in-progress' && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(task.started_at), { locale: he, addSuffix: false })}
              </span>
            </div>
          )}

          {task.recipe && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <ChefHat className="w-3 h-3" />
              <span>{task.recipe.name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isAdmin && task.status !== 'completed' && task.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2 border-t">
            {task.status === 'pending' && (
              <Button
                size="sm"
                className={cn("gap-1", departmentColor.bg, "hover:opacity-90")}
                onClick={() => onStatusChange(task.id, 'in-progress')}
              >
                <Play className="w-4 h-4" />
                התחל
              </Button>
            )}

            {task.status === 'in-progress' && (
              <Button
                size="sm"
                className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => onStatusChange(task.id, 'completed')}
              >
                <Check className="w-4 h-4" />
                סיום
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => onStatusChange(task.id, 'cancelled')}
            >
              <X className="w-4 h-4" />
              בטל
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

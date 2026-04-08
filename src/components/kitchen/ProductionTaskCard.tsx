import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Play,
  Check,
  X,
  Clock,
  Users,
  ChefHat,
  Calendar,
  AlertTriangle,
  PackageCheck,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { ProductionTask, TaskStatus } from '@/hooks/useKitchenOps';
import { useAuthContext } from '@/context/AuthContext';
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
  const { isAdmin, isDemo } = useAuthContext();
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const progress = task.target_quantity > 0
    ? Math.round((task.completed_quantity / task.target_quantity) * 100)
    : 0;

  const handleStart = async () => {
    setStarting(true);
    await onStatusChange(task.id, 'in-progress');
    setStarting(false);
  };

  const handleComplete = async () => {
    setCompleting(true);
    await onStatusChange(task.id, 'completed');
    setCompleting(false);
    setConfirmDialogOpen(false);
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />ממתין</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 gap-1 animate-pulse"><Play className="w-3 h-3" />בביצוע</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 gap-1"><Check className="w-3 h-3" />הושלם</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />בוטל</Badge>;
    }
  };

  const getPriorityIndicator = () => {
    if (task.priority >= 3) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          דחוף
        </Badge>
      );
    }
    if (task.priority >= 2) {
      return <Badge variant="outline" className="border-orange-400 text-orange-600">עדיפות גבוהה</Badge>;
    }
    return null;
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'pending': return 'border-r-muted-foreground/30';
      case 'in-progress': return 'border-r-blue-500';
      case 'completed': return 'border-r-green-500';
      case 'cancelled': return 'border-r-destructive';
    }
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-300 border-r-4 hover:shadow-lg hover:-translate-y-0.5",
        getStatusColor(),
        task.status === 'completed' && "opacity-60",
        task.status === 'in-progress' && "ring-1 ring-blue-200 shadow-md",
        task.priority >= 3 && task.status === 'pending' && "border-red-300 bg-red-50/30"
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
            <div className="space-y-1 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-700">🔥 בתהליך הכנה...</span>
                <span className="text-blue-600">{task.completed_quantity}/{task.target_quantity}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {task.started_at && (
                <p className="text-xs text-blue-500 mt-1">
                  התחיל לפני {formatDistanceToNow(new Date(task.started_at), { locale: he })}
                </p>
              )}
            </div>
          )}

          {/* Completed info */}
          {task.status === 'completed' && (
            <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <PackageCheck className="w-4 h-4" />
                <span>הושלם — {task.completed_quantity} {task.unit} הוכנו</span>
              </div>
              {task.completed_at && (
                <p className="text-xs text-green-500 mt-1">
                  הסתיים לפני {formatDistanceToNow(new Date(task.completed_at), { locale: he })}
                </p>
              )}
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

            {task.recipe && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ChefHat className="w-3 h-3" />
                <span>{task.recipe.name}</span>
              </div>
            )}
          </div>

          {/* Actions — clear workflow buttons */}
          {task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="flex gap-2 pt-2 border-t">
              {task.status === 'pending' && (
                <Button
                  size="sm"
                  className={cn("gap-1 flex-1", departmentColor.bg, "hover:opacity-90")}
                  onClick={handleStart}
                  disabled={starting}
                >
                  {starting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  התחל הכנה
                </Button>
              )}

              {task.status === 'in-progress' && (
                <Button
                  size="sm"
                  className="gap-1 flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  <Check className="w-4 h-4" />
                  סיימתי — מוכן לשליחה ✓
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

          {/* Visual flow indicator for pending */}
          {task.status === 'pending' && (
            <p className="text-[10px] text-muted-foreground text-center">
              לחץ "התחל הכנה" → בצע את המשימה → לחץ "סיימתי" → המלאי יתעדכן אוטומטית
            </p>
          )}
        </CardContent>
      </Card>

      {/* Completion confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-green-600" />
              אישור סיום משימה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="font-semibold text-lg">{task.name}</p>
              <p className="text-muted-foreground">
                {task.target_quantity} {task.unit}
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
              <p className="text-sm font-medium text-green-800">מה יקרה אוטומטית:</p>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3" />
                  <span>המשימה תסומן כ"הושלם"</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3 h-3" />
                  <span>כמויות ירדו מהרזרבה/מחסן</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              חזרה
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 gap-1"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              אשר סיום
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

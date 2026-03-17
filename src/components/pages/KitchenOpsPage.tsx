import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  ChefHat,
  Croissant,
  Calendar as CalendarIcon,
  Package,
  ClipboardList,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useKitchenOps, Department, TaskStatus } from '@/hooks/useKitchenOps';
import { useReserve } from '@/hooks/useReserve';
import { useAuth } from '@/hooks/useAuth';
import { ProductionTaskCard } from '@/components/kitchen/ProductionTaskCard';
import { ProductionTaskDialog } from '@/components/kitchen/ProductionTaskDialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export const KitchenOpsPage = () => {
  const { canWrite } = useAuth();
  const {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTaskStatus,
    generateTasksFromEvents,
    getProgress,
  } = useKitchenOps();
  const { items: reserveItems, consume } = useReserve();

  const [selectedDepartment, setSelectedDepartment] = useState<Department>('kitchen');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const formattedDate = format(selectedDate, 'EEEE, dd MMMM', { locale: he });
  const progress = getProgress();

  const departmentColors = {
    bakery: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
    },
    kitchen: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
    },
  };

  const colors = departmentColors[selectedDepartment];

  useEffect(() => {
    fetchTasks(selectedDate, selectedDepartment);
  }, [selectedDate, selectedDepartment, fetchTasks]);

  const handleGenerateTasks = async () => {
    setGenerating(true);
    await generateTasksFromEvents(selectedDate, selectedDepartment);
    await fetchTasks(selectedDate, selectedDepartment);
    setGenerating(false);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    const completedQuantity = status === 'completed' ? task?.target_quantity : undefined;
    await updateTaskStatus(taskId, status, completedQuantity);
    await fetchTasks(selectedDate, selectedDepartment);
  };

  const handleCreateTask = async (data: any) => {
    await createTask(data);
    await fetchTasks(selectedDate, selectedDepartment);
  };

  // Separate tasks by type
  const stockTasks = tasks.filter(t => t.task_type === 'stock');
  const eventTasks = tasks.filter(t => t.task_type === 'event');

  // Stats
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            פוסט מטבח
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                בחר תאריך
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {canWrite && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleGenerateTasks}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                ייצר מאירועים
              </Button>
              <Button className="gap-2" onClick={() => setTaskDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                משימה חדשה
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      {tasks.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-sm">ממתין: {pendingCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">בביצוע: {inProgressCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">הושלם: {completedCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 min-w-[200px]">
                <Progress value={progress.percent} className="h-2 flex-1" />
                <span className="text-sm font-medium">{progress.percent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Tabs */}
      <Tabs
        value={selectedDepartment}
        onValueChange={(v) => setSelectedDepartment(v as Department)}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="kitchen" className="gap-2">
            <ChefHat className="w-4 h-4" />
            מטבח
          </TabsTrigger>
          <TabsTrigger value="bakery" className="gap-2">
            <Croissant className="w-4 h-4" />
            קונדיטוריה
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedDepartment} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                    colors.bgLight
                  )}>
                    <CheckCircle className={cn("w-8 h-8", colors.text)} />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    אין משימות להיום
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    ניתן ליצור משימות חדשות או לייצר אוטומטית מאירועים מתוכננים
                  </p>
                  {canWrite && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleGenerateTasks}>
                        <RefreshCw className="w-4 h-4 ml-2" />
                        ייצר מאירועים
                      </Button>
                      <Button onClick={() => setTaskDialogOpen(true)}>
                        <Plus className="w-4 h-4 ml-2" />
                        משימה חדשה
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Production Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    ייצור למלאי
                    <Badge variant="secondary">{stockTasks.length}</Badge>
                  </h2>
                </div>

                {stockTasks.length > 0 ? (
                  <div className="space-y-3">
                    {stockTasks.map((task) => (
                      <ProductionTaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        departmentColor={colors}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>אין משימות ייצור למלאי</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Event Orders Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    הזמנות לאירועים
                    <Badge variant="secondary">{eventTasks.length}</Badge>
                  </h2>
                </div>

                {eventTasks.length > 0 ? (
                  <div className="space-y-3">
                    {eventTasks.map((task) => (
                      <ProductionTaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        departmentColor={colors}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>אין הזמנות לאירועים</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <ProductionTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        department={selectedDepartment}
        date={selectedDate}
        onSave={handleCreateTask}
      />
    </div>
  );
};

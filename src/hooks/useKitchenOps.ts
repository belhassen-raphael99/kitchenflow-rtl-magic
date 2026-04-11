import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export type Department = 'kitchen' | 'bakery';
export type TaskType = 'stock' | 'event';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface ProductionTask {
  id: string;
  date: string;
  department: Department;
  task_type: TaskType;
  recipe_id: string | null;
  reserve_item_id: string | null;
  event_id: string | null;
  name: string;
  target_quantity: number;
  completed_quantity: number;
  unit: string;
  status: TaskStatus;
  priority: number;
  assigned_to: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  event?: {
    id: string;
    name: string;
    time: string;
    guests: number;
    client?: {
      name: string;
    };
  };
  recipe?: {
    id: string;
    name: string;
  };
  reserve_item?: {
    id: string;
    name: string;
  };
}

export interface ProductionTaskFormData {
  date: string;
  department: Department;
  task_type: TaskType;
  recipe_id?: string;
  reserve_item_id?: string;
  event_id?: string;
  name: string;
  target_quantity: number;
  unit: string;
  priority?: number;
  assigned_to?: string;
  notes?: string;
}

export function useKitchenOps() {
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async (date?: Date, department?: Department) => {
    setLoading(true);

    let query = supabase
      .from('production_tasks')
      .select(`
        *,
        event:events(id, name, time, guests, client:clients(name)),
        recipe:recipes(id, name),
        reserve_item:reserve_items(id, name)
      `)
      .order('priority', { ascending: false })
      .order('created_at');

    if (date) {
      query = query.eq('date', format(date, 'yyyy-MM-dd'));
    }

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'שגיאה בטעינת משימות',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setTasks((data || []) as ProductionTask[]);
    }

    setLoading(false);
  }, [toast]);

  const createTask = async (data: ProductionTaskFormData): Promise<ProductionTask | null> => {
    const { data: task, error } = await supabase
      .from('production_tasks')
      .insert([{
        date: data.date,
        department: data.department,
        task_type: data.task_type,
        recipe_id: data.recipe_id || null,
        reserve_item_id: data.reserve_item_id || null,
        event_id: data.event_id || null,
        name: data.name,
        target_quantity: data.target_quantity,
        unit: data.unit,
        priority: data.priority || 0,
        assigned_to: data.assigned_to || null,
        notes: data.notes || null,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'שגיאה ביצירת משימה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    toast({
      title: 'משימה נוצרה בהצלחה',
    });

    return task as ProductionTask;
  };

  const updateTaskStatus = async (
    id: string, 
    status: TaskStatus, 
    completedQuantity?: number
  ): Promise<boolean> => {
    const updates: Record<string, unknown> = { status };

    if (status === 'in-progress' && !tasks.find(t => t.id === id)?.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      if (completedQuantity !== undefined) {
        updates.completed_quantity = completedQuantity;
      }
    }

    const { error } = await supabase
      .from('production_tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה בעדכון סטטוס',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    const statusLabels: Record<TaskStatus, string> = {
      pending: 'ממתין',
      'in-progress': 'בביצוע',
      completed: 'הושלם',
      cancelled: 'בוטל',
    };

    toast({
      title: `סטטוס עודכן: ${statusLabels[status]}`,
    });

    return true;
  };

  const updateTask = async (id: string, data: Partial<ProductionTaskFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('production_tasks')
      .update({
        name: data.name,
        target_quantity: data.target_quantity,
        unit: data.unit,
        priority: data.priority,
        assigned_to: data.assigned_to || null,
        notes: data.notes || null,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה בעדכון משימה',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'משימה עודכנה בהצלחה' });
    return true;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('production_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה במחיקת משימה',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'משימה נמחקה' });
    return true;
  };

  // Generate tasks from events for a specific date
  const generateTasksFromEvents = async (date: Date, department: Department): Promise<number> => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Fetch events for the date
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id, name, time, guests,
        items:event_items(id, name, quantity, recipe_id)
      `)
      .eq('date', dateStr)
      .neq('status', 'cancelled');

    if (eventsError || !events) {
      toast({
        title: 'שגיאה בטעינת אירועים',
        description: eventsError?.message,
        variant: 'destructive',
      });
      return 0;
    }

    // Check existing tasks to avoid duplicates
    const { data: existingTasks } = await supabase
      .from('production_tasks')
      .select('event_id, name')
      .eq('date', dateStr)
      .eq('department', department);

    const existingKeys = new Set(
      (existingTasks || []).map(t => `${t.event_id}-${t.name}`)
    );

    const newTasks: Array<{
      date: string; department: string; task_type: string;
      event_id: string; recipe_id: string | null;
      name: string; target_quantity: number; unit: string; priority: number;
    }> = [];

    for (const event of events) {
      const items = (event.items || []) as Array<{
        id: string;
        name: string;
        quantity: number;
        recipe_id: string | null;
      }>;

      for (const item of items) {
        const key = `${event.id}-${item.name}`;
        if (existingKeys.has(key)) continue;

        newTasks.push({
          date: dateStr,
          department,
          task_type: 'event',
          event_id: event.id,
          recipe_id: item.recipe_id,
          name: item.name,
          target_quantity: item.quantity,
          unit: 'מנה',
          priority: 1,
        });
      }
    }

    if (newTasks.length > 0) {
      await supabase.from('production_tasks').insert(newTasks);
    }

    const createdCount = newTasks.length;

    if (createdCount > 0) {
      toast({
        title: `נוצרו ${createdCount} משימות מאירועים`,
      });
    }

    return createdCount;
  };

  const getTasksByStatus = (status: TaskStatus): ProductionTask[] => {
    return tasks.filter(t => t.status === status);
  };

  const getTasksByType = (type: TaskType): ProductionTask[] => {
    return tasks.filter(t => t.task_type === type);
  };

  const getProgress = () => {
    if (tasks.length === 0) return { total: 0, completed: 0, percent: 0 };
    const completed = tasks.filter(t => t.status === 'completed').length;
    return {
      total: tasks.length,
      completed,
      percent: Math.round((completed / tasks.length) * 100),
    };
  };

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    generateTasksFromEvents,
    getTasksByStatus,
    getTasksByType,
    getProgress,
  };
}

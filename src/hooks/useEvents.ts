import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isSameDay, differenceInDays } from 'date-fns';
import { EventWizardData } from '@/components/agenda/EventWizard';

export type EventStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

export interface EventWithClient {
  id: string;
  client_id: string | null;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: EventStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  delivery_address: string | null;
  delivery_time: string | null;
  invoice_amount: number | null;
  invoice_status: string | null;
  event_type: string | null;
  clients: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

export interface EventFormData {
  name: string;
  date: Date;
  time: string;
  client_id?: string;
  guests: number;
  status: EventStatus;
  notes?: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<EventWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          clients (
            id,
            name,
            phone
          )
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setEvents((data as EventWithClient[]) || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'שגיאה בטעינת אירועים',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getEventsForDate = useCallback((date: Date): EventWithClient[] => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  }, [events]);

  const getDatesWithEvents = useCallback((): Date[] => {
    const uniqueDates = [...new Set(events.map(event => event.date))];
    return uniqueDates.map(dateStr => parseISO(dateStr));
  }, [events]);

  const createEventFromWizard = async (data: EventWizardData): Promise<{ success: boolean; departments: string[] }> => {
    try {
      // 1. Create or link client
      let clientId = data.client_id;
      if (!clientId && data.client_name) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: data.client_name,
            phone: data.client_phone || null,
            email: data.client_email || null,
          })
          .select()
          .single();
        if (!clientError && newClient) clientId = newClient.id;
      }

      // 2. Create the event
      const eventName = `${data.event_type} — ${data.client_name}`;
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          name: eventName,
          date: format(data.date, 'yyyy-MM-dd'),
          time: data.time,
          guests: data.guests,
          status: 'pending',
          notes: data.notes || null,
          client_id: clientId || null,
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          client_email: data.client_email || null,
          delivery_address: data.delivery_address || null,
          delivery_time: data.delivery_time || null,
          event_type: data.event_type,
          invoice_status: 'sent',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // 3. Insert event items
      if (data.items.length > 0) {
        const itemRows = data.items.map(item => ({
          event_id: newEvent.id,
          name: item.recipe_name,
          quantity: item.quantity,
          recipe_id: item.recipe_id,
          department: item.department,
          notes: item.notes || null,
        }));
        await supabase.from('event_items').insert(itemRows);
      }

      // 4. Create production tasks per department
      const departments = [...new Set(data.items.map(i => i.department))];
      const daysUntil = differenceInDays(data.date, new Date());

      if (departments.length > 0) {
        const taskRows = departments.map(dept => ({
          event_id: newEvent.id,
          date: format(data.date, 'yyyy-MM-dd'),
          department: dept === 'מטבח' ? 'kitchen' : dept === 'מאפייה' ? 'bakery' : 'kitchen',
          status: 'pending',
          name: `הכנות ל${data.event_type} — ${data.client_name}`,
          notes: `${dept} | ${data.guests} אורחים | ${data.items.filter(i => i.department === dept).length} מנות`,
          priority: daysUntil <= 3 ? 3 : 1,
          target_quantity: data.items.filter(i => i.department === dept).reduce((sum, i) => sum + i.quantity, 0),
          unit: 'מנות',
          task_type: 'event',
        }));
        await supabase.from('production_tasks').insert(taskRows);
      }

      // 5. Send notification
      await supabase.from('notifications').insert({
        title: '🎉 הזמנה חדשה התקבלה',
        message: `${data.event_type} — ${data.client_name} | ${format(data.date, 'dd/MM/yyyy')} | ${data.guests} אורחים`,
        severity: 'info',
        type: 'new_order',
      });

      await fetchEvents();

      toast({
        title: 'אירוע נוצר בהצלחה',
        description: `${eventName} נוסף ליומן`,
      });

      return { success: true, departments };
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'שגיאה ביצירת אירוע',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, departments: [] };
    }
  };

  const updateEvent = async (id: string, eventData: Partial<EventFormData>): Promise<boolean> => {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (eventData.name !== undefined) updateData.name = eventData.name;
      if (eventData.date !== undefined) updateData.date = format(eventData.date, 'yyyy-MM-dd');
      if (eventData.time !== undefined) updateData.time = eventData.time;
      if (eventData.client_id !== undefined) updateData.client_id = eventData.client_id || null;
      if (eventData.guests !== undefined) updateData.guests = eventData.guests;
      if (eventData.status !== undefined) updateData.status = eventData.status;
      if (eventData.notes !== undefined) updateData.notes = eventData.notes || null;

      const { error } = await supabase.from('events').update(updateData).eq('id', id);
      if (error) throw error;
      await fetchEvents();
      toast({ title: 'אירוע עודכן בהצלחה' });
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({ title: 'שגיאה בעדכון אירוע', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      // Delete related items and tasks first
      await supabase.from('event_items').delete().eq('event_id', id);
      await supabase.from('production_tasks').delete().eq('event_id', id);
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(event => event.id !== id));
      toast({ title: 'אירוע נמחק בהצלחה' });
      return true;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({ title: 'שגיאה במחיקת אירוע', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    fetchEvents,
    getEventsForDate,
    getDatesWithEvents,
    createEventFromWizard,
    updateEvent,
    deleteEvent,
  };
};

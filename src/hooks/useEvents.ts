import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isSameDay } from 'date-fns';

export type EventStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

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

  const createEvent = async (eventData: EventFormData): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: eventData.name,
          date: format(eventData.date, 'yyyy-MM-dd'),
          time: eventData.time,
          client_id: eventData.client_id || null,
          guests: eventData.guests,
          status: eventData.status,
          notes: eventData.notes || null,
        })
        .select(`
          *,
          clients (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data as EventWithClient].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      }));

      toast({
        title: 'אירוע נוצר בהצלחה',
        description: `${eventData.name} נוסף ליומן`,
      });
      return true;
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'שגיאה ביצירת אירוע',
        description: error.message,
        variant: 'destructive',
      });
      return false;
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

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Refetch to get updated client data
      await fetchEvents();

      toast({
        title: 'אירוע עודכן בהצלחה',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: 'שגיאה בעדכון אירוע',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: 'אירוע נמחק בהצלחה',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: 'שגיאה במחיקת אירוע',
        description: error.message,
        variant: 'destructive',
      });
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
    createEvent,
    updateEvent,
    deleteEvent,
  };
};

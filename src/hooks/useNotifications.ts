import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 'low_stock' | 'expiring' | 'upcoming_event' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  related_table: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, severity, is_read, type, created_at, user_id, related_id, related_table, read_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications((data || []) as Notification[]);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    await fetchNotifications();
    return true;
  };

  const markAllAsRead = async (): Promise<boolean> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false);

    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לסמן את ההתראות כנקראו',
        variant: 'destructive',
      });
      return false;
    }

    await fetchNotifications();
    toast({ title: 'כל ההתראות סומנו כנקראו' });
    return true;
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    await fetchNotifications();
    return true;
  };

  const clearAllNotifications = async (): Promise<boolean> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את ההתראות',
        variant: 'destructive',
      });
      return false;
    }

    await fetchNotifications();
    toast({ title: 'כל ההתראות נמחקו' });
    return true;
  };

  const refreshAlerts = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('check-alerts');

      if (error) {
        throw error;
      }

      await fetchNotifications();
      toast({ title: 'התראות עודכנו' });
      return true;
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      toast({
        title: 'שגיאה בעדכון התראות',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshAlerts,
  };
}

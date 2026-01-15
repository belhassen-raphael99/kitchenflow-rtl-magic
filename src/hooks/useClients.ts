import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'שגיאה בטעינת לקוחות',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (clientData: ClientFormData): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          phone: clientData.phone || null,
          email: clientData.email || null,
          address: clientData.address || null,
          notes: clientData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: 'לקוח נוצר בהצלחה',
        description: `${clientData.name} נוסף לרשימת הלקוחות`,
      });
      return data;
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: 'שגיאה ביצירת לקוח',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateClient = async (id: string, clientData: Partial<ClientFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...clientData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setClients(prev =>
        prev.map(client =>
          client.id === id ? { ...client, ...clientData, updated_at: new Date().toISOString() } : client
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({
        title: 'לקוח עודכן בהצלחה',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: 'שגיאה בעדכון לקוח',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));
      toast({
        title: 'לקוח נמחק בהצלחה',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: 'שגיאה במחיקת לקוח',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};

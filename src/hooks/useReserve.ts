import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StorageType = 'frozen' | 'refrigerated' | 'ambient';
export type ProductionAction = 'produced' | 'consumed' | 'adjusted' | 'expired';

export interface ReserveItem {
  id: string;
  name: string;
  recipe_id: string | null;
  storage_type: StorageType;
  quantity: number;
  unit: string;
  min_stock: number;
  expiry_date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  recipe?: {
    id: string;
    name: string;
  };
}

export interface ProductionLog {
  id: string;
  reserve_item_id: string;
  action: ProductionAction;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  user_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReserveItemFormData {
  name: string;
  recipe_id?: string;
  storage_type: StorageType;
  quantity: number;
  unit: string;
  min_stock: number;
  expiry_date?: string;
  location?: string;
  notes?: string;
}

export function useReserve() {
  const [items, setItems] = useState<ReserveItem[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('reserve_items')
      .select(`
        id, name, quantity, min_stock, storage_type, unit, expiry_date, location, notes, recipe_id, created_at, updated_at,
        recipe:recipes(id, name)
      `)
      .order('name');

    if (error) {
      toast({
        title: 'שגיאה בטעינת פריטי רזרבה',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setItems((data || []) as ReserveItem[]);
    }

    setLoading(false);
  }, [toast]);

  const fetchLogs = useCallback(async (reserveItemId?: string) => {
    let query = supabase
      .from('production_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (reserveItemId) {
      query = query.eq('reserve_item_id', reserveItemId);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'שגיאה בטעינת יומן ייצור',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setLogs((data || []) as ProductionLog[]);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (data: ReserveItemFormData): Promise<ReserveItem | null> => {
    const { data: item, error } = await supabase
      .from('reserve_items')
      .insert([{
        name: data.name,
        recipe_id: data.recipe_id || null,
        storage_type: data.storage_type,
        quantity: data.quantity,
        unit: data.unit,
        min_stock: data.min_stock,
        expiry_date: data.expiry_date || null,
        location: data.location || null,
        notes: data.notes || null,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'שגיאה ביצירת פריט',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    // Log initial production if quantity > 0
    if (data.quantity > 0) {
      await logProduction(item.id, 'produced', data.quantity, 0, data.quantity);
    }

    toast({
      title: 'פריט נוצר בהצלחה',
      description: `הפריט "${data.name}" נוסף לרזרבה`,
    });

    await fetchItems();
    return item as ReserveItem;
  };

  const updateItem = async (id: string, data: Partial<ReserveItemFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('reserve_items')
      .update({
        name: data.name,
        recipe_id: data.recipe_id || null,
        storage_type: data.storage_type,
        unit: data.unit,
        min_stock: data.min_stock,
        expiry_date: data.expiry_date || null,
        location: data.location || null,
        notes: data.notes || null,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה בעדכון פריט',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'פריט עודכן בהצלחה' });
    await fetchItems();
    return true;
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('reserve_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה במחיקת פריט',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'פריט נמחק בהצלחה' });
    await fetchItems();
    return true;
  };

  const logProduction = async (
    reserveItemId: string,
    action: ProductionAction,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    notes?: string
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('production_logs')
      .insert([{
        reserve_item_id: reserveItemId,
        action,
        quantity,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        user_id: user?.id || null,
        notes: notes || null,
      }]);

    if (error) {
      console.error('Error logging production:', error);
      return false;
    }

    return true;
  };

  const adjustQuantity = async (
    id: string,
    newQuantity: number,
    action: ProductionAction,
    notes?: string
  ): Promise<boolean> => {
    const item = items.find(i => i.id === id);
    if (!item) return false;

    const previousQuantity = item.quantity;
    const quantityDiff = Math.abs(newQuantity - previousQuantity);

    const { error } = await supabase
      .from('reserve_items')
      .update({ quantity: newQuantity })
      .eq('id', id);

    if (error) {
      toast({
        title: 'שגיאה בעדכון כמות',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await logProduction(id, action, quantityDiff, previousQuantity, newQuantity, notes);

    const actionLabels: Record<ProductionAction, string> = {
      produced: 'יוצר',
      consumed: 'נצרך',
      adjusted: 'עודכן',
      expired: 'פג תוקף',
    };

    toast({
      title: `מלאי ${actionLabels[action]}`,
      description: `${item.name}: ${previousQuantity} → ${newQuantity} ${item.unit}`,
    });

    await fetchItems();
    return true;
  };

  const produce = async (id: string, quantity: number, notes?: string): Promise<boolean> => {
    const item = items.find(i => i.id === id);
    if (!item) return false;
    return adjustQuantity(id, item.quantity + quantity, 'produced', notes);
  };

  const consume = async (id: string, quantity: number, notes?: string): Promise<boolean> => {
    const item = items.find(i => i.id === id);
    if (!item) return false;
    const newQty = Math.max(0, item.quantity - quantity);
    return adjustQuantity(id, newQty, 'consumed', notes);
  };

  const getLowStockItems = (): ReserveItem[] => {
    return items.filter(item => item.quantity <= item.min_stock);
  };

  const getExpiringItems = (daysAhead: number = 7): ReserveItem[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return items.filter(item => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      return expiry <= futureDate;
    });
  };

  const getItemsByStorageType = (type: StorageType): ReserveItem[] => {
    return items.filter(item => item.storage_type === type);
  };

  return {
    items,
    logs,
    loading,
    fetchItems,
    fetchLogs,
    createItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    produce,
    consume,
    getLowStockItems,
    getExpiringItems,
    getItemsByStorageType,
  };
}

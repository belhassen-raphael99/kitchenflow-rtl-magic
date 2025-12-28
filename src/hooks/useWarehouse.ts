import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WarehouseItem {
  id: string;
  code: string | null;
  name: string;
  category_id: string | null;
  supplier_id: string | null;
  unit: string;
  price: number;
  quantity: number;
  min_stock: number;
  waste_percent: number;
  status: string;
  category?: Category;
  supplier?: Supplier;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info: string | null;
}

export function useWarehouse() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [itemsRes, categoriesRes, suppliersRes] = await Promise.all([
      supabase.from('warehouse_items').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('suppliers').select('*').order('name'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (suppliersRes.data) setSuppliers(suppliersRes.data);
    
    if (itemsRes.data) {
      const enrichedItems = itemsRes.data.map(item => ({
        ...item,
        category: categoriesRes.data?.find(c => c.id === item.category_id),
        supplier: suppliersRes.data?.find(s => s.id === item.supplier_id),
      }));
      setItems(enrichedItems);
    }
    
    setLoading(false);
  };

  return { items, categories, suppliers, loading, refetch: fetchData };
}

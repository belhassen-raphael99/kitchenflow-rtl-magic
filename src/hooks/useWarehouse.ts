import { useState, useEffect, useCallback } from 'react';
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

const PAGE_SIZE = 50;

export function useWarehouse() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Always fetch categories and suppliers (small tables)
    const [categoriesRes, suppliersRes] = await Promise.all([
      supabase.from('categories').select('id, name, color, icon').order('name'),
      supabase.from('suppliers').select('id, name, contact_info').order('name'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (suppliersRes.data) setSuppliers(suppliersRes.data);

    // Build paginated query
    let query = supabase
      .from('warehouse_items')
      .select('id, name, code, quantity, min_stock, price, unit, status, category_id, supplier_id, waste_percent', { count: 'exact' })
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (categoryFilter) {
      query = query.eq('category_id', categoryFilter);
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const itemsRes = await query;

    setTotalCount(itemsRes.count ?? 0);

    if (itemsRes.data) {
      const enrichedItems = itemsRes.data.map(item => ({
        ...item,
        price: item.price ?? 0,
        waste_percent: item.waste_percent ?? 0,
        category: categoriesRes.data?.find(c => c.id === item.category_id),
        supplier: suppliersRes.data?.find(s => s.id === item.supplier_id),
      }));
      setItems(enrichedItems);
    }

    setLoading(false);
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    items,
    categories,
    suppliers,
    loading,
    refetch: fetchData,
    page,
    setPage,
    totalPages,
    totalCount,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    PAGE_SIZE,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventItemEnriched {
  id: string;
  name: string;
  quantity: number;
  servings: number | null;
  department: string | null;
  notes: string | null;
  recipe_id: string | null;
  recipe_servings: number | null;
  reserveStock: number;
  reserveItemId: string | null;
  toProduce: number;
  hasTask: boolean;
}

export interface IngredientNeed {
  warehouse_item_id: string | null;
  name: string;
  unit: string;
  needed: number;
  available: number;
  missing: number;
  status: 'ok' | 'limit' | 'missing';
  usedIn: string[]; // dish names
}

export type Feasibility = 'ok' | 'partial' | 'critical';

export interface EventProductionData {
  loading: boolean;
  items: EventItemEnriched[];
  ingredients: IngredientNeed[];
  feasibility: Feasibility;
  missingCount: number;
  missingCriticalCount: number;
  refresh: () => Promise<void>;
}

export function useEventProduction(eventId: string | null, enabled = true): EventProductionData & {
  createTaskForItem: (item: EventItemEnriched) => Promise<void>;
  createTasksForAllToProduce: () => Promise<number>;
  addMissingToPurchaseList: () => Promise<void>;
} {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EventItemEnriched[]>([]);
  const [ingredients, setIngredients] = useState<IngredientNeed[]>([]);
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventDept, setEventDept] = useState<string>('מטבח');

  const compute = useCallback(async () => {
    if (!eventId || !enabled) {
      setItems([]); setIngredients([]); return;
    }
    setLoading(true);

    // Event base
    const { data: ev } = await supabase
      .from('events')
      .select('id, date, name, client_name, guests')
      .eq('id', eventId)
      .maybeSingle();
    if (ev) setEventDate(ev.date);

    // Items
    const { data: itemsRows } = await supabase
      .from('event_items')
      .select('id, name, quantity, servings, department, notes, recipe_id')
      .eq('event_id', eventId);

    const itemsList = itemsRows || [];
    if (itemsList.length === 0) {
      setItems([]); setIngredients([]); setLoading(false); return;
    }

    const recipeIds = Array.from(new Set(itemsList.map(i => i.recipe_id).filter(Boolean) as string[]));
    const itemNames = itemsList.map(i => i.name);

    // Recipes (for servings) + ingredients
    const reservePromise = (async () => {
      const results: Array<{ id: string; name: string; recipe_id: string | null; quantity: number }> = [];
      if (recipeIds.length) {
        const { data } = await supabase
          .from('reserve_items')
          .select('id, name, recipe_id, quantity')
          .in('recipe_id', recipeIds);
        if (data) results.push(...data);
      }
      if (itemNames.length) {
        const { data } = await supabase
          .from('reserve_items')
          .select('id, name, recipe_id, quantity')
          .in('name', itemNames);
        if (data) {
          for (const r of data) {
            if (!results.find(x => x.id === r.id)) results.push(r);
          }
        }
      }
      return { data: results };
    })();

    const [recipesRes, ingredientsRes, reserveRes, tasksRes] = await Promise.all([
      recipeIds.length
        ? supabase.from('recipes').select('id, name, servings').in('id', recipeIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string; servings: number | null }> }),
      recipeIds.length
        ? supabase.from('recipe_ingredients').select('recipe_id, name, quantity, unit, warehouse_item_id').in('recipe_id', recipeIds)
        : Promise.resolve({ data: [] as Array<{ recipe_id: string; name: string; quantity: number; unit: string; warehouse_item_id: string | null }> }),
      reservePromise,
      supabase.from('production_tasks').select('id, name, recipe_id').eq('event_id', eventId).eq('task_type', 'event').neq('status', 'cancelled'),
    ]);

    const recipesMap = new Map<string, { servings: number | null }>();
    for (const r of recipesRes.data || []) recipesMap.set(r.id, { servings: r.servings });

    const reserveByRecipe = new Map<string, { id: string; quantity: number }>();
    const reserveByName = new Map<string, { id: string; quantity: number }>();
    for (const rs of reserveRes.data || []) {
      if (rs.recipe_id) reserveByRecipe.set(rs.recipe_id, { id: rs.id, quantity: rs.quantity });
      if (rs.name) reserveByName.set(rs.name, { id: rs.id, quantity: rs.quantity });
    }

    const taskByKey = new Set<string>();
    for (const t of tasksRes.data || []) {
      taskByKey.add(`${t.recipe_id || ''}|${t.name}`);
    }

    // Build enriched items + needs aggregator
    const aggregator = new Map<string, IngredientNeed & { _wid: string | null }>();
    const enrichedItems: EventItemEnriched[] = itemsList.map(it => {
      const rec = it.recipe_id ? recipesMap.get(it.recipe_id) : null;
      const recipeServings = rec?.servings ?? null;
      const reserve = (it.recipe_id && reserveByRecipe.get(it.recipe_id)) || reserveByName.get(it.name) || null;
      const reserveStock = reserve?.quantity ?? 0;
      const toProduce = Math.max(0, it.quantity - reserveStock);

      // Compute ingredient needs only for portion that must be produced
      if (it.recipe_id && toProduce > 0) {
        const recIngs = (ingredientsRes.data || []).filter(ri => ri.recipe_id === it.recipe_id);
        const baseServings = recipeServings && recipeServings > 0 ? recipeServings : 1;
        const batchMultiplier = toProduce / baseServings;
        for (const ing of recIngs) {
          const key = ing.warehouse_item_id || `name:${ing.name}|${ing.unit}`;
          const needed = ing.quantity * batchMultiplier;
          const existing = aggregator.get(key);
          if (existing) {
            existing.needed += needed;
            if (!existing.usedIn.includes(it.name)) existing.usedIn.push(it.name);
          } else {
            aggregator.set(key, {
              warehouse_item_id: ing.warehouse_item_id,
              name: ing.name,
              unit: ing.unit,
              needed,
              available: 0,
              missing: 0,
              status: 'ok',
              usedIn: [it.name],
              _wid: ing.warehouse_item_id,
            });
          }
        }
      }

      return {
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        servings: it.servings,
        department: it.department,
        notes: it.notes,
        recipe_id: it.recipe_id,
        recipe_servings: recipeServings,
        reserveStock,
        reserveItemId: reserve?.id ?? null,
        toProduce,
        hasTask: taskByKey.has(`${it.recipe_id || ''}|${it.name}`),
      };
    });

    // Cross with warehouse stocks
    const wIds = Array.from(aggregator.values()).map(a => a._wid).filter(Boolean) as string[];
    const stockMap = new Map<string, number>();
    if (wIds.length) {
      const { data: ws } = await supabase
        .from('warehouse_items')
        .select('id, quantity')
        .in('id', wIds);
      for (const w of ws || []) stockMap.set(w.id, w.quantity);
    }

    const needsList: IngredientNeed[] = Array.from(aggregator.values()).map(a => {
      const available = a._wid ? (stockMap.get(a._wid) ?? 0) : 0;
      const missing = Math.max(0, a.needed - available);
      let status: 'ok' | 'limit' | 'missing' = 'ok';
      if (a._wid == null) {
        // unknown ingredient mapping → treat as warning
        status = 'limit';
      } else if (available < a.needed) {
        status = available <= 0 ? 'missing' : 'missing';
      } else if (available < a.needed * 1.2) {
        status = 'limit';
      }
      return {
        warehouse_item_id: a.warehouse_item_id,
        name: a.name,
        unit: a.unit,
        needed: Math.round(a.needed * 100) / 100,
        available: Math.round(available * 100) / 100,
        missing: Math.round(missing * 100) / 100,
        status,
        usedIn: a.usedIn,
      };
    }).sort((a, b) => {
      const order = { missing: 0, limit: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });

    // Set department from first item for default task creation
    const firstDept = itemsList.find(i => i.department)?.department || 'מטבח';
    setEventDept(firstDept);

    setItems(enrichedItems);
    setIngredients(needsList);
    setLoading(false);
  }, [eventId, enabled]);

  useEffect(() => { compute(); }, [compute]);

  const missingCount = ingredients.filter(i => i.status === 'missing').length;
  const missingCriticalCount = ingredients.filter(i => i.status === 'missing' && i.available <= 0 && i.needed > 0).length;

  let feasibility: Feasibility = 'ok';
  if (missingCriticalCount > 0) feasibility = 'critical';
  else if (missingCount > 0 || ingredients.some(i => i.status === 'limit')) feasibility = 'partial';

  const createTaskForItem = async (item: EventItemEnriched) => {
    if (!eventId || !eventDate) return;
    if (item.hasTask || item.toProduce <= 0) return;
    await supabase.from('production_tasks').insert([{
      date: eventDate,
      department: item.department || eventDept,
      task_type: 'event',
      event_id: eventId,
      recipe_id: item.recipe_id,
      name: item.name,
      target_quantity: item.toProduce,
      unit: 'מנה',
      priority: 2,
      notes: `אירוע — ${item.toProduce} מנות לייצור`,
    }]);
    await compute();
  };

  const createTasksForAllToProduce = async () => {
    if (!eventId || !eventDate) return 0;
    const candidates = items.filter(i => !i.hasTask && i.toProduce > 0);
    if (candidates.length === 0) return 0;
    const rows = candidates.map(item => ({
      date: eventDate,
      department: item.department || eventDept,
      task_type: 'event' as const,
      event_id: eventId,
      recipe_id: item.recipe_id,
      name: item.name,
      target_quantity: item.toProduce,
      unit: 'מנה',
      priority: 2,
      notes: `אירוע — ${item.toProduce} מנות לייצור`,
    }));
    await supabase.from('production_tasks').insert(rows);
    await compute();
    return rows.length;
  };

  const addMissingToPurchaseList = async () => {
    const missing = ingredients.filter(i => i.status === 'missing' && i.missing > 0);
    if (missing.length === 0) return;
    await supabase.from('purchase_lists').insert([{
      status: 'pending',
      notes: `נוצר אוטומטית מאירוע ${eventId}`,
      items: missing.map(m => ({
        warehouse_item_id: m.warehouse_item_id,
        name: m.name,
        unit: m.unit,
        quantity: m.missing,
        reason: `אירוע ${eventDate} — חסר`,
      })),
    }]);
  };

  return {
    loading,
    items,
    ingredients,
    feasibility,
    missingCount,
    missingCriticalCount,
    refresh: compute,
    createTaskForItem,
    createTasksForAllToProduce,
    addMissingToPurchaseList,
  };
}

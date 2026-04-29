import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import type { CriticalEventAlert } from '@/components/kitchen/CriticalStockAlertDialog';

export function useCriticalStockAlerts() {
  const [alerts, setAlerts] = useState<CriticalEventAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const dayAfter = addDays(today, 1);
    const fromStr = format(today, 'yyyy-MM-dd');
    const toStr = format(dayAfter, 'yyyy-MM-dd');

    // Fetch upcoming events
    const { data: events } = await supabase
      .from('events')
      .select('id, name, client_name, date, time, delivery_time, guests, status')
      .gte('date', fromStr)
      .lte('date', toStr)
      .neq('status', 'cancelled');

    if (!events || events.length === 0) {
      setAlerts([]); setLoading(false); return;
    }

    const eventIds = events.map(e => e.id);

    // All event_items
    const { data: itemsRows } = await supabase
      .from('event_items')
      .select('id, event_id, name, quantity, recipe_id')
      .in('event_id', eventIds);

    const itemsList = itemsRows || [];
    if (itemsList.length === 0) {
      setAlerts([]); setLoading(false); return;
    }

    const recipeIds = Array.from(new Set(itemsList.map(i => i.recipe_id).filter(Boolean) as string[]));
    const itemNames = Array.from(new Set(itemsList.map(i => i.name)));

    const [recipesRes, ingsRes, reserveByRecipeRes, reserveByNameRes] = await Promise.all([
      recipeIds.length
        ? supabase.from('recipes').select('id, servings').in('id', recipeIds)
        : Promise.resolve({ data: [] as Array<{ id: string; servings: number | null }> }),
      recipeIds.length
        ? supabase.from('recipe_ingredients').select('recipe_id, name, quantity, unit, warehouse_item_id').in('recipe_id', recipeIds)
        : Promise.resolve({ data: [] as Array<{ recipe_id: string; name: string; quantity: number; unit: string; warehouse_item_id: string | null }> }),
      recipeIds.length
        ? supabase.from('reserve_items').select('id, recipe_id, name, quantity').in('recipe_id', recipeIds)
        : Promise.resolve({ data: [] as Array<{ id: string; recipe_id: string | null; name: string; quantity: number }> }),
      itemNames.length
        ? supabase.from('reserve_items').select('id, recipe_id, name, quantity').in('name', itemNames)
        : Promise.resolve({ data: [] as Array<{ id: string; recipe_id: string | null; name: string; quantity: number }> }),
    ]);

    const recServings = new Map<string, number>();
    for (const r of recipesRes.data || []) recServings.set(r.id, r.servings || 1);

    const reserveByRecipe = new Map<string, number>();
    const reserveByName = new Map<string, number>();
    for (const r of reserveByRecipeRes.data || []) {
      if (r.recipe_id) reserveByRecipe.set(r.recipe_id, (reserveByRecipe.get(r.recipe_id) || 0) + r.quantity);
    }
    for (const r of reserveByNameRes.data || []) {
      if (r.name) reserveByName.set(r.name, Math.max(reserveByName.get(r.name) || 0, r.quantity));
    }

    // Aggregate need per event
    type Need = { warehouse_item_id: string | null; name: string; unit: string; needed: number };
    const needsPerEvent = new Map<string, Map<string, Need>>();

    for (const it of itemsList) {
      if (!it.recipe_id) continue;
      const reserve = reserveByRecipe.get(it.recipe_id) ?? reserveByName.get(it.name) ?? 0;
      const toProduce = Math.max(0, it.quantity - reserve);
      if (toProduce === 0) continue;
      const baseServ = recServings.get(it.recipe_id) || 1;
      const multiplier = toProduce / baseServ;
      const recIngs = (ingsRes.data || []).filter(ri => ri.recipe_id === it.recipe_id);
      const evMap = needsPerEvent.get(it.event_id) || new Map<string, Need>();
      for (const ing of recIngs) {
        const key = ing.warehouse_item_id || `name:${ing.name}|${ing.unit}`;
        const existing = evMap.get(key);
        const add = ing.quantity * multiplier;
        if (existing) existing.needed += add;
        else evMap.set(key, { warehouse_item_id: ing.warehouse_item_id, name: ing.name, unit: ing.unit, needed: add });
      }
      needsPerEvent.set(it.event_id, evMap);
    }

    // Fetch warehouse stocks
    const allWIds = new Set<string>();
    for (const m of needsPerEvent.values()) {
      for (const n of m.values()) if (n.warehouse_item_id) allWIds.add(n.warehouse_item_id);
    }
    const stockMap = new Map<string, number>();
    if (allWIds.size > 0) {
      const { data: ws } = await supabase
        .from('warehouse_items')
        .select('id, quantity')
        .in('id', Array.from(allWIds));
      for (const w of ws || []) stockMap.set(w.id, w.quantity);
    }

    // Detect critical
    const result: CriticalEventAlert[] = [];
    for (const ev of events) {
      const evMap = needsPerEvent.get(ev.id);
      if (!evMap) continue;
      const missing: Array<{ name: string; missing: number; unit: string }> = [];
      for (const need of evMap.values()) {
        const available = need.warehouse_item_id ? (stockMap.get(need.warehouse_item_id) ?? 0) : 0;
        if (need.warehouse_item_id && available < need.needed) {
          const miss = need.needed - available;
          missing.push({ name: need.name, missing: Math.round(miss * 100) / 100, unit: need.unit });
        }
      }
      if (missing.length > 0) {
        result.push({
          eventId: ev.id,
          eventName: ev.name,
          clientName: ev.client_name,
          date: ev.date,
          time: ev.delivery_time || ev.time,
          guests: ev.guests,
          missingIngredients: missing,
        });
      }
    }

    setAlerts(result);
    setLoading(false);
  }, []);

  useEffect(() => { compute(); }, [compute]);

  const totalMissing = alerts.reduce((s, a) => s + a.missingIngredients.length, 0);

  return { alerts, totalMissing, loading, refresh: compute };
}

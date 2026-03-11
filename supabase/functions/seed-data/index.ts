import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { suppliers, categories, warehouseItems, recipes, reserveItems } = await req.json();
    const summary: Record<string, number> = {};

    // 1. Insert suppliers
    const { data: suppData } = await supabase.from('suppliers').upsert(
      suppliers.map((s: any) => ({ name: s.name })),
      { onConflict: 'name', ignoreDuplicates: true }
    ).select();
    const { data: allSuppliers } = await supabase.from('suppliers').select('id, name');
    const supplierMap = new Map(allSuppliers?.map((s: any) => [s.name, s.id]) || []);
    summary.suppliers = allSuppliers?.length || 0;

    // 2. Insert categories
    const { data: catData } = await supabase.from('categories').upsert(
      categories.map((c: any) => ({ name: c.name, color: c.color })),
      { onConflict: 'name', ignoreDuplicates: true }
    ).select();
    const { data: allCategories } = await supabase.from('categories').select('id, name');
    const categoryMap = new Map(allCategories?.map((c: any) => [c.name, c.id]) || []);
    summary.categories = allCategories?.length || 0;

    // 3. Insert warehouse items in batches
    let whCount = 0;
    const batchSize = 50;
    for (let i = 0; i < warehouseItems.length; i += batchSize) {
      const batch = warehouseItems.slice(i, i + batchSize).map((item: any) => ({
        name: item.name,
        code: item.code || null,
        category_id: categoryMap.get(item.category) || null,
        supplier_id: item.supplier ? supplierMap.get(item.supplier) || null : null,
        price: item.price || 0,
        unit: item.unit || 'יחידה',
        waste_percent: item.waste_percent || 0,
        quantity: 0,
        min_stock: 0,
        status: 'ok',
      }));
      const { data, error } = await supabase.from('warehouse_items').insert(batch).select('id');
      if (error) console.error('Warehouse batch error:', error.message);
      whCount += data?.length || 0;
    }
    summary.warehouse_items = whCount;

    // Get all warehouse items for ingredient matching
    const { data: allWh } = await supabase.from('warehouse_items').select('id, name');
    const whMap = new Map(allWh?.map((w: any) => [w.name, w.id]) || []);

    // 4. Insert recipes and ingredients
    let recipeCount = 0;
    let ingredientCount = 0;
    for (const recipe of recipes) {
      const { data: recData, error: recErr } = await supabase.from('recipes').insert({
        name: recipe.name,
        category: recipe.category,
        instructions: recipe.instructions,
        servings: 1,
      }).select('id').single();

      if (recErr) { console.error('Recipe error:', recipe.name, recErr.message); continue; }
      recipeCount++;

      if (recipe.ingredients?.length > 0) {
        const ingredients = recipe.ingredients.map((ing: any) => ({
          recipe_id: recData.id,
          name: ing.name,
          quantity: ing.quantity || 0,
          unit: ing.unit || 'גרם',
          warehouse_item_id: whMap.get(ing.name) || null,
        }));
        const { data: ingData, error: ingErr } = await supabase.from('recipe_ingredients').insert(ingredients).select('id');
        if (ingErr) console.error('Ingredient error:', recipe.name, ingErr.message);
        ingredientCount += ingData?.length || 0;
      }
    }
    summary.recipes = recipeCount;
    summary.recipe_ingredients = ingredientCount;

    // 5. Insert reserve items
    let resCount = 0;
    for (let i = 0; i < reserveItems.length; i += batchSize) {
      const batch = reserveItems.slice(i, i + batchSize).map((item: any) => ({
        name: item.name,
        location: item.location || null,
        storage_type: item.storage_type || 'frozen',
        quantity: item.quantity || 0,
        min_stock: item.min_stock || 0,
        unit: item.unit || 'יחידה',
      }));
      const { data, error } = await supabase.from('reserve_items').insert(batch).select('id');
      if (error) console.error('Reserve batch error:', error.message);
      resCount += data?.length || 0;
    }
    summary.reserve_items = resCount;

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

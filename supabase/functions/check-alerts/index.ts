import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((h) => origin.endsWith(h))) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  severity: string;
  related_table?: string;
  related_id?: string;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not set");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notifications: NotificationPayload[] = [];
    const today = new Date().toISOString().split("T")[0];
    const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    console.log("Checking for alerts...");

    // 1-4. Parallel queries for independent checks
    const [
      { data: warehouseItems },
      { data: reserveItems },
      { data: expiringItems },
      { data: upcomingEvents },
    ] = await Promise.all([
      supabase
        .from("warehouse_items")
        .select("id, name, quantity, min_stock, unit")
        .or("quantity.eq.0,quantity.lte.min_stock"),
      supabase
        .from("reserve_items")
        .select("id, name, quantity, min_stock, unit")
        .or("quantity.eq.0,quantity.lte.min_stock"),
      supabase
        .from("reserve_items")
        .select("id, name, expiry_date, quantity, unit")
        .not("expiry_date", "is", null)
        .lte("expiry_date", weekFromNow)
        .gt("quantity", 0),
      supabase
        .from("events")
        .select("id, name, date, time, guests, client:clients(name)")
        .gte("date", today)
        .lte("date", tomorrow)
        .neq("status", "cancelled")
        .order("date")
        .order("time"),
    ]);

    // Process warehouse low stock
    if (warehouseItems) {
      for (const item of warehouseItems) {
        const isCritical = item.quantity === 0;
        notifications.push({
          type: "low_stock",
          title: isCritical ? `מלאי אזל: ${item.name}` : `מלאי נמוך: ${item.name}`,
          message: `${item.name}: ${item.quantity} ${item.unit} (מינימום: ${item.min_stock})`,
          severity: isCritical ? "critical" : "warning",
          related_table: "warehouse_items",
          related_id: item.id,
        });
      }
    }

    // Process reserve low stock
    if (reserveItems) {
      for (const item of reserveItems) {
        const isCritical = item.quantity === 0;
        notifications.push({
          type: "low_stock",
          title: isCritical ? `רזרבה אזלה: ${item.name}` : `רזרבה נמוכה: ${item.name}`,
          message: `${item.name}: ${item.quantity} ${item.unit} (מינימום: ${item.min_stock})`,
          severity: isCritical ? "critical" : "warning",
          related_table: "reserve_items",
          related_id: item.id,
        });
      }
    }

    // Process expiring reserve items
    if (expiringItems) {
      for (const item of expiringItems) {
        const isExpired = new Date(item.expiry_date) < new Date();
        notifications.push({
          type: "expiring",
          title: isExpired ? `פג תוקף: ${item.name}` : `תוקף קרוב: ${item.name}`,
          message: `${item.name} (${item.quantity} ${item.unit}) - תאריך תפוגה: ${item.expiry_date}`,
          severity: isExpired ? "critical" : "warning",
          related_table: "reserve_items",
          related_id: item.id,
        });
      }
    }

    // Process upcoming events
    if (upcomingEvents) {
      for (const event of upcomingEvents) {
        const isToday = event.date === today;
        const clientArray = event.client as unknown as Array<{ name: string }> | null;
        const clientName = clientArray?.[0]?.name || "לקוח לא ידוע";
        notifications.push({
          type: "upcoming_event",
          title: isToday ? `אירוע היום: ${event.name}` : `אירוע מחר: ${event.name}`,
          message: `${event.name} - ${clientName} (${event.guests} אורחים) בשעה ${event.time}`,
          severity: isToday ? "warning" : "info",
          related_table: "events",
          related_id: event.id,
        });
      }
    }

    // 5. J-3 Stock shortage check — events in 3 days
    const { data: j3Events } = await supabase
      .from("events")
      .select("id, name, date, guests, client_name")
      .gte("date", today)
      .lte("date", threeDaysFromNow)
      .in("status", ["confirmed", "pending"])
      .order("date");

    if (j3Events && j3Events.length > 0) {
      // Get event items for these events
      const eventIds = j3Events.map((e) => e.id);
      const { data: eventItems } = await supabase
        .from("event_items")
        .select("event_id, name, quantity, recipe_id")
        .in("event_id", eventIds);

      if (eventItems) {
        // Get all recipe ingredients for referenced recipes
        const recipeIds = [...new Set(eventItems.filter((i) => i.recipe_id).map((i) => i.recipe_id!))];
        
        let ingredients: Array<{ recipe_id: string; warehouse_item_id: string | null; quantity: number; name: string }> = [];
        if (recipeIds.length > 0) {
          const { data: ings } = await supabase
            .from("recipe_ingredients")
            .select("recipe_id, warehouse_item_id, quantity, name")
            .in("recipe_id", recipeIds);
          ingredients = ings || [];
        }

        // Calculate total needed per warehouse item
        const neededMap = new Map<string, { name: string; needed: number }>();
        for (const item of eventItems) {
          if (!item.recipe_id) continue;
          const recipeIngs = ingredients.filter((i) => i.recipe_id === item.recipe_id);
          for (const ing of recipeIngs) {
            if (!ing.warehouse_item_id) continue;
            const key = ing.warehouse_item_id;
            const existing = neededMap.get(key) || { name: ing.name, needed: 0 };
            existing.needed += ing.quantity * item.quantity;
            neededMap.set(key, existing);
          }
        }

        // Check against current stock
        if (neededMap.size > 0) {
          const { data: stockItems } = await supabase
            .from("warehouse_items")
            .select("id, name, quantity, unit")
            .in("id", [...neededMap.keys()]);

          if (stockItems) {
            const shortages: string[] = [];
            for (const stockItem of stockItems) {
              const need = neededMap.get(stockItem.id);
              if (need && stockItem.quantity < need.needed) {
                const deficit = Math.ceil(need.needed - stockItem.quantity);
                shortages.push(`${stockItem.name}: חסר ${deficit} ${stockItem.unit}`);
              }
            }

            if (shortages.length > 0) {
              notifications.push({
                type: "stock_shortage",
                title: `⚠️ חוסרים לאירועים ב-3 ימים הקרובים`,
                message: shortages.slice(0, 5).join(" | ") + (shortages.length > 5 ? ` ועוד ${shortages.length - 5}...` : ""),
                severity: "critical",
              });
            }
          }
        }
      }
    }

    // 6. Reminder for production tasks rescheduled to today
    const { data: rescheduledTasks } = await supabase
      .from("production_tasks")
      .select("id, name, target_quantity, unit, rescheduled_from, department")
      .eq("date", today)
      .eq("status", "pending")
      .not("rescheduled_from", "is", null);

    if (rescheduledTasks && rescheduledTasks.length > 0) {
      for (const task of rescheduledTasks) {
        notifications.push({
          type: "system",
          title: `🔔 משימה שנדחתה — להיום`,
          message: `${task.name} (${task.target_quantity} ${task.unit}) הייתה אמורה ב־${task.rescheduled_from} — אל תשכח!`,
          severity: "warning",
          related_table: "production_tasks",
          related_id: task.id,
        });
      }
    }

    console.log(`Found ${notifications.length} notifications to create`);

    // Delete old unread notifications to avoid duplicates
    if (notifications.length > 0) {
      await supabase
        .from("notifications")
        .delete()
        .eq("is_read", false)
        .in("type", ["low_stock", "expiring", "upcoming_event", "stock_shortage", "system"]);
    }

    // Insert new notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications.map((n) => ({
          user_id: null,
          type: n.type,
          title: n.title,
          message: n.message,
          severity: n.severity,
          related_table: n.related_table,
          related_id: n.related_id,
        })));

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: notifications.length,
        notifications: notifications.map((n) => ({ type: n.type, title: n.title, severity: n.severity })),
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-alerts function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

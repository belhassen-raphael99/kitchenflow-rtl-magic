import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  severity: string;
  related_table?: string;
  related_id?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notifications: NotificationPayload[] = [];
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log("Checking for alerts...");

    // 1. Check for low stock in warehouse
    const { data: warehouseItems, error: warehouseError } = await supabase
      .from("warehouse_items")
      .select("id, name, quantity, min_stock, unit")
      .or("quantity.eq.0,quantity.lte.min_stock");

    if (warehouseError) {
      console.error("Error fetching warehouse items:", warehouseError);
    } else if (warehouseItems) {
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

    // 2. Check for low stock in reserve
    const { data: reserveItems, error: reserveError } = await supabase
      .from("reserve_items")
      .select("id, name, quantity, min_stock, unit")
      .or("quantity.eq.0,quantity.lte.min_stock");

    if (reserveError) {
      console.error("Error fetching reserve items:", reserveError);
    } else if (reserveItems) {
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

    // 3. Check for expiring reserve items (within 7 days)
    const { data: expiringItems, error: expiringError } = await supabase
      .from("reserve_items")
      .select("id, name, expiry_date, quantity, unit")
      .not("expiry_date", "is", null)
      .lte("expiry_date", weekFromNow)
      .gt("quantity", 0);

    if (expiringError) {
      console.error("Error fetching expiring items:", expiringError);
    } else if (expiringItems) {
      for (const item of expiringItems) {
        const expiryDate = new Date(item.expiry_date);
        const isExpired = expiryDate < new Date();
        
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

    // 4. Check for upcoming events (today and tomorrow)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, name, date, time, guests, client:clients(name)")
      .gte("date", today)
      .lte("date", tomorrow)
      .neq("status", "cancelled")
      .order("date")
      .order("time");

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    } else if (upcomingEvents) {
      for (const event of upcomingEvents) {
        const isToday = event.date === today;
        const clientArray = event.client as unknown as Array<{ name: string }> | null;
        const clientName = clientArray && clientArray.length > 0 ? clientArray[0].name : "לקוח לא ידוע";
        
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

    console.log(`Found ${notifications.length} notifications to create`);

    // Delete old unread notifications of the same types to avoid duplicates
    if (notifications.length > 0) {
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("is_read", false)
        .in("type", ["low_stock", "expiring", "upcoming_event"]);

      if (deleteError) {
        console.error("Error deleting old notifications:", deleteError);
      }
    }

    // Insert new notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(
          notifications.map((n) => ({
            user_id: null, // For all admins
            type: n.type,
            title: n.title,
            message: n.message,
            severity: n.severity,
            related_table: n.related_table,
            related_id: n.related_id,
          }))
        );

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: notifications.length,
        notifications: notifications.map((n) => ({
          type: n.type,
          title: n.title,
          severity: n.severity,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-alerts function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

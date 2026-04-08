import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  if (origin.endsWith('.lovable.app')) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

function esc(unsafe: string | null | undefined): string {
  if (!unsafe) return "—";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use adminClient for DB queries (service role bypasses RLS)
    const supabase = adminClient;

    // Fetch event
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch event items
    const { data: items } = await supabase
      .from("event_items")
      .select("name, quantity, department, notes")
      .eq("event_id", event_id)
      .order("department", { ascending: true });

    // Fetch production tasks
    const { data: tasks } = await supabase
      .from("production_tasks")
      .select("name, status, department, target_quantity, completed_quantity, unit")
      .eq("event_id", event_id);

    // Group items by department
    const departments: Record<string, typeof items> = {};
    for (const item of items || []) {
      const dept = item.department || "כללי";
      if (!departments[dept]) departments[dept] = [];
      departments[dept].push(item);
    }

    const deptColors: Record<string, string> = {
      "מטבח": "#E67E22",
      "מאפייה": "#8E44AD",
      "קונדיטוריה": "#E91E63",
      "כללי": "#607D8B",
    };

    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString("he-IL", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
      : "";

    const now = new Date().toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

    // Build HTML with XSS-escaped values
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>בון משלוח — ${esc(event.client_name || event.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      direction: rtl;
      background: #f8f9fa;
      color: #1a1a2e;
      padding: 20px;
    }
    .slip {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: white;
      padding: 28px 32px;
    }
    .header h1 { font-size: 22px; margin-bottom: 4px; }
    .header .subtitle { opacity: 0.8; font-size: 14px; }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 20px 32px;
      background: #f1f3f5;
      border-bottom: 1px solid #dee2e6;
    }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 11px; color: #868e96; text-transform: uppercase; font-weight: 600; }
    .meta-value { font-size: 15px; font-weight: 600; }
    .section { padding: 20px 32px; }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dept-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .checklist { list-style: none; }
    .checklist li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #f1f3f5;
      font-size: 14px;
    }
    .checklist li:last-child { border-bottom: none; }
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #adb5bd;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .qty {
      background: #e9ecef;
      padding: 2px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
      white-space: nowrap;
    }
    .item-name { flex: 1; }
    .item-notes { font-size: 12px; color: #868e96; margin-top: 2px; }
    .tasks-summary {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .task-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
    }
    .task-card .dept { font-size: 11px; font-weight: 600; color: #868e96; }
    .task-card .name { font-weight: 600; margin: 4px 0; }
    .task-card .progress { color: #495057; }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-completed { background: #d3f9d8; color: #2b8a3e; }
    .status-pending { background: #fff3bf; color: #e67700; }
    .status-in-progress { background: #d0ebff; color: #1864ab; }
    .notes-box {
      background: #fff9db;
      border: 1px solid #ffe066;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .signature-area {
      margin-top: 40px;
      padding: 20px 32px 32px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    .sig-box {
      flex: 1;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #adb5bd;
      height: 60px;
      margin-bottom: 8px;
    }
    .sig-label { font-size: 12px; color: #868e96; }
    .footer {
      text-align: center;
      padding: 16px;
      font-size: 11px;
      color: #adb5bd;
      border-top: 1px solid #e9ecef;
    }
    @media print {
      body { padding: 0; background: white; }
      .slip { box-shadow: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <h1>📦 בון משלוח</h1>
      <div class="subtitle">${esc(event.event_type) === "—" ? "אירוע" : esc(event.event_type)} — ${esc(event.client_name || event.name)}</div>
    </div>

    <div class="meta">
      <div class="meta-item">
        <span class="meta-label">📅 תאריך אירוע</span>
        <span class="meta-value">${eventDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">⏰ שעת משלוח</span>
        <span class="meta-value">${esc(event.delivery_time || event.time)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">👤 לקוח</span>
        <span class="meta-value">${esc(event.client_name)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">📞 טלפון</span>
        <span class="meta-value">${esc(event.client_phone)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">📍 כתובת משלוח</span>
        <span class="meta-value">${esc(event.delivery_address)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">👥 מספר אורחים</span>
        <span class="meta-value">${event.guests}</span>
      </div>
    </div>

    ${Object.entries(departments).map(([dept, deptItems]) => `
    <div class="section">
      <div class="section-title">
        <span class="dept-dot" style="background: ${deptColors[dept] || "#607D8B"}"></span>
        ${esc(dept)} (${(deptItems || []).length} פריטים)
      </div>
      <ul class="checklist">
        ${(deptItems || []).map(item => `
        <li>
          <div class="checkbox"></div>
          <span class="qty">${item.quantity}×</span>
          <div>
            <div class="item-name">${esc(item.name)}</div>
            ${item.notes ? `<div class="item-notes">${esc(item.notes)}</div>` : ""}
          </div>
        </li>`).join("")}
      </ul>
    </div>`).join("")}

    ${(tasks && tasks.length > 0) ? `
    <div class="section">
      <div class="section-title">📋 סטטוס ייצור</div>
      <div class="tasks-summary">
        ${tasks.map(t => {
          const statusClass = t.status === "completed" ? "status-completed" : t.status === "in-progress" ? "status-in-progress" : "status-pending";
          const statusLabel = t.status === "completed" ? "✓ הושלם" : t.status === "in-progress" ? "בביצוע" : "ממתין";
          return `
        <div class="task-card">
          <div class="dept">${esc(t.department === "kitchen" ? "מטבח" : t.department === "bakery" ? "מאפייה" : t.department)}</div>
          <div class="name">${esc(t.name)}</div>
          <div class="progress">${t.completed_quantity}/${t.target_quantity} ${esc(t.unit)}</div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>`;
        }).join("")}
      </div>
    </div>` : ""}

    ${event.notes ? `
    <div class="section">
      <div class="section-title">📝 הערות</div>
      <div class="notes-box">${esc(event.notes)}</div>
    </div>` : ""}

    <div class="signature-area">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">חתימת השולח</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">חתימת המקבל</div>
      </div>
    </div>

    <div class="footer">
      הופק אוטומטית ב-${now} | KitchenFlow
    </div>
  </div>
</body>
</html>`;

    // Upload HTML to storage
    const slipBlob = new Blob([html], { type: "text/html" });
    const slipPath = `${event_id}/slip_${Date.now()}.html`;

    const { error: uploadErr } = await supabase.storage
      .from("delivery-proofs")
      .upload(slipPath, slipBlob, { contentType: "text/html", upsert: true });

    let slipUrl = "";
    if (!uploadErr) {
      // Use signed URL instead of public URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("delivery-proofs")
        .createSignedUrl(slipPath, 3600);

      if (signedError) {
        console.error("Error creating signed URL:", signedError);
      }
      slipUrl = signedData?.signedUrl || "";

      // Update event
      await supabase.from("events").update({
        delivery_slip_generated: true,
        delivery_slip_url: slipUrl,
      }).eq("id", event_id);
    }

    return new Response(
      JSON.stringify({ success: true, html, slip_url: slipUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorOrigin = getAllowedOrigin(req);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': errorOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', "Content-Type": "application/json" } }
    );
  }
});

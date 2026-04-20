import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((h) => origin.endsWith(h))) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await callerClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminUserId = callerUser.id;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { target_user_id, action } = await req.json();

    if (action === "exit") {
      await serviceClient.from("audit_logs").insert({
        user_id: adminUserId,
        action: "IMPERSONATION_END",
        table_name: "profiles",
        record_id: target_user_id || null,
        new_data: { target_user_id },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (target_user_id === adminUserId) {
      return new Response(JSON.stringify({ error: "Cannot impersonate yourself" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: targetRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id)
      .eq("role", "admin")
      .maybeSingle();

    if (targetRole) {
      return new Response(JSON.stringify({ error: "Cannot impersonate admin users" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: targetUser, error: targetError } = await serviceClient.auth.admin.getUserById(target_user_id);
    if (targetError || !targetUser?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email!,
    });

    if (linkError || !linkData) {
      console.error("Error generating link:", linkError);
      return new Response(JSON.stringify({ error: "Failed to generate impersonation session" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await serviceClient.from("audit_logs").insert({
      user_id: adminUserId,
      action: "IMPERSONATION_START",
      table_name: "profiles",
      record_id: target_user_id,
      new_data: {
        target_email: targetUser.user.email,
        target_user_id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        token_hash: linkData.properties?.hashed_token,
        email: targetUser.user.email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in impersonate-user:", error);
    const errorOrigin = getAllowedOrigin(req);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': errorOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  }
});

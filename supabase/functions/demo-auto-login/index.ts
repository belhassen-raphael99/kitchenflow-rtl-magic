import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEMO_EMAIL = 'demo@casserole.app';
const DEMO_PASSWORD = 'Demo@Casserole2026!Secure';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check if demo user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

    if (!demoUser) {
      // Create the permanent demo user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'משתמש דמו' },
      });

      if (createError) {
        console.error('Failed to create demo user:', createError);
        return new Response(
          JSON.stringify({ error: 'שגיאה ביצירת משתמש דמו' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign demo role (the trigger assigns 'employee', so update to 'demo')
      if (newUser?.user) {
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'demo' })
          .eq('user_id', newUser.user.id);
      }
    }

    // Sign in as demo user
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anonClient = createClient(supabaseUrl, anonKey);

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (signInError || !signInData.session) {
      console.error('Demo sign-in failed:', signInError);
      return new Response(
        JSON.stringify({ error: 'שגיאה בכניסה לדמו' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('demo-auto-login error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEMO_EMAIL = 'demo@casserole.app';
const DEMO_PASSWORD = 'Demo@Casserole2026!Secure';

const resetDemoState = async (supabaseAdmin: ReturnType<typeof createClient>) => {
  const eventResets = [
    { id: '54835a52-e765-4efd-bec1-742600d41533', status: 'confirmed' },
    { id: '9566660a-efdc-4826-a127-02a6cc1e9b05', status: 'confirmed' },
    { id: '06505ccf-08d5-4277-b657-a1cc564945a3', status: 'confirmed' },
    { id: '40bcf2d2-96d3-4750-b85f-795d6a324efb', status: 'pending' },
  ];

  const taskResets = [
    { id: 'b648d2c0-dfce-44b2-b963-e1bb9a39274f', status: 'completed', completed_quantity: 3 },
    { id: '08a17c00-aa15-4a46-a0c1-21b473b08c8e', status: 'completed', completed_quantity: 20 },
    { id: '932f742f-785f-4f4b-8642-afc9988b16ea', status: 'completed', completed_quantity: 20 },
    { id: '9a6396ac-8a20-410f-8595-bef55e05f19d', status: 'pending', completed_quantity: 0 },
    { id: '9ed13ee2-3e4a-4487-a80b-fda638eb1652', status: 'pending', completed_quantity: 0 },
    { id: '21160fd3-b006-4e84-aacc-7fe428bc074e', status: 'pending', completed_quantity: 0 },
    { id: 'fdfea25b-eb5a-4aba-b7b7-54109580a93b', status: 'pending', completed_quantity: 0 },
    { id: '10cd0efe-a240-4df5-8597-2cc10408a1d6', status: 'in-progress', completed_quantity: 0 },
    { id: 'b4c3dcd0-f230-4691-88fc-5aee3ced9f80', status: 'pending', completed_quantity: 0 },
    { id: '396e8983-4987-4ee4-9b95-30f7da8f5f08', status: 'completed', completed_quantity: 300 },
    { id: '099e0797-1aac-4fe9-9552-6f4ba23779f7', status: 'in-progress', completed_quantity: 80 },
    { id: 'a6b3c06d-07f1-48b3-850a-dc358273f7a7', status: 'pending', completed_quantity: 0 },
    { id: '386f62c6-1474-4d1a-8c04-4a0ca752782b', status: 'pending', completed_quantity: 0 },
    { id: '5cd8df2c-cfa6-4311-924b-89b3db898e8e', status: 'completed', completed_quantity: 100 },
  ];

  const reserveResets = [
    { id: '00bea213-ed6e-4aff-bb8f-ba07b22f90cc', quantity: 50 },
    { id: '1f0c55a6-d72d-4659-a243-54dabbeb2e5e', quantity: 8 },
    { id: '42c82821-e164-4685-906c-5d1242ed2cab', quantity: 90 },
    { id: 'e601e3f0-ff42-4462-b9a5-7c3a7bc93ecd', quantity: 30 },
    { id: 'f09fa06f-e33a-4f87-8f91-64fff0c99bcc', quantity: 15 },
    { id: '8871342c-009c-45cb-b294-e83d2986e8bc', quantity: 40 },
    { id: '95cc0fa9-11d4-4ef5-9860-90af40f562b3', quantity: 35 },
    { id: '49d13ed9-fb75-40be-a466-e9fc59021428', quantity: 280 },
    { id: 'b7c6a94d-a298-4469-96c0-d03be610e8e3', quantity: 0 },
    { id: '301737c0-1b61-48d0-935c-391bf2997f0b', quantity: 45 },
    { id: 'e02811a2-19a9-4faa-997c-4ee88f9b7596', quantity: 20 },
  ];

  const notificationResets = [
    { id: '33f722fd-92bf-4e68-a131-d33e3ddf0bd0', is_read: false },
    { id: '5991059e-ec98-4159-82fa-056850209bf4', is_read: false },
    { id: '9a16eca5-ad09-456d-a8d8-d0edc00c2bc0', is_read: false },
    { id: 'e7c22de9-5e18-47c1-a8ea-44656a237018', is_read: true },
    { id: 'a1090c5a-a56b-4283-b384-88277e9050f0', is_read: true },
  ];

  await Promise.all([
    ...eventResets.map((event) =>
      supabaseAdmin.from('events').update({ status: event.status }).eq('id', event.id)
    ),
    ...taskResets.map((task) =>
      supabaseAdmin
        .from('production_tasks')
        .update({ status: task.status, completed_quantity: task.completed_quantity })
        .eq('id', task.id)
    ),
    ...reserveResets.map((item) =>
      supabaseAdmin.from('reserve_items').update({ quantity: item.quantity }).eq('id', item.id)
    ),
    ...notificationResets.map((notification) =>
      supabaseAdmin
        .from('notifications')
        .update({ is_read: notification.is_read })
        .eq('id', notification.id)
    ),
  ]);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find((user) => user.email === DEMO_EMAIL);

    if (!demoUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'משתמש דמו' },
      });

      if (createError || !newUser?.user) {
        console.error('Failed to create demo user:', createError);
        return new Response(JSON.stringify({ error: 'שגיאה ביצירת משתמש דמו' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabaseAdmin.from('user_roles').update({ role: 'demo' }).eq('user_id', newUser.user.id);
      await resetDemoState(supabaseAdmin);
    } else {
      await supabaseAdmin.auth.admin.updateUserById(demoUser.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'משתמש דמו' },
      });

      const adminSignOut = (supabaseAdmin.auth.admin as unknown as {
        signOut?: (userId: string, options?: { scope?: 'global' | 'local' | 'others' }) => Promise<unknown>;
      }).signOut;

      if (typeof adminSignOut === 'function') {
        try {
          await adminSignOut(demoUser.id, { scope: 'others' });
        } catch (error) {
          console.warn('Admin signOut failed, continuing with user session refresh:', error);
        }
      }

      await supabaseAdmin.from('user_roles').update({ role: 'demo' }).eq('user_id', demoUser.id);
      await resetDemoState(supabaseAdmin);
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (signInError || !signInData.session) {
      console.error('Demo sign-in failed:', signInError);
      return new Response(JSON.stringify({ error: 'שגיאה בכניסה לדמו' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      await anonClient.auth.signOut({ scope: 'others' });
    } catch (error) {
      console.warn('Failed to invalidate other demo sessions:', error);
    }

    return new Response(
      JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('demo-auto-login error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { email, token: demoToken } = await req.json();

    if (!email || !demoToken) {
      return new Response(
        JSON.stringify({ error: 'חסרים פרטים נדרשים' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'כתובת אימייל לא תקינה' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validate demo token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('demo_tokens')
      .select('*')
      .eq('token', demoToken)
      .eq('used', false)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'קישור הדמו אינו תקף או פג תוקפו' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'קישור הדמו פג תוקפו' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Rate limiting — max 3 OTP attempts per token
    const currentAttempts = tokenData.otp_attempts || 0;
    if (currentAttempts >= 3) {
      return new Response(
        JSON.stringify({ error: 'יותר מדי בקשות — נסה שוב מאוחר יותר' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment attempts
    await supabaseAdmin
      .from('demo_tokens')
      .update({ otp_attempts: currentAttempts + 1, email })
      .eq('id', tokenData.id);

    // 3. Send OTP using admin API (bypasses signup restrictions)
    const { error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (otpError) {
      console.error('OTP generation error:', otpError);
      return new Response(
        JSON.stringify({ error: 'שגיאה בשליחת הקוד' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Now send the actual OTP email via signInWithOtp using service role
    // generateLink creates the user if needed, now send OTP
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anonClient = createClient(supabaseUrl, anonKey);
    
    const { error: sendError } = await anonClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (sendError) {
      console.error('OTP send error:', sendError);
      return new Response(
        JSON.stringify({ error: 'שגיאה בשליחת הקוד לאימייל' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('demo-otp-signup error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

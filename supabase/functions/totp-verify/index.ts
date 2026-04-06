import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import * as OTPAuth from "https://esm.sh/otpauth@9.3.5";

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  if (origin.endsWith('.lovable.app')) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const code = String(body.code || '').trim();
    const action = body.action || 'verify'; // 'verify' (enable) or 'validate' (login) or 'disable'

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch TOTP record
    const { data: totpRecord, error: fetchError } = await supabase
      .from('user_totp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !totpRecord) {
      return new Response(JSON.stringify({ error: '2FA not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate TOTP code
    const totp = new OTPAuth.TOTP({
      issuer: 'KitchenFlow',
      label: user.email || user.id,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(totpRecord.secret_encrypted),
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      // Check backup codes
      const backupCodes = (totpRecord.backup_codes || []) as string[];
      const codeIndex = backupCodes.indexOf(code);
      if (codeIndex === -1) {
        return new Response(JSON.stringify({ error: 'Invalid code', valid: false }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await supabase
        .from('user_totp')
        .update({ backup_codes: backupCodes })
        .eq('user_id', user.id);
    }

    // Handle action
    if (action === 'verify') {
      // First-time verification — enable 2FA
      await supabase
        .from('user_totp')
        .update({ is_enabled: true, verified_at: new Date().toISOString() })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ valid: true, enabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disable') {
      await supabase
        .from('user_totp')
        .update({ is_enabled: false, verified_at: null, secret_encrypted: '', backup_codes: [] })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ valid: true, disabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action === 'validate' (login flow)
    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

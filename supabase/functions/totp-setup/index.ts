import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import * as OTPAuth from "https://esm.sh/otpauth@9.3.5";
import { encrypt } from "../_shared/crypto.ts";

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

    // Check if TOTP already enabled
    const { data: existing } = await supabase
      .from('user_totp')
      .select('is_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing?.is_enabled) {
      return new Response(JSON.stringify({ error: '2FA is already enabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'KitchenFlow',
      label: user.email || user.id,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    // Generate backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      backupCodes.push(code);
    }

    // Encrypt the secret before storing
    const secretEncrypted = await encrypt(secret);

    // Upsert the TOTP record (not enabled until verified)
    const { error: upsertError } = await supabase
      .from('user_totp')
      .upsert({
        user_id: user.id,
        secret_encrypted: secretEncrypted,
        is_enabled: false,
        backup_codes: backupCodes,
        verified_at: null,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ uri, backup_codes: backupCodes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

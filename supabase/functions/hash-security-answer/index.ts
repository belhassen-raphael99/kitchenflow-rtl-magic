import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";

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
    const { answer, existingHash } = await req.json();
    if (!answer || typeof answer !== 'string' || answer.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Answer must be at least 3 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalized = answer.toLowerCase().trim();
    const encoder = new TextEncoder();

    if (existingHash && typeof existingHash === 'string' && existingHash.includes(':')) {
      // VERIFY mode — extract salt from existing hash and re-derive
      const [saltHex, hashHex] = existingHash.split(':');
      const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
      const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(normalized), 'PBKDF2', false, ['deriveBits']
      );
      const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
      );
      const derivedHex = new TextDecoder().decode(hexEncode(new Uint8Array(derivedBits)));
      return new Response(
        JSON.stringify({ match: derivedHex === hashHex }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HASH mode — generate new salt + PBKDF2 hash
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(normalized), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const saltHex = new TextDecoder().decode(hexEncode(salt));
    const hashHex = new TextDecoder().decode(hexEncode(new Uint8Array(derivedBits)));
    const hash = `${saltHex}:${hashHex}`;

    return new Response(
      JSON.stringify({ hash }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
});

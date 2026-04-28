import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { z } from 'https://esm.sh/zod@3.23.8';

// ============================================
// CORS HEADERS
// ============================================
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');

  if (envOrigin && origin === envOrigin) return origin;

  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((suffix) => origin.endsWith(suffix))) {
    return origin;
  }

  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

/**
 * Build the redirect URL for the invitation email.
 * Prefer the request's real Origin (so an admin inviting from Vercel gets a
 * Vercel link, not a Lovable link), but only if it's an allowed host.
 */
function getInviteRedirectBase(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (origin && allowedHosts.some((suffix) => origin.endsWith(suffix))) {
    return origin;
  }
  return Deno.env.get('ALLOWED_ORIGIN') || 'https://kitchenflow-rtl-magic.lovable.app';
}

// ============================================
// VALIDATION SCHEMAS (Zod)
// ============================================
const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .min(5, 'Email trop court')
  .max(255, 'Email trop long')
  .email('Format email invalide');

const fullNameSchema = z.string()
  .trim()
  .min(2, 'Nom trop court')
  .max(100, 'Nom trop long')
  .transform(s => s.replace(/[^a-zA-Z\u0590-\u05FF\u0600-\u06FF\s\-']/g, ''));

const roleSchema = z.enum(['admin', 'employee']);

const inviteUserSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  role: roleSchema,
});

// ============================================
// SECURITY UTILITIES
// ============================================
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function checkRateLimit(
  client: any,
  identifier: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const { data, error } = await client.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action: action,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return true;
    }

    return data as boolean;
  } catch (err) {
    console.error('Rate limit error:', err);
    return true;
  }
}

function errorResponse(
  userMessage: string,
  status: number,
  corsHeaders: Record<string, string>,
  technicalDetails?: string
): Response {
  if (technicalDetails) {
    console.error(`[ERROR] ${technicalDetails}`);
  }

  return new Response(
    JSON.stringify({ error: userMessage }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function auditLog(action: string, userId: string, details: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
  }));
}

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Méthode non autorisée', 405, corsHeaders);
  }

  try {
    // 1. AUTHENTICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Non authentifié', 401, corsHeaders, 'Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      return errorResponse('Session invalide', 401, corsHeaders, `Auth error: ${userError?.message}`);
    }

    // 2. AUTHORIZATION — admin only
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      auditLog('UNAUTHORIZED_INVITE_ATTEMPT', callerUser.id, { email: callerUser.email });
      return errorResponse('Permissions insuffisantes', 403, corsHeaders, 'Non-admin attempted to invite user');
    }

    // 3. RATE LIMITING — 10 invitations per hour
    const rateLimitPassed = await checkRateLimit(
      adminClient,
      `${callerUser.id}:invite`,
      'invite_user',
      10,
      3600
    );

    if (!rateLimitPassed) {
      auditLog('RATE_LIMITED', callerUser.id, { action: 'invite_user' });
      return errorResponse('Trop de tentatives. Veuillez patienter.', 429, corsHeaders);
    }

    // 4. INPUT VALIDATION
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return errorResponse('Format de requête invalide', 400, corsHeaders, 'Invalid JSON body');
    }

    const validationResult = inviteUserSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return errorResponse('Données invalides', 400, corsHeaders, `Validation failed: ${errors}`);
    }

    const { email, fullName, role } = validationResult.data;

    auditLog('INVITE_USER_START', callerUser.id, { targetEmail: email, role });

    // 5. INVITE USER — Supabase sends a secure one-time invitation link (no password in email)
    const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName },
        redirectTo: `${Deno.env.get('ALLOWED_ORIGIN') || 'https://kitchenflow-rtl-magic.lovable.app'}/reset-password`,
      }
    );

    if (inviteError) {
      if (inviteError.message.includes('already been registered') || inviteError.message.includes('already exists')) {
        return errorResponse('Impossible de créer cet utilisateur', 400, corsHeaders, `User exists: ${email}`);
      }
      return errorResponse('Erreur lors de la création du compte', 400, corsHeaders, inviteError.message);
    }

    // 6. ROLE ASSIGNMENT — cleanup user if this fails
    const { error: roleError } = await adminClient
      .from('user_roles')
      .upsert({ user_id: invitedUser.user.id, role }, { onConflict: 'user_id' });

    if (roleError) {
      // Atomic cleanup: delete the user so they don't exist without a role
      await adminClient.auth.admin.deleteUser(invitedUser.user.id);
      auditLog('INVITE_USER_ROLE_FAILED', callerUser.id, { targetEmail: email, role });
      return errorResponse('Erreur lors de l\'attribution du rôle', 500, corsHeaders, roleError.message);
    }

    auditLog('INVITE_USER_SUCCESS', callerUser.id, {
      targetUserId: invitedUser.user.id,
      targetEmail: email,
      role,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: invitedUser.user.id, email: invitedUser.user.email },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return errorResponse('Une erreur est survenue', 500, corsHeaders);
  }
});

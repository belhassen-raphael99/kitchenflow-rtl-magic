import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================
// CORS HEADERS
// ============================================
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((h) => origin.endsWith(h))) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

// ============================================
// VALIDATION SCHEMAS
// ============================================
const deleteUserSchema = z.object({
  userId: z.string().uuid('Format UUID invalide'),
});

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Rate limiting avec base de données
 */
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

/**
 * Réponse d'erreur sécurisée
 */
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

/**
 * Log d'audit sécurisé
 */
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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
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

    // 2. AUTHORIZATION - Admin only
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      auditLog('UNAUTHORIZED_DELETE_ATTEMPT', callerUser.id, { email: callerUser.email });
      return errorResponse('Permissions insuffisantes', 403, corsHeaders, 'Non-admin attempted to delete user');
    }

    // 3. RATE LIMITING
    const rateLimitPassed = await checkRateLimit(
      adminClient,
      `${callerUser.id}:delete`,
      'delete_user',
      5, // Max 5 suppressions
      3600 // Par heure
    );

    if (!rateLimitPassed) {
      auditLog('RATE_LIMITED', callerUser.id, { action: 'delete_user' });
      return errorResponse('Trop de tentatives. Veuillez patienter.', 429, corsHeaders);
    }

    // 4. INPUT VALIDATION
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return errorResponse('Format de requête invalide', 400, corsHeaders, 'Invalid JSON body');
    }

    const validationResult = deleteUserSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return errorResponse('Données invalides', 400, corsHeaders, `Validation failed: ${errors}`);
    }

    const { userId } = validationResult.data;

    // 5. PREVENT SELF-DELETION
    if (userId === callerUser.id) {
      return errorResponse('Action non autorisée', 400, corsHeaders, 'Attempted self-deletion');
    }

    // 6. VERIFY TARGET USER EXISTS
    const { data: targetUser, error: targetError } = await adminClient.auth.admin.getUserById(userId);
    if (targetError || !targetUser.user) {
      return errorResponse('Utilisateur introuvable', 404, corsHeaders, `User not found: ${userId}`);
    }

    auditLog('DELETE_USER_START', callerUser.id, { 
      targetUserId: userId, 
      targetEmail: targetUser.user.email 
    });

    // 7. DELETE USER DATA (order matters for foreign keys)
    const { error: roleDeleteError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (roleDeleteError) {
      console.error('Role deletion error:', roleDeleteError);
    }

    const { error: profileDeleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Profile deletion error:', profileDeleteError);
    }

    // 8. DELETE AUTH USER
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      auditLog('DELETE_USER_FAILED', callerUser.id, { 
        targetUserId: userId, 
        error: deleteError.message 
      });
      return errorResponse('Erreur lors de la suppression', 500, corsHeaders, deleteError.message);
    }

    // 9. SUCCESS AUDIT
    auditLog('DELETE_USER_SUCCESS', callerUser.id, { 
      targetUserId: userId, 
      targetEmail: targetUser.user.email 
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return errorResponse('Une erreur est survenue', 500, corsHeaders);
  }
});

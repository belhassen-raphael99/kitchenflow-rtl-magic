import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================
// CORS HEADERS
// ============================================
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  if (origin.endsWith('.lovable.app')) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
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

const passwordSchema = z.string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
  .max(128, 'Mot de passe trop long')
  .regex(/[a-z]/, 'Doit contenir une minuscule')
  .regex(/[A-Z]/, 'Doit contenir une majuscule')
  .regex(/[0-9]/, 'Doit contenir un chiffre')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Doit contenir un caractère spécial');

const fullNameSchema = z.string()
  .trim()
  .min(2, 'Nom trop court')
  .max(100, 'Nom trop long')
  .transform(s => s.replace(/[^a-zA-Z\u0590-\u05FF\u0600-\u06FF\s\-']/g, ''));

const roleSchema = z.enum(['admin', 'employee']);

const inviteUserSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  password: passwordSchema,
  role: roleSchema,
});

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Escape HTML pour prévenir XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
      return true; // Allow on error to not block legitimate users
    }
    
    return data as boolean;
  } catch (err) {
    console.error('Rate limit error:', err);
    return true;
  }
}

/**
 * Crée une réponse d'erreur sécurisée (messages génériques)
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
    // Ne pas logger les données sensibles
    details: {
      ...details,
      password: details.password ? '[REDACTED]' : undefined,
    },
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
    // 1. AUTHENTICATION - Vérifier le token JWT
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

    // 2. AUTHORIZATION - Vérifier le rôle admin
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

    // 3. RATE LIMITING - Limiter les invitations
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitPassed = await checkRateLimit(
      adminClient,
      `${callerUser.id}:invite`,
      'invite_user',
      10, // Max 10 invitations
      3600 // Par heure
    );

    if (!rateLimitPassed) {
      auditLog('RATE_LIMITED', callerUser.id, { action: 'invite_user' });
      return errorResponse('Trop de tentatives. Veuillez patienter.', 429, corsHeaders);
    }

    // 4. INPUT VALIDATION - Validation stricte avec Zod
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

    const { email, fullName, password, role } = validationResult.data;

    // 5. BUSINESS LOGIC - Créer l'utilisateur
    auditLog('INVITE_USER_START', callerUser.id, { targetEmail: email, role });

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      // Messages génériques pour ne pas révéler si l'email existe
      if (createError.message.includes('already exists') || createError.message.includes('duplicate')) {
        return errorResponse('Impossible de créer cet utilisateur', 400, corsHeaders, `User exists: ${email}`);
      }
      return errorResponse('Erreur lors de la création du compte', 400, corsHeaders, createError.message);
    }

    // 6. ROLE ASSIGNMENT
    await adminClient.from('user_roles').delete().eq('user_id', newUser.user.id);
    
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Ne pas échouer complètement, l'utilisateur est créé
    }

    // 7. EMAIL NOTIFICATION (optionnel)
    let emailSent = false;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Casserole <onboarding@resend.dev>';
    
    if (resendApiKey) {
      try {
        console.log(`[EMAIL] Attempting to send email to ${email} from ${resendFromEmail}`);
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: [email],
            subject: 'ברוכים הבאים לקסרולה!',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333;">🍳 קסרולה</h1>
                <h2>שלום ${escapeHtml(fullName)}!</h2>
                <p>ברוכים הבאים למערכת קסרולה! חשבונך נוצר בהצלחה.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>פרטי התחברות:</strong></p>
                  <p>📧 אימייל: <strong>${escapeHtml(email)}</strong></p>
                  <p>🔑 סיסמה: <strong>נמסרה לך ע"י מנהל המערכת</strong></p>
                </div>
                <p style="color: #d32f2f;">⚠️ מומלץ לשנות את הסיסמה מיד לאחר ההתחברות הראשונה</p>
              </div>
            `,
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResponse.ok && emailResult.id) {
          emailSent = true;
          console.log(`[EMAIL] Successfully sent email to ${email}, id: ${emailResult.id}`);
        } else {
          console.error(`[EMAIL] Failed to send email:`, emailResult);
        }
      } catch (emailError) {
        console.error('[EMAIL] Error sending email:', emailError);
        // Don't fail the operation
      }
    } else {
      console.log('[EMAIL] RESEND_API_KEY not configured, skipping email');
    }

    // 8. AUDIT LOG - Succès
    auditLog('INVITE_USER_SUCCESS', callerUser.id, { 
      targetUserId: newUser.user.id, 
      targetEmail: email, 
      role,
      emailSent 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: newUser.user.id, email: newUser.user.email },
        emailSent
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return errorResponse('Une erreur est survenue', 500, corsHeaders);
  }
});

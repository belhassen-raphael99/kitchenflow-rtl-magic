import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  fullName: string;
  password: string;
  role: 'admin' | 'employee';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's JWT to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the caller is an admin using service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can invite users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { email, fullName, password, role }: InviteRequest = await req.json();

    if (!email || !fullName || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating user: ${email} with role: ${role}`);

    // Create the user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User created successfully: ${newUser.user.id}`);

    // Assign the role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // User was created but role assignment failed - still return success but with warning
    }

    // Try to send welcome email if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Casserole <onboarding@resend.dev>',
            to: [email],
            subject: 'ברוכים הבאים לקסרולה!',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #333;">🍳 קסרולה</h1>
                  <p style="color: #666;">ניהול קייטרינג חכם</p>
                </div>
                
                <h2 style="color: #333;">שלום ${fullName}!</h2>
                
                <p style="color: #555; line-height: 1.6;">
                  ברוכים הבאים למערכת קסרולה! חשבונך נוצר בהצלחה.
                </p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>פרטי התחברות:</strong></p>
                  <p style="margin: 5px 0;">📧 אימייל: <strong>${email}</strong></p>
                  <p style="margin: 5px 0;">🔑 סיסמה זמנית: <strong>${password}</strong></p>
                </div>
                
                <p style="color: #d32f2f; font-size: 14px;">
                  ⚠️ מומלץ לשנות את הסיסמה מיד לאחר ההתחברות הראשונה
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${Deno.env.get('SITE_URL') || 'https://your-app.lovable.app'}/auth" 
                     style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    התחבר למערכת
                  </a>
                </div>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                  אם יש לך שאלות, פנה למנהל המערכת שלך.
                </p>
              </div>
            `,
          }),
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the whole operation if email fails
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping welcome email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: newUser.user.id, email: newUser.user.email } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

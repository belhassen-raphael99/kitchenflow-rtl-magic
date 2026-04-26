import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string()
    .min(12, 'הסיסמה חייבת להיות לפחות 12 תווים')
    .max(128, 'הסיסמה לא יכולה לעבור 128 תווים')
    .regex(/[a-z]/, 'חייבת להכיל אות קטנה')
    .regex(/[A-Z]/, 'חייבת להכיל אות גדולה')
    .regex(/[0-9]/, 'חייבת להכיל ספרה')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'חייבת להכיל תו מיוחד'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'הסיסמאות לא תואמות',
  path: ['confirmPassword'],
});

type Status = 'checking' | 'ready' | 'invalid' | 'success';

/**
 * Dedicated page for password recovery and first-time password setup (after invite).
 * Public route — never wrapped in AuthRoute or ProtectedRoute.
 * Forces the user to type a new password before they can access the app.
 */
export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Mark this tab as in recovery flow so other guards know not to
    // redirect the user into the app before they reset their password.
    sessionStorage.setItem('auth_recovery', 'true');

    // Listen for PASSWORD_RECOVERY (fired by Supabase when it auto-detects
    // the recovery hash from the email link).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStatus('ready');
      }
    });

    // Also handle the case where Supabase has already processed the hash
    // before this component mounted: check for an active session + a
    // recovery-style URL hash.
    const init = async () => {
      const hash = window.location.hash || '';
      const looksLikeRecovery =
        hash.includes('type=recovery') || hash.includes('type=invite');

      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session && (looksLikeRecovery || sessionStorage.getItem('auth_recovery') === 'true')) {
        setStatus('ready');
        // Clean the hash so refresh keeps the page usable.
        if (hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (!session && !looksLikeRecovery) {
        // No recovery context at all → invalid landing.
        setStatus('invalid');
      }
      // Otherwise stay in 'checking' until onAuthStateChange fires.
    };

    init();

    // Safety timeout: if nothing resolves after 5s, mark invalid.
    const timer = window.setTimeout(() => {
      if (isMounted && status === 'checking') {
        setStatus((s) => (s === 'checking' ? 'invalid' : s));
      }
    }, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        return;
      }

      // Force the user to log back in with the new password.
      sessionStorage.removeItem('auth_recovery');
      await supabase.auth.signOut();

      setStatus('success');
      toast({
        title: 'הסיסמה עודכנה!',
        description: 'אנא התחבר עם הסיסמה החדשה.',
      });

      window.setTimeout(() => navigate('/auth', { replace: true }), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center">
        <div className="relative z-10 text-center p-12 max-w-md">
          <div className="w-20 h-20 bg-primary-foreground/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold text-primary-foreground">ק</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">קסרולה</h1>
          <p className="text-xl text-primary-foreground/90">איפוס סיסמה</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-elevated p-6 sm:p-8 border border-border">
            {status === 'checking' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">מאמת קישור...</p>
              </div>
            )}

            {status === 'invalid' && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-foreground mb-2">קישור לא תקף</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  הקישור פג תוקף או כבר נוצל. בקש קישור חדש.
                </p>
                <Button onClick={() => navigate('/auth')} className="w-full">
                  חזור להתחברות
                </Button>
              </div>
            )}

            {status === 'ready' && (
              <>
                <div className="text-center mb-6">
                  <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-foreground">הגדר סיסמה חדשה</h2>
                  <p className="text-sm text-muted-foreground">
                    יש להגדיר סיסמה חדשה לפני שתוכל להמשיך
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">סיסמה חדשה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 text-right"
                        placeholder="לפחות 12 תווים"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">אשר סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 text-right"
                        placeholder="הכנס שוב את הסיסמה"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    הסיסמה חייבת להכיל אות גדולה, אות קטנה, ספרה ותו מיוחד.
                  </p>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    עדכן סיסמה
                  </Button>
                </form>
              </>
            )}

            {status === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-foreground mb-2">הסיסמה עודכנה!</h2>
                <p className="text-sm text-muted-foreground">מעביר אותך לדף ההתחברות...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
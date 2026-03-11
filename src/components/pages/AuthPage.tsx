import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, LogIn, KeyRound, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { FoodBackground } from '@/components/layout/FoodBackground';

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'נא להזין סיסמה'),
});

const emailSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
});

const passwordSchema = z.object({
  password: z.string()
    .min(12, 'הסיסמה חייבת להיות לפחות 12 תווים')
    .max(128, 'הסיסמה לא יכולה לעבור 128 תווים')
    .regex(/[a-z]/, 'חייבת להכיל אות קטנה')
    .regex(/[A-Z]/, 'חייבת להכיל אות גדולה')
    .regex(/[0-9]/, 'חייבת להכיל ספרה')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'חייבת להכיל תו מיוחד'),
  confirmPassword: z.string().min(12, 'הסיסמה חייבת להיות לפחות 12 תווים'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'הסיסמאות לא תואמות',
  path: ['confirmPassword'],
});

type ViewMode = 'login' | 'forgot-password' | 'reset-password';

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Handle recovery token from URL hash and auth state changes
  useEffect(() => {
    let isMounted = true;

    const handleRecovery = async () => {
      // Check URL hash for recovery tokens (e.g., #access_token=...&type=recovery)
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (type === 'recovery' && accessToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken ?? '',
            });
            if (!error && isMounted) {
              setViewMode('reset-password');
              // Clean the URL hash
              window.history.replaceState(null, '', window.location.pathname);
            } else if (error && isMounted) {
              toast({ title: 'שגיאה', description: 'הקישור פג תוקף. בקש קישור חדש.', variant: 'destructive' });
              setViewMode('login');
            }
          } catch {
            if (isMounted) setViewMode('login');
          }
          return;
        }
      }

      // Check URL search params (e.g., ?type=recovery)
      const type = searchParams.get('type');
      if (type === 'recovery') {
        if (isMounted) setViewMode('reset-password');
      }
    };

    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && isMounted) {
        setViewMode('reset-password');
      }
    });

    handleRecovery();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (viewMode === 'reset-password') {
      const validation = passwordSchema.safeParse({ password, confirmPassword });
      if (!validation.success) {
        const error = validation.error.errors[0];
        toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
          toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        } else {
          setResetSuccess(true);
          toast({ title: 'הצלחה!', description: 'הסיסמה עודכנה בהצלחה' });
          setTimeout(() => {
            setViewMode('login');
            setResetSuccess(false);
            setPassword('');
            setConfirmPassword('');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (viewMode === 'forgot-password') {
      const validation = emailSchema.safeParse({ email });
      if (!validation.success) {
        const error = validation.error.errors[0];
        toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        
        if (error) {
          toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        } else {
          toast({ 
            title: 'נשלח בהצלחה!', 
            description: 'בדוק את תיבת האימייל שלך לקישור לאיפוס הסיסמה' 
          });
          setViewMode('login');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validate inputs for login
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({ title: 'שגיאה', description: 'אימייל או סיסמה שגויים', variant: 'destructive' });
        } else {
          toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'ברוך הבא!', description: 'התחברת בהצלחה' });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative" dir="rtl">
      <FoodBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🍳</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">קסרולה</h1>
            <p className="text-muted-foreground">ניהול קייטרינג חכם</p>
          </div>

          {viewMode === 'reset-password' ? (
            <>
              {/* Reset Password View */}
              <div className="text-center mb-6">
                {resetSuccess ? (
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                ) : (
                  <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
                )}
                <h2 className="text-lg font-semibold text-foreground">
                  {resetSuccess ? 'הסיסמה עודכנה!' : 'הגדר סיסמה חדשה'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {resetSuccess ? 'מעביר אותך לדף ההתחברות...' : 'הכנס את הסיסמה החדשה שלך'}
                </p>
              </div>

              {!resetSuccess && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="password">סיסמה חדשה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 text-right"
                        placeholder="לפחות 6 תווים"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">אשר סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 text-right"
                        placeholder="הכנס שוב את הסיסמה"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    עדכן סיסמה
                  </Button>
                </form>
              )}
            </>
          ) : viewMode === 'forgot-password' ? (
            <>
              {/* Forgot Password View */}
              <div className="text-center mb-6">
                <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-foreground">שכחת סיסמה?</h2>
                <p className="text-sm text-muted-foreground">הכנס את האימייל שלך ונשלח לך קישור לאיפוס</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 text-right"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  שלח קישור לאיפוס
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setViewMode('login')}
                >
                  חזור להתחברות
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Login View Only - No Signup */}
              <div className="text-center mb-6">
                <LogIn className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-foreground">התחברות</h2>
                <p className="text-sm text-muted-foreground">הכנס את פרטי ההתחברות שלך</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 text-right"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">סיסמה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 text-right"
                      placeholder="הכנס סיסמה"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('forgot-password')}
                  className="text-sm text-primary hover:underline block"
                >
                  שכחת סיסמה?
                </button>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  התחבר
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                גישה למערכת בהזמנה בלבד.
                <br />
                פנה למנהל המערכת לקבלת חשבון.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

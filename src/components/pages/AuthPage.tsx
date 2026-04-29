import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, LogIn, KeyRound, Eye, EyeOff, AlertTriangle, Chrome, Play } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'נא להזין סיסמה'),
});

const emailSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
});

type ViewMode = 'login' | 'forgot-password';

export const AuthPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [credentialError, setCredentialError] = useState(false);
  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    setCredentialError(false);
    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setCredentialError(true);
          toast({
            title: 'שגיאה',
            description: 'אימייל או סיסמה שגויים. אם קיבלת הזמנה ולא הגדרת סיסמה — לחץ "שכחת סיסמה" כדי להגדיר אחת.',
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({ title: 'שגיאה', description: 'יש לאשר את האימייל לפני ההתחברות', variant: 'destructive' });
        } else if (error.message.includes('Too many requests')) {
          toast({ title: 'חשבון נעול זמנית', description: 'יותר מדי ניסיונות. נסה שוב בעוד מספר דקות.', variant: 'destructive' });
        } else {
          toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        }
      } else {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show success to prevent email enumeration attacks
      toast({ title: 'נשלח!', description: 'אם כתובת האימייל קיימת במערכת, ישלח אליה קישור לאיפוס הסיסמה' });
      setViewMode('login');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetFromError = async () => {
    if (!email) {
      toast({ title: 'שגיאה', description: 'הכנס תחילה את האימייל שלך', variant: 'destructive' });
      return;
    }
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast({ title: 'נשלח!', description: 'בדוק את תיבת הדואר שלך לקבלת קישור לאיפוס הסיסמה' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) {
        toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();

      const { data, error } = await supabase.functions.invoke('demo-auto-login');

      if (error || data?.error) {
        const msg = data?.error || error?.message || '';
        const isRateLimit = msg.includes('tentatives') || msg.includes('rate') || msg.includes('429');
        toast({
          title: 'שגיאה',
          description: isRateLimit
            ? 'יותר מדי ניסיונות — נסה שוב בעוד מספר דקות'
            : 'שגיאה זמנית — נסה שוב',
          variant: 'destructive',
        });
        setDemoLoading(false);
        return;
      }

      const { access_token, refresh_token } = data;
      await supabase.auth.setSession({ access_token, refresh_token });
      localStorage.setItem('demo_session_start', Date.now().toString());
      localStorage.setItem('show_demo_onboarding', 'true');
      navigate('/', { replace: true });
    } catch {
      toast({ title: 'שגיאה', description: 'שגיאה זמנית — נסה שוב', variant: 'destructive' });
      setDemoLoading(false);
    }
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const renderLogin = () => (
    <>
      <div className="text-center mb-6">
        <LogIn className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">התחברות</h2>
        <p className="text-sm text-muted-foreground">הכנס את פרטי ההתחברות שלך</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">אימייל</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-10"
              dir="ltr"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={handlePasswordKey}
              onKeyDown={handlePasswordKey}
              className="pr-10 pl-10"
              dir="ltr"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="הכנס סיסמה"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {capsLockOn && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              Caps Lock פעיל
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setViewMode('forgot-password')}
          className="text-sm text-primary hover:underline block"
        >
          שכחת סיסמה?
        </button>

        {credentialError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="text-foreground mb-2">
              לא הצלחנו להתחבר. אם שכחת את הסיסמה — נשלח לך מיד קישור לאיפוס.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleSendResetFromError}
              disabled={loading}
            >
              <Mail className="w-4 h-4" />
              שלח לי קישור לאיפוס סיסמה
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          התחבר
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">או</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
          המשך עם Google
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          גישה למערכת בהזמנה בלבד.
          <br />
          פנה למנהל המערכת לקבלת חשבון.
        </p>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm text-muted-foreground mb-2">רוצה לראות את המערכת?</p>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleDemoLogin}
            disabled={demoLoading}
          >
            {demoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מתחבר לסביבת הדמו...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                כניסה מיידית לסביבת דמו
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <div className="text-center mb-6">
        <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">שכחת סיסמה?</h2>
        <p className="text-sm text-muted-foreground">הכנס את האימייל שלך ונשלח לך קישור לאיפוס</p>
      </div>

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div>
          <Label htmlFor="recovery-email">אימייל</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-10"
              dir="ltr"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="example@email.com"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          שלח קישור לאיפוס
        </Button>
      </form>

      <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => setViewMode('login')}>
        חזור להתחברות
      </Button>
    </>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'forgot-password': return renderForgotPassword();
      default: return renderLogin();
    }
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Left branding panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center">
        <div className="relative z-10 text-center p-12 max-w-md">
          <div className="w-20 h-20 bg-primary-foreground/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold text-primary-foreground">ק</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">קסרולה</h1>
          <p className="text-xl text-primary-foreground/90 mb-2">ניהול קייטרינג חכם</p>
          <p className="text-primary-foreground/70 leading-relaxed">
            נהל את המטבח, המחסן, האירועים והמשלוחים שלך — הכל ממקום אחד.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile branding header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">ק</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">קסרולה</h1>
            <p className="text-muted-foreground">ניהול קייטרינג חכם</p>
          </div>

          <div className="bg-card rounded-lg shadow-elevated p-6 sm:p-8 border border-border">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

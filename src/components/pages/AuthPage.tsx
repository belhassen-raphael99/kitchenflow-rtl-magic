import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Loader2, Mail, Lock, LogIn, KeyRound, CheckCircle, Link2, Smartphone, Chrome } from 'lucide-react';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';

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

type ViewMode = 'login' | 'forgot-password' | 'reset-password' | 'magic-link' | 'otp-send' | 'otp-verify' | 'security-question-recovery';

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryUserId, setRecoveryUserId] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const handleRecovery = async () => {
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

      const type = searchParams.get('type');
      if (type === 'recovery') {
        if (isMounted) setViewMode('reset-password');
      }
    };

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
        toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'הצלחה!', description: 'הסיסמה עודכנה בהצלחה. התחבר עם הסיסמה החדשה.' });
          await supabase.auth.signOut();
          setViewMode('login');
          setPassword('');
          setConfirmPassword('');
          setResetSuccess(true);
          setTimeout(() => setResetSuccess(false), 3000);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (viewMode === 'forgot-password') {
      const validation = emailSchema.safeParse({ email });
      if (!validation.success) {
        toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
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
          toast({ title: 'נשלח בהצלחה!', description: 'בדוק את תיבת האימייל שלך לקישור לאיפוס הסיסמה' });
          setViewMode('login');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
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

  const handleMagicLink = async () => {
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
      });
      if (error) throw error;
      toast({ title: 'נשלח!', description: 'קישור כניסה נשלח לאימייל שלך' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      toast({ title: 'נשלח!', description: 'קוד חד-פעמי נשלח לאימייל שלך' });
      setViewMode('otp-verify');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({ title: 'שגיאה', description: 'נא להזין קוד בן 6 ספרות', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });
      if (error) throw error;
      toast({ title: 'ברוך הבא!', description: 'התחברת בהצלחה' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast({ title: 'שגיאה', description: String(result.error), variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    }
  };

  const handleSecurityQuestionLookup = async () => {
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({ title: 'שגיאה', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Look up user profile by email to find security question
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        toast({ title: 'שגיאה', description: 'לא נמצא משתמש עם אימייל זה', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data: sq } = await supabase
        .from('security_questions')
        .select('question')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!sq) {
        toast({ title: 'שגיאה', description: 'לא הוגדרה שאלת אבטחה עבור חשבון זה', variant: 'destructive' });
        setLoading(false);
        return;
      }

      setSecurityQuestion(sq.question);
      setRecoveryUserId(profile.id);
      setViewMode('security-question-recovery');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurityAnswer = async () => {
    if (securityAnswer.trim().length < 3) {
      toast({ title: 'שגיאה', description: 'נא להזין תשובה', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-security-answer', {
        body: { answer: securityAnswer.trim() },
      });

      if (hashError || !hashData?.hash) throw new Error('שגיאה באימות');

      const { data: sq } = await supabase
        .from('security_questions')
        .select('answer_hash')
        .eq('user_id', recoveryUserId)
        .maybeSingle();

      if (!sq || sq.answer_hash !== hashData.hash) {
        toast({ title: 'שגיאה', description: 'התשובה שגויה', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Answer correct — send a recovery email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) throw error;
      toast({ title: 'הצלחה!', description: 'התשובה נכונה! קישור לאיפוס סיסמה נשלח לאימייל שלך' });
      setViewMode('login');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const renderRecoveryOptions = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">שכחת סיסמה?</h2>
        <p className="text-sm text-muted-foreground">איך תרצה לאפס את הסיסמה?</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-email">אימייל</Label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pr-10 text-right"
            placeholder="example@email.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => {
            const v = emailSchema.safeParse({ email });
            if (!v.success) {
              toast({ title: 'שגיאה', description: v.error.errors[0].message, variant: 'destructive' });
              return;
            }
            setLoading(true);
            supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth?type=recovery`,
            }).then(({ error }) => {
              if (error) toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
              else {
                toast({ title: 'נשלח!', description: 'קישור לאיפוס נשלח לאימייל שלך' });
                setViewMode('login');
              }
              setLoading(false);
            });
          }}
          className="w-full gap-2"
          variant="outline"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          קבל קישור לאימייל
        </Button>

        <Button
          onClick={() => {
            const v = emailSchema.safeParse({ email });
            if (!v.success) {
              toast({ title: 'שגיאה', description: v.error.errors[0].message, variant: 'destructive' });
              return;
            }
            handleSendOtp();
          }}
          className="w-full gap-2"
          variant="outline"
          disabled={loading}
        >
          <Smartphone className="w-4 h-4" />
          קבל קוד OTP לאימייל
        </Button>

        <Button
          onClick={handleSecurityQuestionLookup}
          className="w-full gap-2"
          variant="outline"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          ענה על שאלת האבטחה
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setViewMode('login')}
      >
        חזור להתחברות
      </Button>
    </div>
  );

  const renderSecurityQuestionRecovery = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">שאלת אבטחה</h2>
        <p className="text-sm text-muted-foreground">{securityQuestion}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sq-answer">תשובה</Label>
        <Input
          id="sq-answer"
          value={securityAnswer}
          onChange={(e) => setSecurityAnswer(e.target.value)}
          placeholder="הכנס את התשובה"
          className="text-right"
        />
      </div>

      <Button onClick={handleVerifySecurityAnswer} className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        אמת תשובה
      </Button>

      <Button variant="ghost" className="w-full" onClick={() => setViewMode('forgot-password')}>
        חזור
      </Button>
    </div>
  );

  const renderOtpVerify = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Smartphone className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">הכנס קוד</h2>
        <p className="text-sm text-muted-foreground">קוד בן 6 ספרות נשלח ל-{email}</p>
      </div>

      <div className="flex justify-center" dir="ltr">
        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button onClick={handleVerifyOtp} className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        אמת קוד
      </Button>

      <Button variant="ghost" className="w-full" onClick={() => setViewMode('login')}>
        חזור להתחברות
      </Button>
    </div>
  );

  const renderResetPassword = () => (
    <>
      <div className="text-center mb-6">
        {resetSuccess ? (
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
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
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 text-right" placeholder="לפחות 12 תווים" required />
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">אשר סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10 text-right" placeholder="הכנס שוב את הסיסמה" required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            עדכן סיסמה
          </Button>
        </form>
      )}
    </>
  );

  const renderLogin = () => (
    <>
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
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10 text-right" placeholder="example@email.com" required />
          </div>
        </div>

        <div>
          <Label htmlFor="password">סיסמה</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 text-right" placeholder="הכנס סיסמה" required />
          </div>
        </div>

        <button type="button" onClick={() => setViewMode('forgot-password')} className="text-sm text-primary hover:underline block">
          שכחת סיסמה?
        </button>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          התחבר
        </Button>
      </form>

      {/* Alternative login methods */}
      <div className="mt-6">
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
            או
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full gap-2" onClick={handleMagicLink} disabled={loading}>
            <Link2 className="w-4 h-4" />
            כניסה בקישור קסום
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => {
            if (!email) {
              setViewMode('otp-send');
            } else {
              handleSendOtp();
            }
          }} disabled={loading}>
            <Smartphone className="w-4 h-4" />
            כניסה בקוד חד-פעמי
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin}>
            <Chrome className="w-4 h-4" />
            כניסה עם Google
          </Button>
        </div>
      </div>

      <div className="text-center mt-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          גישה למערכת בהזמנה בלבד.
          <br />
          פנה למנהל המערכת לקבלת חשבון.
        </p>
        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted-foreground mb-2">רוצה לראות את המערכת?</p>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={() => navigate('/demo')}>
            🎯 כניסה לסביבת דמו
          </Button>
        </div>
      </div>
    </>
  );

  const renderOtpSend = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Smartphone className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">כניסה בקוד חד-פעמי</h2>
        <p className="text-sm text-muted-foreground">הכנס את האימייל שלך לקבלת קוד</p>
      </div>
      <div>
        <Label htmlFor="otp-email">אימייל</Label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="otp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10 text-right" placeholder="example@email.com" required />
        </div>
      </div>
      <Button onClick={handleSendOtp} className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        שלח קוד
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => setViewMode('login')}>
        חזור להתחברות
      </Button>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'reset-password': return renderResetPassword();
      case 'forgot-password': return renderRecoveryOptions();
      case 'magic-link': return null;
      case 'otp-send': return renderOtpSend();
      case 'otp-verify': return renderOtpVerify();
      case 'security-question-recovery': return renderSecurityQuestionRecovery();
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

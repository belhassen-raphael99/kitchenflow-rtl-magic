import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Mail, KeyRound, ChefHat, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// === OTP Flow (with ref token) ===
const OtpFlow = ({ refToken }: { refToken: string }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const validate = async () => {
      const { data } = await supabase.rpc('validate_demo_token', { p_token: refToken }) as { data: any[] | null };
      setTokenValid(!!(data && data.length > 0));
    };
    validate();
  }, [refToken]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'שגיאה', description: 'כתובת אימייל לא תקינה', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('demo-otp-signup', {
        body: { email, token: refToken },
      });
      if (fnError || fnData?.error) {
        toast({ title: 'שגיאה', description: fnError?.message || fnData?.error || 'שגיאה בשליחת הקוד', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setStep('otp');
      toast({ title: 'קוד נשלח!', description: 'בדוק את תיבת האימייל שלך' });
    } catch {
      toast({ title: 'שגיאה', description: 'שגיאה בלתי צפויה', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    const { data: verifyData, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      setLoading(false);
      toast({ title: 'שגיאה', description: 'קוד שגוי או פג תוקף', variant: 'destructive' });
      return;
    }
    try {
      await supabase.functions.invoke('assign-demo-role', { body: { user_id: verifyData.user?.id, token: refToken, email } });
    } catch (err) {
      // Role assignment handled server-side
    }
    localStorage.setItem('demo_session_start', Date.now().toString());
    setLoading(false);
    navigate('/');
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">הקישור אינו תקף או פג תוקפו</h2>
            <p className="text-muted-foreground">צרו קשר עם המנהל לקבלת קישור חדש</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">קסרולה 🍲</CardTitle>
          <CardDescription className="text-base">
            {step === 'email'
              ? 'כניסה לסביבת דמו — הכנס את האימייל שלך לקבלת קוד כניסה חד-פעמי'
              : 'קוד נשלח לאימייל שלך — הכנס את הקוד בן 6 הספרות'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10" dir="ltr" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שלח קוד
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center" dir="ltr">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                כניסה לדמו
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('email'); setOtp(''); }}>
                שלח קוד מחדש
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// === Public Demo Landing (no token) ===
const PublicDemoLanding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();

      const { data, error } = await supabase.functions.invoke('demo-auto-login');

      if (error || data?.error) {
        const msg = data?.error || error?.message || 'שגיאה זמנית — נסה שוב';
        const isRateLimit = msg.includes('tentatives') || msg.includes('rate') || msg.includes('429');
        toast({
          title: 'שגיאה',
          description: isRateLimit ? 'יותר מדי ניסיונות — נסה שוב בעוד דקה' : 'שגיאה זמנית — נסה שוב',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { access_token, refresh_token } = data;
      await supabase.auth.setSession({ access_token, refresh_token });
      localStorage.setItem('demo_session_start', Date.now().toString());
      localStorage.setItem('show_demo_onboarding', 'true');
      navigate('/', { replace: true });
    } catch {
      toast({ title: 'שגיאה', description: 'שגיאה זמנית — נסה שוב', variant: 'destructive' });
      setLoading(false);
    }
  };

  const features = [
    'ניהול אירועים',
    'מתכונים ומצרכים',
    'מחסן וספקים',
    'ניהול ייצור',
    'דשבורד בזמן אמת',
    'ממשק בעברית',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">קסרולה 🍲</CardTitle>
          <CardDescription className="text-lg mt-2">
            מערכת ERP מקצועית לניהול קייטרינג
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-1">
            ניהול אירועים, מתכונים, מחסן וייצור — הכל במקום אחד
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-accent/50 rounded-md p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary font-semibold text-lg">
              <Play className="w-5 h-5" />
              סביבת דמו — צפייה בלבד
            </div>
            <p className="text-sm text-muted-foreground">
              גלה את כל יכולות המערכת ללא הרשמה
            </p>
            <Button
              onClick={handleDemoLogin}
              disabled={loading}
              size="lg"
              className="w-full text-lg h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מתחבר לסביבת הדמו...
                </>
              ) : (
                'כניסה לדמו ←'
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 text-center">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate('/auth')}>
              <ArrowRight className="w-4 h-4" />
              חזור לדף ההתחברות
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// === Main DemoPage ===
export const DemoPage = () => {
  const [searchParams] = useSearchParams();
  const refToken = searchParams.get('ref');

  if (refToken) {
    return <OtpFlow refToken={refToken} />;
  }

  return <PublicDemoLanding />;
};

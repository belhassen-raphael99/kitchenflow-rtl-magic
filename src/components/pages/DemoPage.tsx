import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Mail, KeyRound, ChefHat } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const DemoPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refToken = searchParams.get('ref');

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(refToken ? null : false);

  // Validate ref token on mount
  useEffect(() => {
    if (!refToken) return;
    const validate = async () => {
      const { data } = await supabase
        .from('demo_tokens')
        .select('id, expires_at, used')
        .eq('token', refToken)
        .maybeSingle();

      if (!data || data.used || new Date(data.expires_at) < new Date()) {
        setTokenValid(false);
      } else {
        setTokenValid(true);
      }
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
      // Use edge function to bypass signup restrictions
      const { data: fnData, error: fnError } = await supabase.functions.invoke('demo-otp-signup', {
        body: { email, token: refToken },
      });

      if (fnError) {
        toast({ title: 'שגיאה', description: fnError.message || 'שגיאה בשליחת הקוד', variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (fnData?.error) {
        toast({ title: 'שגיאה', description: fnData.error, variant: 'destructive' });
        setLoading(false);
        return;
      }

      setStep('otp');
      toast({ title: 'קוד נשלח!', description: 'בדוק את תיבת האימייל שלך' });
    } catch (err) {
      toast({ title: 'שגיאה', description: 'שגיאה בלתי צפויה', variant: 'destructive' });
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    const { data: verifyData, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    
    if (error) {
      setLoading(false);
      toast({ title: 'שגיאה', description: 'קוד שגוי או פג תוקף', variant: 'destructive' });
      return;
    }

    // Assign demo role via edge function
    try {
      const { error: fnError } = await supabase.functions.invoke('assign-demo-role', {
        body: { user_id: verifyData.user?.id },
      });
      if (fnError) console.error('assign-demo-role error:', fnError);
    } catch (err) {
      console.error('Failed to assign demo role:', err);
    }

    // Mark ref token as used if present
    if (refToken) {
      await supabase
        .from('demo_tokens')
        .update({ used: true, email })
        .eq('token', refToken);
    }

    // Set demo session start
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

  if (tokenValid === false) {
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
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                  required
                />
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
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setStep('email'); setOtp(''); }}
              >
                שלח קוד מחדש
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

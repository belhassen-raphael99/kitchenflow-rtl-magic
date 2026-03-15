import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Link2, Smartphone, Chrome, Info } from 'lucide-react';

interface LoginMethods {
  password: boolean;
  magic_link: boolean;
  otp: boolean;
  google: boolean;
}

const defaultMethods: LoginMethods = { password: true, magic_link: false, otp: false, google: false };

export const LoginMethodsTab = () => {
  const { user, isDemo } = useAuth();
  const [methods, setMethods] = useState<LoginMethods>(defaultMethods);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user) fetchMethods();
  }, [user]);

  const fetchMethods = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('login_methods')
      .eq('id', user.id)
      .maybeSingle();

    if (data?.login_methods) {
      setMethods(data.login_methods as unknown as LoginMethods);
    }
    setFetching(false);
  };

  const handleToggle = (key: keyof LoginMethods) => {
    if (key === 'password') return; // password always on
    setMethods(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ login_methods: methods as unknown as Record<string, unknown> })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: 'הצלחה', description: 'שיטות הכניסה עודכנו בהצלחה ✓' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Magic Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            כניסה בקישור קסום
          </CardTitle>
          <CardDescription>קבל קישור כניסה ישירות לאימייל שלך — ללא סיסמה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="magic-link" className="cursor-pointer">הפעל כניסה בקישור קסום</Label>
            <Switch
              id="magic-link"
              checked={methods.magic_link}
              onCheckedChange={() => handleToggle('magic_link')}
              disabled={isDemo}
            />
          </div>
        </CardContent>
      </Card>

      {/* OTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            כניסה בקוד חד-פעמי
          </CardTitle>
          <CardDescription>קבל קוד 6 ספרות לאימייל שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="otp" className="cursor-pointer">הפעל כניסה בקוד OTP</Label>
            <Switch
              id="otp"
              checked={methods.otp}
              onCheckedChange={() => handleToggle('otp')}
              disabled={isDemo}
            />
          </div>
        </CardContent>
      </Card>

      {/* Google OAuth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="w-5 h-5" />
            כניסה עם Google
          </CardTitle>
          <CardDescription>התחבר בלחיצה אחת עם חשבון Google שלך</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="google" className="cursor-pointer">הפעל כניסה עם Google</Label>
            <Switch
              id="google"
              checked={methods.google}
              onCheckedChange={() => handleToggle('google')}
              disabled={isDemo}
            />
          </div>
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>כדי שכניסה עם Google תעבוד, יש להגדיר את ספק Google בהגדרות האימות של הפלטפורמה.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading || isDemo} className="gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        שמור שינויים
      </Button>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldOff, Copy, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const TwoFactorTab = () => {
  const { user, isDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{ uri: string; backup_codes: string[] } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');

  useEffect(() => {
    if (user) checkStatus();
  }, [user]);

  const checkStatus = async () => {
    const { data } = await supabase
      .from('user_totp')
      .select('is_enabled')
      .eq('user_id', user!.id)
      .maybeSingle();
    setIsEnabled(data?.is_enabled ?? false);
    setFetching(false);
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-setup', {});
      if (error) throw error;
      setSetupData(data);
      setStep('verify');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { code: verifyCode, action: 'verify' },
      });
      if (error) throw error;
      if (!data.valid) {
        toast({ title: 'שגיאה', description: 'קוד שגוי, נסה שוב', variant: 'destructive' });
        return;
      }
      setIsEnabled(true);
      setStep('idle');
      setSetupData(null);
      setVerifyCode('');
      toast({ title: 'הצלחה', description: 'אימות דו-שלבי הופעל בהצלחה ✓' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-verify', {
        body: { code: disableCode, action: 'disable' },
      });
      if (error) throw error;
      if (!data.valid) {
        toast({ title: 'שגיאה', description: 'קוד שגוי', variant: 'destructive' });
        return;
      }
      setIsEnabled(false);
      setDisableCode('');
      toast({ title: 'הצלחה', description: 'אימות דו-שלבי בוטל' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.backup_codes.join('\n'));
    toast({ title: 'הועתק', description: 'קודי גיבוי הועתקו ללוח' });
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
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? <ShieldCheck className="w-5 h-5 text-primary" /> : <ShieldOff className="w-5 h-5 text-muted-foreground" />}
            אימות דו-שלבי (2FA)
          </CardTitle>
          <CardDescription>
            הוסף שכבת אבטחה נוספת לחשבון שלך באמצעות Google Authenticator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm">סטטוס:</span>
            {isEnabled ? (
              <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">מופעל</Badge>
            ) : (
              <Badge variant="secondary">לא מופעל</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Flow */}
      {!isEnabled && step === 'idle' && (
        <Button onClick={handleSetup} disabled={loading || isDemo} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <QrCode className="w-4 h-4" />
          הפעל אימות דו-שלבי
        </Button>
      )}

      {step === 'verify' && setupData && (
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">שלב 1: סרוק את קוד ה-QR</CardTitle>
              <CardDescription>פתח את Google Authenticator וסרוק את הקוד הבא</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.uri)}`}
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-sm break-all" dir="ltr">
                {setupData.uri}
              </p>
            </CardContent>
          </Card>

          {/* Backup Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">שלב 2: שמור קודי גיבוי</CardTitle>
              <CardDescription>שמור את הקודים הבאים במקום בטוח. ניתן להשתמש בהם אם אין לך גישה לאפליקציה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-muted/50 p-4 rounded-lg" dir="ltr">
                {setupData.backup_codes.map((code, i) => (
                  <span key={i}>{code}</span>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyBackupCodes}>
                <Copy className="w-3.5 h-3.5" />
                העתק קודים
              </Button>
            </CardContent>
          </Card>

          {/* Verify */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">שלב 3: אמת קוד</CardTitle>
              <CardDescription>הזן את הקוד בן 6 הספרות מ-Google Authenticator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="verify-code">קוד אימות</Label>
                  <Input
                    id="verify-code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="font-mono text-center text-lg tracking-widest"
                    dir="ltr"
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  אמת והפעל
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disable Flow */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">ביטול אימות דו-שלבי</CardTitle>
            <CardDescription>הזן קוד מ-Google Authenticator כדי לבטל את האימות הדו-שלבי</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="disable-code">קוד אימות</Label>
                <Input
                  id="disable-code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="font-mono text-center text-lg tracking-widest"
                  dir="ltr"
                  maxLength={6}
                />
              </div>
              <Button variant="destructive" onClick={handleDisable} disabled={loading || disableCode.length !== 6 || isDemo} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                בטל 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

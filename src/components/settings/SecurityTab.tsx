import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, LogOut, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const passwordSchema = z.object({
  newPassword: z.string()
    .min(12, 'הסיסמה חייבת להיות לפחות 12 תווים')
    .max(128, 'הסיסמה לא יכולה לעבור 128 תווים')
    .regex(/[a-z]/, 'חייבת להכיל אות קטנה')
    .regex(/[A-Z]/, 'חייבת להכיל אות גדולה')
    .regex(/[0-9]/, 'חייבת להכיל ספרה')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'חייבת להכיל תו מיוחד'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'הסיסמאות לא תואמות',
  path: ['confirmPassword'],
});

function getPasswordStrength(password: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score <= 1) return { label: 'חלשה', color: 'bg-destructive', percent: 20 };
  if (score <= 2) return { label: 'בינונית', color: 'bg-secondary', percent: 40 };
  if (score <= 3) return { label: 'חזקה', color: 'bg-primary/70', percent: 70 };
  return { label: 'מצוינת', color: 'bg-primary', percent: 100 };
}

export const SecurityTab = () => {
  const { user, isDemo, signOut } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    const validation = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'הצלחה', description: 'הסיסמה עודכנה בהצלחה ✓' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !z.string().email().safeParse(newEmail).success) {
      toast({ title: 'שגיאה', description: 'כתובת אימייל לא תקינה', variant: 'destructive' });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({
        title: 'נשלח בהצלחה',
        description: 'נשלח אימייל אישור לכתובת החדשה — יש לאשר לפני שהשינוי ייכנס לתוקף',
      });
      setNewEmail('');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGlobalSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({ title: 'הצלחה', description: 'התנתקת מכל המכשירים' });
      navigate('/auth');
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            שינוי סיסמה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">סיסמה חדשה</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="לפחות 12 תווים"
              disabled={isDemo}
            />
            {newPassword && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", strength.color)}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-left">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">אימות סיסמה</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="הכנס שוב את הסיסמה"
              disabled={isDemo}
            />
          </div>

          <Button onClick={handleChangePassword} disabled={passwordLoading || isDemo} className="gap-2">
            {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            עדכן סיסמה
          </Button>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            שינוי אימייל
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>אימייל נוכחי</Label>
            <Input value={user?.email || ''} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">אימייל חדש</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={isDemo}
            />
          </div>

          <Button onClick={handleChangeEmail} disabled={emailLoading || isDemo} variant="outline" className="gap-2">
            {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            שלח אימות
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            חיבורים פעילים
          </CardTitle>
          <CardDescription>התנתק מכל המכשירים המחוברים</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGlobalSignOut}
            disabled={isDemo}
            variant="destructive"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            התנתק מכל המכשירים
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

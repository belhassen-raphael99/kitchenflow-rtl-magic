import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, LogIn, KeyRound } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
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

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          גישה למערכת בהזמנה בלבד.
          <br />
          פנה למנהל המערכת לקבלת חשבון.
        </p>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm text-muted-foreground mb-2">רוצה לראות את המערכת?</p>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={() => navigate('/demo')}>
            🎯 כניסה לסביבת דמו
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
              className="pr-10 text-right"
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

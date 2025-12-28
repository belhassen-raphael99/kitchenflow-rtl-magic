import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, User, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'הסיסמה חייבת להיות לפחות 6 תווים'),
  fullName: z.string().optional(),
});

const emailSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
});

type ViewMode = 'login' | 'signup' | 'forgot-password';

export const AuthPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          redirectTo: `${window.location.origin}/auth`,
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

    // Validate inputs for login/signup
    const validation = authSchema.safeParse({ email, password, fullName });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (viewMode === 'login') {
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
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ title: 'שגיאה', description: 'המשתמש כבר קיים במערכת', variant: 'destructive' });
          } else {
            toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
          }
        } else {
          toast({ title: 'נרשמת בהצלחה!', description: 'כעת תוכל להתחבר' });
          setViewMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🍳</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">קסרולה</h1>
            <p className="text-muted-foreground">ניהול קייטרינג חכם</p>
          </div>

          {viewMode === 'forgot-password' ? (
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
              {/* Login/Signup Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={viewMode === 'login' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setViewMode('login')}
                >
                  <LogIn className="w-4 h-4 ml-2" />
                  התחברות
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'signup' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setViewMode('signup')}
                >
                  <UserPlus className="w-4 h-4 ml-2" />
                  הרשמה
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {viewMode === 'signup' && (
                  <div>
                    <Label htmlFor="fullName">שם מלא</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pr-10 text-right"
                        placeholder="הכנס שם מלא"
                      />
                    </div>
                  </div>
                )}

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
                      placeholder="לפחות 6 תווים"
                      required
                    />
                  </div>
                </div>

                {viewMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setViewMode('forgot-password')}
                    className="text-sm text-primary hover:underline block"
                  >
                    שכחת סיסמה?
                  </button>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {viewMode === 'login' ? 'התחבר' : 'הרשם'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {viewMode === 'login' ? 'אין לך חשבון?' : 'יש לך חשבון?'}
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'login' ? 'signup' : 'login')}
                  className="text-primary hover:underline mr-1"
                >
                  {viewMode === 'login' ? 'הרשם כאן' : 'התחבר כאן'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
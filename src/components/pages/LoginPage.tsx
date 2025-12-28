import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const { setIsLoggedIn } = useApp();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('chef@casserole.co.il');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoggedIn(true);
    setLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center p-4 font-heebo">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-hero-soft flex items-center justify-center text-4xl mb-4 shadow-elevated">
            🍳
          </div>
          <h1 className="text-3xl font-bold text-foreground">Kitchen Flow</h1>
          <p className="text-muted-foreground mt-2">ניהול קייטרינג חכם</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-3xl shadow-card p-8 animate-fade-in-up stagger-1">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            התחברות למערכת
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                אימייל
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="text-right"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                סיסמה
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  מתחבר...
                </>
              ) : (
                'התחבר'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Demo: לחץ על התחבר להיכנס כלקוח "קסרולה"
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-in-up stagger-2">
          © 2024 Kitchen Flow - כל הזכויות שמורות
        </p>
      </div>
    </div>
  );
};

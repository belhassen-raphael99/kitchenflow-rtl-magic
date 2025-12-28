import { useState } from 'react';
import { useApp, ClientType } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Loader2, Leaf } from 'lucide-react';

export const LoginPage = () => {
  const { loginAs } = useApp();
  const [loading, setLoading] = useState<ClientType | null>(null);

  const handleLogin = async (client: ClientType) => {
    setLoading(client);
    
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    loginAs(client);
    setLoading(null);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center p-4 font-heebo">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-24 h-24 mx-auto rounded-3xl gradient-hero-soft flex items-center justify-center mb-4 shadow-elevated">
            <Leaf className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Kitchen Flow</h1>
          <p className="text-muted-foreground mt-2 text-lg">ניהול קייטרינג חכם</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-3xl shadow-card p-8 animate-fade-in-up stagger-1">
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            בחר חשבון להתחברות
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Demo: בחר אחד מהלקוחות להדגמה
          </p>

          <div className="space-y-4">
            {/* Casserole Button - Green */}
            <Button
              onClick={() => handleLogin('casserole')}
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-3"
              disabled={loading !== null}
            >
              {loading === 'casserole' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  מתחבר...
                </>
              ) : (
                <>
                  <span className="text-2xl">🍳</span>
                  <span>התחבר כ"קסרולה"</span>
                </>
              )}
            </Button>

            {/* PizzaKing Button - Red */}
            <Button
              onClick={() => handleLogin('pizzaking')}
              className="w-full h-14 text-lg bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-3"
              disabled={loading !== null}
            >
              {loading === 'pizzaking' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  מתחבר...
                </>
              ) : (
                <>
                  <span className="text-2xl">🍕</span>
                  <span>התחבר כ"פיצה קינג"</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-in-up stagger-2">
          © 2024 Kitchen Flow - כל הזכויות שמורות
        </p>
      </div>
    </div>
  );
};

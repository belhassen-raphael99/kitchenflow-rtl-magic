import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DEMO_DURATION_MS = 30 * 60 * 1000;

export const DemoBanner = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(DEMO_DURATION_MS);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const sessionStart = localStorage.getItem('demo_session_start');
    if (!sessionStart) {
      localStorage.setItem('demo_session_start', Date.now().toString());
    }

    const interval = setInterval(async () => {
      const start = parseInt(localStorage.getItem('demo_session_start') || '0');
      const elapsed = Date.now() - start;
      const remaining = DEMO_DURATION_MS - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem('demo_session_start');
        await supabase.auth.signOut();
        navigate('/demo-expired');
        return;
      }

      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg"
        dir="rtl"
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          👁 מצב דמו — צפייה בלבד | הסשן יפוג בעוד {formattedTime}
        </span>
        <button
          onClick={() => setShowInfo(true)}
          className="underline hover:no-underline text-white/90 hover:text-white flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          פרטים נוספים
        </button>
      </div>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">קסרולה — מערכת ERP לניהול קייטרינג</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              מערכת ניהול מקצועית לעסקי קייטרינג — כוללת ניהול אירועים, מתכונים, מחסן, ייצור ודשבורד בזמן אמת.
            </p>
            <div className="space-y-2">
              <p><span className="font-semibold">פותחה על ידי:</span> רפאל בלחסן</p>
              <p><span className="font-semibold">טכנולוגיות:</span> React, TypeScript, Supabase, Tailwind CSS</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <a href="https://www.linkedin.com/in/rafael-belassen" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="mailto:rafael.belassen@gmail.com">
                  צור קשר
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

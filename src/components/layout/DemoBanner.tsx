import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

const DEMO_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const DemoBanner = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(DEMO_DURATION_MS);

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
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg"
      dir="rtl"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        ⚠️ מצב דמו — צפייה בלבד — הסשן יפוג בעוד {formattedTime}
      </span>
    </div>
  );
};

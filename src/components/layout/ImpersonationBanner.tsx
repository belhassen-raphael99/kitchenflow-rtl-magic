import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpersonation } from '@/hooks/useImpersonation';

export const ImpersonationBanner = () => {
  const { isImpersonating, targetEmail, exitImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg"
      dir="rtl"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        ⚠️ מצב התחזות — צופה כ-{targetEmail} — כל הפעולות נרשמות
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={exitImpersonation}
        className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90 border-destructive-foreground/20 mr-2"
      >
        <LogOut className="w-3 h-3 ml-1" />
        יציאה
      </Button>
    </div>
  );
};

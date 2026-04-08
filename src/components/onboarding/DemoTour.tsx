import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ExternalLink, SkipForward, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TourStep {
  title: string;
  description: string[];
  icon: string;
  route?: string;
  selector?: string;
  placement?: TooltipPlacement;
  centered?: boolean;
  accentLabel?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'ברוכים הבאים לדמו של קסרולה! 👋',
    icon: '🍲',
    centered: true,
    accentLabel: '1/7',
    description: [
      'קסרולה היא מערכת ERP לניהול עסקי קייטרינג — מהזמנת הלקוח ועד להכנה במטבח, הכל במקום אחד.',
      'בסיור זה נעבור על 6 תכונות מרכזיות של המערכת.',
      'הסיור אורך כ-2 דקות.',
    ],
  },
  {
    title: '💡 הדשבורד',
    icon: '📊',
    route: '/',
    selector: '[data-demo-tour="dashboard-kpis"]',
    placement: 'bottom',
    accentLabel: '2/7',
    description: [
      'כאן תראו את כל המידע החשוב במבט אחד:',
      '• מספר האירועים השבוע',
      '• סך האורחים',
      '• התראות מלאי',
      '• האירוע הקרוב ביותר',
    ],
  },
  {
    title: '📅 היומן',
    icon: '📅',
    route: '/agenda',
    selector: '[data-demo-tour="agenda-calendar"]',
    placement: 'left',
    accentLabel: '3/7',
    description: [
      'כל הזמנה חדשה מופיעה כאן אוטומטית.',
      'לחצו על אירוע כלשהו כדי לראות את הפרטים המלאים:',
      'פרטי הלקוח, המנות שהוזמנו, וסטטוס ההכנה.',
    ],
  },
  {
    title: '👨‍🍳 ניהול ייצור',
    icon: '👨‍🍳',
    route: '/kitchen-ops',
    selector: '[data-demo-tour="kitchen-tasks"]',
    placement: 'top',
    accentLabel: '4/7',
    description: [
      'כשנוצרת הזמנה — משימות ייצור נוצרות אוטומטית',
      'לכל מחלקה: מטבח, מאפייה וקונדיטוריה.',
      'כל עובד רואה את המשימות שלו ומעדכן סטטוס.',
    ],
  },
  {
    title: '📦 מחסן',
    icon: '📦',
    route: '/warehouse',
    selector: '[data-demo-tour="warehouse-stock"]',
    placement: 'top',
    accentLabel: '5/7',
    description: [
      'כל חומרי הגלם עם מחיר, יחידה וספק.',
      'פריטים שמתקרבים למינימום מקבלים התראה אוטומטית.',
    ],
  },
  {
    title: '📖 מתכונים',
    icon: '📖',
    route: '/recipes',
    selector: '[data-demo-tour="recipes-grid"]',
    placement: 'top',
    accentLabel: '6/7',
    description: [
      '98 מתכונים מחולקים ל-3 מחלקות.',
      'כל מתכון כולל רשימת מצרכים עם כמויות מדויקות.',
    ],
  },
  {
    title: 'זהו! עכשיו תורך לגלות 🚀',
    icon: '🎉',
    centered: true,
    accentLabel: '7/7',
    description: [
      'סביבה זו היא דמו בלבד — צפייה בלבד.',
      'כל הנתונים הם לדוגמה בלבד.',
      'פותח על ידי רפאל בלחסן.',
    ],
  },
];

const TOOLTIP_WIDTH = 360;
const MOBILE_BREAKPOINT = 768;

const getTooltipPosition = (rect: DOMRect | null, placement: TooltipPlacement = 'bottom') => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(TOOLTIP_WIDTH, viewportWidth - 32);
  const height = 260;
  const gap = 18;

  if (!rect || viewportWidth < MOBILE_BREAKPOINT) {
    return {
      width,
      left: Math.max(16, (viewportWidth - width) / 2),
      top: Math.max(88, viewportHeight - height - 24),
    };
  }

  let top = rect.bottom + gap;
  let left = rect.left;

  if (placement === 'top') {
    top = rect.top - height - gap;
    left = rect.left + rect.width / 2 - width / 2;
  }

  if (placement === 'bottom') {
    top = rect.bottom + gap;
    left = rect.left + rect.width / 2 - width / 2;
  }

  if (placement === 'left') {
    top = rect.top + rect.height / 2 - height / 2;
    left = rect.left - width - gap;
  }

  if (placement === 'right') {
    top = rect.top + rect.height / 2 - height / 2;
    left = rect.right + gap;
  }

  if (top + height > viewportHeight - 16) {
    top = Math.max(88, viewportHeight - height - 16);
  }

  if (top < 88) {
    top = 88;
  }

  if (left + width > viewportWidth - 16) {
    left = viewportWidth - width - 16;
  }

  if (left < 16) {
    left = 16;
  }

  return { top, left, width };
};

export const DemoTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemo } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (!isDemo) {
      setIsOpen(false);
      setCurrentStep(0);
      return;
    }

    const shouldShow = localStorage.getItem('show_demo_onboarding');
    if (shouldShow === 'true') {
      const timeout = window.setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
        localStorage.removeItem('show_demo_onboarding');
      }, 800);

      return () => window.clearTimeout(timeout);
    }
  }, [isDemo]);

  useEffect(() => {
    if (!isOpen) return;

    const stepRoute = TOUR_STEPS[currentStep].route;
    if (stepRoute && location.pathname !== stepRoute) {
      navigate(stepRoute, { replace: true });
    }
  }, [currentStep, isOpen, location.pathname, navigate]);

  useEffect(() => {
    if (!isOpen) return;

    const syncTarget = () => {
      if (!step.selector) {
        setTargetRect(null);
        return true;
      }

      const element = document.querySelector(step.selector) as HTMLElement | null;
      if (!element) return false;

      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      return true;
    };

    let attempts = 0;
    const hasImmediateTarget = syncTarget();
    let intervalId: number | undefined;

    if (!hasImmediateTarget && step.selector) {
      intervalId = window.setInterval(() => {
        attempts += 1;
        const found = syncTarget();
        if (found || attempts > 30) {
          window.clearInterval(intervalId);
        }
      }, 120);
    }

    const handleResize = () => syncTarget();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [currentStep, isOpen, location.pathname, step.selector]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Final step celebration removed (canvas-confetti dependency cleaned up)

  const tooltipStyle = useMemo(() => {
    if (step.centered) return undefined;
    return getTooltipPosition(targetRect, step.placement);
  }, [step.centered, step.placement, targetRect]);

  const handleClose = () => {
    setIsOpen(false);
    setTargetRect(null);
  };

  const handleNext = () => {
    if (currentStep === TOUR_STEPS.length - 1) {
      handleClose();
      navigate('/', { replace: true });
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    setCurrentStep((prev) => prev - 1);
  };

  if (!isOpen || !isDemo) return null;

  return (
    <div className="fixed inset-0 z-[9990]" dir="rtl" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-[2px]" />

      {!step.centered && targetRect && (
        <div
          className="pointer-events-none fixed rounded-lg border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.45)] transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px hsl(var(--foreground) / 0.72), 0 0 30px hsl(var(--primary) / 0.45)',
          }}
        />
      )}

      {step.centered ? (
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-2xl border-primary/30 bg-background/95 shadow-2xl backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="space-y-3 text-right">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Sparkles className="w-4 h-4" />
                    {step.accentLabel}
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <h2 className="text-2xl sm:text-4xl font-bold leading-tight">{step.title}</h2>
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-3xl">
                      {step.icon}
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="shrink-0" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
                {step.description.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              {currentStep === TOUR_STEPS.length - 1 ? (
                <div className="mt-8 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button asChild variant="outline" className="gap-2">
                      <a href="https://www.linkedin.com/in/rafael-belassen" target="_blank" rel="noopener noreferrer">
                        LinkedIn
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <a href="mailto:rafael.belassen@gmail.com">
                        צור קשר
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="ghost" onClick={handlePrev} className="gap-2">
                      <ChevronRight className="w-4 h-4" />
                      הקודם
                    </Button>
                    <Button onClick={handleNext} className="gap-2">
                      סיים וגלה את המערכת
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="ghost" onClick={handleClose} className="gap-2">
                    <SkipForward className="w-4 h-4" />
                    דלג על הסיור
                  </Button>
                  <Button onClick={handleNext} className="gap-2">
                    בואו נתחיל
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card
          className={cn(
            'fixed border-primary/30 bg-background/95 shadow-2xl backdrop-blur transition-all duration-300',
            !targetRect && 'left-4 right-4 top-24'
          )}
          style={tooltipStyle}
        >
          <CardContent className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-2 text-right">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {step.accentLabel}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <span className="text-2xl">{step.icon}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {step.description.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
              <Button variant="ghost" onClick={handleClose} className="gap-2 text-xs sm:text-sm">
                <SkipForward className="w-4 h-4" />
                דלג על הסיור
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-1">
                  <ChevronRight className="w-4 h-4" />
                  הקודם
                </Button>
                <Button onClick={handleNext} className="gap-1">
                  הבא
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
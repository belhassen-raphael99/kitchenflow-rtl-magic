import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  route: string;
  title: string;
  description: string;
  icon: string;
}

const tourSteps: TourStep[] = [
  {
    route: '/',
    title: 'דשבורד ראשי',
    icon: '📊',
    description: 'כאן תראה סיכום של כל הפעילות: אירועים קרובים, התראות מלאי, משימות ייצור פעילות ומצב המערכת בזמן אמת.',
  },
  {
    route: '/agenda',
    title: 'יומן אירועים',
    icon: '📅',
    description: 'ניהול כל האירועים והקייטרינג. תוכל לראות הזמנות לפי תאריך, פרטי לקוח, פריטי הזמנה ומשימות ייצור שנוצרו אוטומטית לכל אירוע.',
  },
  {
    route: '/kitchen-ops',
    title: 'פוסט מטבח',
    icon: '👨‍🍳',
    description: 'לוח המשימות של המטבח והקונדיטוריה. כאן הצוות רואה מה צריך להכין, לפי תאריך ומחלקה. כשמסמנים משימה כ"הושלם" — המלאי מתעדכן אוטומטית.',
  },
  {
    route: '/delivery',
    title: 'משלוחים',
    icon: '🚚',
    description: 'כשכל המשימות של אירוע הושלמו, ההזמנה מופיעה כאן כ"מוכנה למשלוח". לחץ "שלח" כדי לסמן שהליוור יצא לדרך. תוכל לראות את פרטי הלקוח, הכתובת והטלפון.',
  },
  {
    route: '/recipes',
    title: 'ספר מתכונים',
    icon: '📖',
    description: 'כל המתכונים עם מרכיבים, הוראות הכנה ועלויות. המתכונים מקושרים לפריטי ההזמנה ולמשימות הייצור.',
  },
  {
    route: '/warehouse',
    title: 'מחסן',
    icon: '📦',
    description: 'ניהול מלאי חומרי גלם — כמויות, ספקים, מחירים והתראות מלאי נמוך. כשמלאי יורד מתחת למינימום, תקבל התראה.',
  },
  {
    route: '/reserve',
    title: 'רזרבה',
    icon: '🧊',
    description: 'מעקב אחר מוצרים מוכנים ברזרבה (קפואים/מצוננים). כשמייצרים פריט, הכמות עולה. כשצורכים — יורדת.',
  },
];

export const DemoTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDemoSession = localStorage.getItem('demo_session_start');
    const tourDismissed = sessionStorage.getItem('demo_tour_dismissed');
    if (isDemoSession && !tourDismissed) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const stepIndex = tourSteps.findIndex(s => s.route === location.pathname);
    if (stepIndex >= 0) {
      setCurrentStep(stepIndex);
    }
  }, [location.pathname, visible]);

  const handleSkip = () => {
    sessionStorage.setItem('demo_tour_dismissed', 'true');
    setDismissed(true);
    setVisible(false);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(tourSteps[nextStep].route);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(tourSteps[prevStep].route);
    }
  };

  if (!visible || dismissed) return null;

  const step = tourSteps[currentStep];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-50 animate-in slide-in-from-bottom-4" dir="rtl">
      <Card className="border-primary/30 shadow-xl bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              <h3 className="font-bold text-base">{step.title}</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSkip}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === currentStep ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs gap-1">
              <SkipForward className="w-3 h-3" />
              דלג על ההדרכה
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrev} className="gap-1">
                  <ChevronRight className="w-3 h-3" />
                  הקודם
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="gap-1">
                {currentStep < tourSteps.length - 1 ? (
                  <>
                    הבא
                    <ChevronLeft className="w-3 h-3" />
                  </>
                ) : (
                  'סיום'
                )}
              </Button>
            </div>
          </div>

          {/* Step counter */}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {currentStep + 1} / {tourSteps.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

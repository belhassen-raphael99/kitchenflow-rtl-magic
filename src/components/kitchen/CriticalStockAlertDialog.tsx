import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Users } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import { he } from 'date-fns/locale';

export interface CriticalEventAlert {
  eventId: string;
  eventName: string;
  clientName: string | null;
  date: string;
  time: string;
  guests: number;
  missingIngredients: Array<{ name: string; missing: number; unit: string }>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: CriticalEventAlert[];
  onViewEvent: (eventId: string) => void;
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(d, today);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  return format(d, 'EEEE dd/MM', { locale: he });
}

export function CriticalStockAlertDialog({ open, onOpenChange, alerts, onViewEvent }: Props) {
  if (alerts.length === 0) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-6 h-6" />
            🚨 התראה: מלאי קריטי
          </AlertDialogTitle>
          <AlertDialogDescription>
            זוהו חוסרים קריטיים במלאי עבור {alerts.length} {alerts.length === 1 ? 'אירוע' : 'אירועים'} בימים הקרובים.
            יש לטפל בזה בהקדם!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 my-2">
          {alerts.map(a => (
            <div
              key={a.eventId}
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{a.clientName || a.eventName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{dayLabel(a.date)}</Badge>
                    <span className="flex items-center gap-1" dir="ltr"><Clock className="w-3 h-3" />{a.time.slice(0, 5)}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.guests}</span>
                  </div>
                </div>
                <button
                  onClick={() => { onViewEvent(a.eventId); onOpenChange(false); }}
                  className="text-xs font-semibold text-primary hover:underline shrink-0"
                >
                  צפה בפרטים ←
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.missingIngredients.slice(0, 6).map((ing, i) => (
                  <Badge key={i} variant="destructive" className="text-[10px] gap-1">
                    {ing.name}
                    <span className="font-bold tabular-nums">חסר {ing.missing} {ing.unit}</span>
                  </Badge>
                ))}
                {a.missingIngredients.length > 6 && (
                  <Badge variant="outline" className="text-[10px]">+{a.missingIngredients.length - 6}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>סגור</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>הבנתי</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

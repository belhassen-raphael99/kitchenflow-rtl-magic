import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Users, ArrowLeft, PackageX } from 'lucide-react';
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

  const totalMissing = alerts.reduce((s, a) => s + a.missingIngredients.length, 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg p-0 overflow-hidden gap-0" dir="rtl">
        {/* Hero header */}
        <div className="relative bg-destructive/10 border-b border-destructive/20 px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/15 p-2.5 shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogHeader className="space-y-1 text-right">
                <h2 className="text-base font-bold text-destructive leading-tight">
                  התראה: מלאי קריטי
                </h2>
                <p className="text-xs text-muted-foreground leading-snug">
                  {totalMissing} רכיבי גלם חסרים עבור {alerts.length} {alerts.length === 1 ? 'אירוע' : 'אירועים'} בימים הקרובים
                </p>
              </AlertDialogHeader>
            </div>
          </div>
        </div>

        {/* Events list */}
        <div className="max-h-[55vh] overflow-y-auto px-5 py-4 space-y-3">
          {alerts.map(a => (
            <div
              key={a.eventId}
              className="rounded-xl border bg-card overflow-hidden shadow-sm"
            >
              {/* Event header row */}
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{a.clientName || a.eventName}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                      {dayLabel(a.date)}
                    </Badge>
                    <span className="flex items-center gap-1" dir="ltr">
                      <Clock className="w-3 h-3" />
                      <span className="tabular-nums">{a.time.slice(0, 5)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="tabular-nums">{a.guests}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { onViewEvent(a.eventId); onOpenChange(false); }}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
                >
                  צפה בפרטים
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Missing ingredients list */}
              <div className="divide-y">
                {a.missingIngredients.slice(0, 6).map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-destructive/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PackageX className="w-3.5 h-3.5 text-destructive shrink-0" />
                      <span className="font-medium truncate">{ing.name}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px] h-5 px-2 tabular-nums shrink-0">
                      חסר {ing.missing} {ing.unit}
                    </Badge>
                  </div>
                ))}
                {a.missingIngredients.length > 6 && (
                  <div className="px-3 py-1.5 text-[11px] text-muted-foreground text-center bg-muted/20">
                    ועוד {a.missingIngredients.length - 6} רכיבים חסרים
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter className="px-5 py-3 border-t bg-muted/20">
          <AlertDialogCancel className="mt-0">סגור</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>הבנתי</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  currentDate: string; // YYYY-MM-DD
  onConfirm: (newDate: string) => Promise<void> | void;
}

export function RescheduleTaskDialog({ open, onOpenChange, taskName, currentDate, onConfirm }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleConfirm = async () => {
    if (!selectedDate) return;
    setSubmitting(true);
    try {
      await onConfirm(format(selectedDate, 'yyyy-MM-dd'));
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>📅 דחה משימה</DialogTitle>
          <DialogDescription>
            דחה את "{taskName}" לתאריך אחר
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(d) => d < today}
            locale={he}
            weekStartsOn={0}
            className="p-3 pointer-events-auto"
            initialFocus
          />
        </div>
        {selectedDate && (
          <p className="text-sm text-center text-muted-foreground">
            תאריך חדש: <span className="font-semibold text-foreground">{format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: he })}</span>
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleConfirm} disabled={!selectedDate || submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            אשר דחייה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
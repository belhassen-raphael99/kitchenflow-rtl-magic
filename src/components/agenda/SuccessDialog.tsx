import { Check, ArrowLeft } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: string[];
  onGoToEvent?: () => void;
  onBackToAgenda: () => void;
}

export const SuccessDialog = ({
  open, onOpenChange, departments, onGoToEvent, onBackToAgenda
}: SuccessDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] text-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">האירוע נוצר בהצלחה!</h2>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">נוצרו אוטומטית:</p>
            {departments.map(dept => (
              <p key={dept}>• משימת הכנה ל{dept}</p>
            ))}
            <p>• התראה נשלחה לכל הצוות</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBackToAgenda}>
              חזור ליומן
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

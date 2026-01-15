import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EventWithClient } from '@/hooks/useEvents';

interface DeleteEventDialogProps {
  event: EventWithClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteEventDialog = ({
  event,
  open,
  onOpenChange,
  onConfirm,
}: DeleteEventDialogProps) => {
  if (!event) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תמחק את האירוע "{event.name}" לצמיתות.
            לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

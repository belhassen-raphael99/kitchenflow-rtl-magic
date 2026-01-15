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
import { ReserveItem } from '@/hooks/useReserve';

interface DeleteReserveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ReserveItem | null;
  onConfirm: () => void;
}

export const DeleteReserveItemDialog = ({
  open,
  onOpenChange,
  item,
  onConfirm,
}: DeleteReserveItemDialogProps) => {
  if (!item) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת פריט רזרבה</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את הפריט "{item.name}"?
            <br />
            פעולה זו תמחק גם את כל היסטוריית הייצור של הפריט ולא ניתן לשחזרה.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            מחק פריט
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

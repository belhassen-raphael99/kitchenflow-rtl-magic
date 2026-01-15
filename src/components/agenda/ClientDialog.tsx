import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ClientFormData } from '@/hooks/useClients';

const clientSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().optional(),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => Promise<any>;
}

export const ClientDialog = ({ open, onOpenChange, onSubmit }: ClientDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  const handleSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
      });
      if (result) {
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>לקוח חדש</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הלקוח *</FormLabel>
                  <FormControl>
                    <Input placeholder="הכנס שם לקוח" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>טלפון</FormLabel>
                  <FormControl>
                    <Input placeholder="050-1234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אימייל</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כתובת</FormLabel>
                  <FormControl>
                    <Input placeholder="כתובת הלקוח" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="הערות נוספות..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

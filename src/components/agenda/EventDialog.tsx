import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EventFormData, EventStatus, EventWithClient } from '@/hooks/useEvents';
import { Client } from '@/hooks/useClients';

const eventSchema = z.object({
  name: z.string().min(2, 'שם האירוע חייב להכיל לפחות 2 תווים'),
  date: z.date({ required_error: 'יש לבחור תאריך' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט שעה לא תקין'),
  client_id: z.string().optional(),
  guests: z.coerce.number().min(0, 'מספר האורחים חייב להיות חיובי'),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: 'pending', label: 'ממתין' },
  { value: 'in-progress', label: 'בתהליך' },
  { value: 'completed', label: 'הושלם' },
  { value: 'cancelled', label: 'בוטל' },
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventWithClient | null;
  clients: Client[];
  onSubmit: (data: EventFormData) => Promise<boolean>;
  onNewClient: () => void;
  selectedDate?: Date;
}

export const EventDialog = ({
  open,
  onOpenChange,
  event,
  clients,
  onSubmit,
  onNewClient,
  selectedDate,
}: EventDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!event;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      date: selectedDate || new Date(),
      time: '12:00',
      client_id: '',
      guests: 0,
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (event) {
        form.reset({
          name: event.name,
          date: new Date(event.date),
          time: event.time.slice(0, 5),
          client_id: event.client_id || '',
          guests: event.guests,
          status: event.status,
          notes: event.notes || '',
        });
      } else {
        form.reset({
          name: '',
          date: selectedDate || new Date(),
          time: '12:00',
          client_id: '',
          guests: 0,
          status: 'pending',
          notes: '',
        });
      }
    }
  }, [open, event, selectedDate, form]);

  const handleSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        name: values.name,
        date: values.date,
        time: values.time,
        client_id: values.client_id || undefined,
        guests: values.guests,
        status: values.status,
        notes: values.notes,
      });
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'עריכת אירוע' : 'אירוע חדש'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם האירוע *</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: חתונה של דני ומיכל" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>תאריך *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-right font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: he })
                            ) : (
                              <span>בחר תאריך</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={he}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעה *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>לקוח</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="בחר לקוח" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">ללא לקוח</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onNewClient}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר אורחים</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="הערות נוספות על האירוע..." {...field} />
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
                {isEditing ? 'עדכן' : 'צור אירוע'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

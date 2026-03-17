import { useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  CalendarDays, Users, MapPin, Truck, Phone, Mail, Edit, Trash2,
  ClipboardList, MessageSquare, Receipt, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { EventWithClient } from '@/hooks/useEvents';
import { toast } from '@/hooks/use-toast';

interface EventItem {
  id: string;
  name: string;
  quantity: number;
  department: string | null;
  notes: string | null;
  recipe_id: string | null;
}

interface ProductionTask {
  id: string;
  department: string;
  status: string;
  name: string;
}

interface EventDetailPanelProps {
  event: EventWithClient;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  canWrite: boolean;
  onStatusChange?: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין', color: 'bg-amber-500' },
  confirmed: { label: 'מאושר', color: 'bg-green-500' },
  'in-progress': { label: 'בתהליך', color: 'bg-blue-500' },
  completed: { label: 'הושלם', color: 'bg-muted' },
  cancelled: { label: 'בוטל', color: 'bg-destructive' },
};

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  sent: { label: 'נשלח', color: 'bg-amber-500' },
  paid: { label: 'שולם', color: 'bg-green-500' },
  cancelled: { label: 'בוטל', color: 'bg-destructive' },
};

const taskStatusEmoji: Record<string, string> = {
  pending: '🔴',
  'in-progress': '🟡',
  completed: '🟢',
  cancelled: '⚫',
};

export const EventDetailPanel = ({
  event, onEdit, onDelete, onClose, canWrite, onStatusChange
}: EventDetailPanelProps) => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);

  const eventData = event as any; // extended fields

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const [itemsRes, tasksRes] = await Promise.all([
        supabase.from('event_items').select('id, name, quantity, department, notes, recipe_id').eq('event_id', event.id),
        supabase.from('production_tasks').select('id, department, status, name').eq('event_id', event.id),
      ]);
      setItems(itemsRes.data || []);
      setTasks(tasksRes.data || []);
      setLoading(false);
    };
    fetchDetails();
  }, [event.id]);

  const handleStatusChange = async (newStatus: string) => {
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', event.id);
    if (error) {
      toast({ title: 'שגיאה בעדכון סטטוס', variant: 'destructive' });
      return;
    }

    if (newStatus === 'cancelled') {
      await supabase.from('production_tasks').update({ status: 'cancelled' }).eq('event_id', event.id);
      await supabase.from('notifications').insert({
        title: '❌ אירוע בוטל',
        message: `${eventData.client_name || event.name} — האירוע בוטל`,
        severity: 'warning', type: 'event_cancelled',
      });
    }

    toast({ title: 'סטטוס עודכן' });
    onStatusChange?.();
  };

  const handleInvoiceStatusChange = async (newStatus: string) => {
    const { error } = await supabase.from('events').update({ invoice_status: newStatus }).eq('id', event.id);
    if (error) {
      toast({ title: 'שגיאה בעדכון סטטוס חשבונית', variant: 'destructive' });
      return;
    }

    if (newStatus === 'paid') {
      await supabase.from('notifications').insert({
        title: '✅ תשלום התקבל',
        message: `${eventData.client_name || event.name} — תשלום התקבל`,
        severity: 'info', type: 'payment_received',
      });
    }

    toast({ title: 'סטטוס חשבונית עודכן' });
    onStatusChange?.();
  };

  const daysUntil = differenceInDays(new Date(event.date), new Date());
  const urgencyClass = daysUntil <= 2 ? 'border-r-destructive' : daysUntil <= 7 ? 'border-r-amber-500' : 'border-r-primary';

  const groupedItems: Record<string, EventItem[]> = {};
  items.forEach(item => {
    const dept = item.department || 'מטבח';
    if (!groupedItems[dept]) groupedItems[dept] = [];
    groupedItems[dept].push(item);
  });

  const formattedTime = event.time?.slice(0, 5) || '';
  const status = statusConfig[event.status] || statusConfig.pending;

  return (
    <Card className={cn("border-r-4", urgencyClass)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{eventData.client_name || event.name}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge className={status.color}>{status.label}</Badge>
              {eventData.event_type && <Badge variant="outline">{eventData.event_type}</Badge>}
              {daysUntil <= 2 && daysUntil >= 0 && <Badge variant="destructive">דחוף!</Badge>}
            </div>
          </div>
          <div className="flex gap-1">
            {canWrite && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1">
          <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />{format(new Date(event.date), 'dd/MM/yyyy', { locale: he })} | {formattedTime}</p>
          <p className="flex items-center gap-2"><Users className="w-4 h-4" />{event.guests} אורחים</p>
          {eventData.delivery_address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{eventData.delivery_address}</p>}
          {eventData.delivery_time && <p className="flex items-center gap-2"><Truck className="w-4 h-4" />משלוח: {eventData.delivery_time?.slice(0, 5)}</p>}
          {eventData.client_phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{eventData.client_phone}</p>}
          {eventData.client_email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" />{eventData.client_email}</p>}
        </div>

        {/* Quick status changes */}
        {canWrite && (
          <div className="space-y-2">
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">סטטוס אירוע</label>
                <Select value={event.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">סטטוס חשבונית</label>
                <Select value={eventData.invoice_status || 'sent'} onValueChange={handleInvoiceStatusChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(invoiceStatusConfig).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        {items.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4" />
                פריטי ההזמנה
              </h4>
              {Object.entries(groupedItems).map(([dept, deptItems]) => (
                <div key={dept} className="mb-2">
                  <p className="font-medium text-xs text-muted-foreground">{dept}</p>
                  <ul className="mr-4 space-y-0.5">
                    {deptItems.map(item => (
                      <li key={item.id} className="text-sm">• {item.name} — {item.quantity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Production Tasks */}
        {tasks.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4" />
                משימות ייצור
              </h4>
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.department || task.name}</span>
                  <span>{taskStatusEmoji[task.status] || '⚪'} {statusConfig[task.status]?.label || task.status}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        {event.notes && (
          <>
            <Separator />
            <p className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
              {event.notes}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Truck,
  MapPin,
  Phone,
  Mail,
  Users,
  Clock,
  CalendarDays,
  PackageCheck,
  Send,
  CheckCircle,
  Loader2,
  ChefHat,
  Eye,
  Package,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DeliveryEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  delivery_address: string | null;
  delivery_time: string | null;
  event_type: string | null;
  notes: string | null;
  invoice_status: string | null;
  invoice_amount: number | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    department: string | null;
    notes: string | null;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    department: string;
    target_quantity: number;
    completed_quantity: number;
    unit: string;
  }>;
}

type DeliveryStatus = 'preparing' | 'ready' | 'dispatched' | 'delivered';

export const DeliveryPage = () => {
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DeliveryEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const { toast } = useToast();

  const fetchDeliveryEvents = useCallback(async () => {
    setLoading(true);

    // Get upcoming confirmed events
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .in('status', ['confirmed', 'pending', 'in-progress'])
      .gte('date', new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      toast({ title: 'שגיאה בטעינת משלוחים', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // For each event, fetch items and tasks
    const enriched: DeliveryEvent[] = [];
    for (const event of eventsData || []) {
      const [itemsRes, tasksRes] = await Promise.all([
        supabase.from('event_items').select('id, name, quantity, department, notes').eq('event_id', event.id),
        supabase.from('production_tasks').select('id, name, status, department, target_quantity, completed_quantity, unit').eq('event_id', event.id),
      ]);

      enriched.push({
        ...event,
        items: (itemsRes.data || []) as DeliveryEvent['items'],
        tasks: (tasksRes.data || []) as DeliveryEvent['tasks'],
      });
    }

    setEvents(enriched);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDeliveryEvents();
  }, [fetchDeliveryEvents]);

  const getDeliveryStatus = (event: DeliveryEvent): DeliveryStatus => {
    if (event.status === 'completed') return 'delivered';
    if (event.status === 'in-progress') return 'dispatched';
    
    const allTasksCompleted = event.tasks.length > 0 && 
      event.tasks.every(t => t.status === 'completed' || t.status === 'cancelled');
    
    if (allTasksCompleted) return 'ready';
    return 'preparing';
  };

  const getStatusConfig = (status: DeliveryStatus) => {
    switch (status) {
      case 'preparing':
        return { label: 'בהכנה', color: 'bg-amber-500', icon: ChefHat, textColor: 'text-amber-700', bgLight: 'bg-amber-50' };
      case 'ready':
        return { label: 'מוכן למשלוח', color: 'bg-green-500', icon: PackageCheck, textColor: 'text-green-700', bgLight: 'bg-green-50' };
      case 'dispatched':
        return { label: 'בדרך', color: 'bg-blue-500', icon: Truck, textColor: 'text-blue-700', bgLight: 'bg-blue-50' };
      case 'delivered':
        return { label: 'נמסר', color: 'bg-muted-foreground', icon: CheckCircle, textColor: 'text-muted-foreground', bgLight: 'bg-muted' };
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'היום';
    if (isTomorrow(date)) return 'מחר';
    const days = differenceInDays(date, new Date());
    return `בעוד ${days} ימים`;
  };

  const handleDispatch = async (event: DeliveryEvent) => {
    setDispatching(true);
    
    const { error } = await supabase
      .from('events')
      .update({ status: 'in-progress' })
      .eq('id', event.id);

    if (!error) {
      // Send notification
      await supabase.from('notifications').insert({
        title: '🚚 משלוח יצא לדרך',
        message: `${event.event_type} — ${event.client_name} | ${event.delivery_address}`,
        severity: 'info',
        type: 'delivery',
      });

      toast({ title: '🚚 משלוח יצא לדרך', description: `${event.client_name} — ${event.delivery_address}` });
      await fetchDeliveryEvents();
    } else {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }

    setDispatching(false);
    setDispatchConfirmOpen(false);
  };

  const handleMarkDelivered = async (event: DeliveryEvent) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', event.id);

    if (!error) {
      await supabase.from('notifications').insert({
        title: '✅ משלוח נמסר בהצלחה',
        message: `${event.event_type} — ${event.client_name}`,
        severity: 'info',
        type: 'delivery',
      });

      toast({ title: '✅ משלוח נמסר', description: event.client_name || '' });
      await fetchDeliveryEvents();
    }
  };

  const openDetail = (event: DeliveryEvent) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  const openDispatchConfirm = (event: DeliveryEvent) => {
    setSelectedEvent(event);
    setDispatchConfirmOpen(true);
  };

  // Group events by delivery status
  const readyEvents = events.filter(e => getDeliveryStatus(e) === 'ready');
  const preparingEvents = events.filter(e => getDeliveryStatus(e) === 'preparing');
  const dispatchedEvents = events.filter(e => getDeliveryStatus(e) === 'dispatched');

  const completedTasksCount = (event: DeliveryEvent) => 
    event.tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6" />
            משלוחים
          </h1>
          <p className="text-muted-foreground">ניהול משלוחים והזמנות מוכנות</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          הדפס יום
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">אין משלוחים קרובים</h3>
            <p className="text-sm text-muted-foreground">כשאירועים יהיו מוכנים, הם יופיעו כאן</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Ready for dispatch — highlighted */}
          {readyEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-lg font-bold text-green-700">מוכן למשלוח ({readyEvents.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {readyEvents.map(event => {
                  const status = getDeliveryStatus(event);
                  const config = getStatusConfig(status);
                  return (
                    <Card key={event.id} className="border-green-300 border-2 shadow-md">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-base">{event.client_name || event.name}</h3>
                            <p className="text-sm text-muted-foreground">{event.event_type}</p>
                          </div>
                          <Badge className={cn(config.color, "gap-1")}>
                            <config.icon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{format(parseISO(event.date), 'dd/MM', { locale: he })} — {getDateLabel(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>משלוח: {event.delivery_time || event.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{event.guests} אורחים</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{event.delivery_address || '—'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <PackageCheck className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium">
                            כל {event.tasks.length} המשימות הושלמו — {event.items.length} פריטים מוכנים
                          </span>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => openDispatchConfirm(event)}
                          >
                            <Send className="w-4 h-4" />
                            שלח משלוח
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openDetail(event)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Dispatched — in transit */}
          {dispatchedEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h2 className="text-lg font-bold text-blue-700">בדרך ({dispatchedEvents.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dispatchedEvents.map(event => (
                  <Card key={event.id} className="border-blue-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{event.client_name || event.name}</h3>
                          <p className="text-sm text-muted-foreground">{event.event_type}</p>
                        </div>
                        <Badge className="bg-blue-500 gap-1">
                          <Truck className="w-3 h-3" />
                          בדרך
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.delivery_address || '—'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{event.client_phone || '—'}</span>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          className="flex-1 gap-2"
                          variant="outline"
                          onClick={() => handleMarkDelivered(event)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          נמסר בהצלחה
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => openDetail(event)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Still preparing */}
          {preparingEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h2 className="text-lg font-bold text-amber-700">בהכנה ({preparingEvents.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preparingEvents.map(event => {
                  const completed = completedTasksCount(event);
                  const total = event.tasks.length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <Card key={event.id} className="border-amber-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{event.client_name || event.name}</h3>
                            <p className="text-sm text-muted-foreground">{event.event_type} — {getDateLabel(event.date)}</p>
                          </div>
                          <Badge className="bg-amber-500 gap-1">
                            <ChefHat className="w-3 h-3" />
                            בהכנה
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.guests} אורחים</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />משלוח: {event.delivery_time || event.time}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>התקדמות ייצור</span>
                            <span>{completed}/{total} משימות ({percent}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <Button variant="outline" className="w-full gap-2" onClick={() => openDetail(event)}>
                          <Eye className="w-4 h-4" />
                          פרטי הזמנה
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  פרטי הזמנה — {selectedEvent.client_name || selectedEvent.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client info */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">פרטי לקוח</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedEvent.client_name}</span>
                      <span className="text-muted-foreground">| {selectedEvent.guests} אורחים</span>
                    </div>
                    {selectedEvent.client_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedEvent.client_phone}`} className="text-primary underline">
                          {selectedEvent.client_phone}
                        </a>
                      </div>
                    )}
                    {selectedEvent.client_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${selectedEvent.client_email}`} className="text-primary underline">
                          {selectedEvent.client_email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedEvent.delivery_address || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(parseISO(selectedEvent.date), 'dd/MM/yyyy', { locale: he })} | 
                        שעת משלוח: {selectedEvent.delivery_time || selectedEvent.time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🍽 פריטי הזמנה ({selectedEvent.items.length})</h4>
                  <div className="divide-y">
                    {selectedEvent.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.department && (
                            <Badge variant="outline" className="mr-2 text-[10px]">{item.department}</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Production status */}
                {selectedEvent.tasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">📋 סטטוס ייצור</h4>
                    <div className="space-y-1">
                      {selectedEvent.tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between py-1.5 text-sm">
                          <span>{task.name}</span>
                          <Badge className={cn(
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-blue-500' :
                            task.status === 'cancelled' ? 'bg-destructive' : 'bg-muted-foreground'
                          )}>
                            {task.status === 'completed' ? 'הושלם' :
                             task.status === 'in-progress' ? 'בביצוע' :
                             task.status === 'cancelled' ? 'בוטל' : 'ממתין'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedEvent.notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm"><span className="font-medium">💬 הערות:</span> {selectedEvent.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch confirmation */}
      <Dialog open={dispatchConfirmOpen} onOpenChange={setDispatchConfirmOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              שליחת משלוח
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                <p className="font-bold text-lg">{selectedEvent.client_name}</p>
                <p className="text-sm text-muted-foreground">{selectedEvent.delivery_address}</p>
                <p className="text-sm text-muted-foreground">
                  שעת משלוח: {selectedEvent.delivery_time || selectedEvent.time}
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <p className="font-medium mb-1">✓ הזמנה מוכנה — {selectedEvent.items.length} פריטים</p>
                <p>הלחיצה על "שלח" תסמן את ההזמנה כ"בדרך" ותשלח התראה לצוות.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchConfirmOpen(false)}>
              ביטול
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => selectedEvent && handleDispatch(selectedEvent)}
              disabled={dispatching}
            >
              {dispatching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              שלח משלוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

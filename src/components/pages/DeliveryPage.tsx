import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Truck, MapPin, Phone, Users, Clock, CalendarDays, PackageCheck, Send,
  CheckCircle, Loader2, ChefHat, Eye, Package, Printer, MessageCircle,
  ChevronRight, ChevronLeft, History, Camera, FileImage, X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { format, parseISO, isToday, isTomorrow, differenceInDays, addDays, subDays } from 'date-fns';
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
  delivery_proof_url: string | null;
  items: Array<{ id: string; name: string; quantity: number; department: string | null; notes: string | null }>;
  tasks: Array<{ id: string; name: string; status: string; department: string; target_quantity: number; completed_quantity: number; unit: string }>;
}

type DeliveryStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'delivered';

const statusConfig: Record<DeliveryStatus, { label: string; dotColor: string; badgeClass: string; icon: typeof Truck }> = {
  pending: { label: 'ממתין', dotColor: 'bg-destructive', badgeClass: 'bg-destructive', icon: Clock },
  preparing: { label: 'בהכנה', dotColor: 'bg-amber-500', badgeClass: 'bg-amber-500', icon: ChefHat },
  ready: { label: 'מוכן לשליחה', dotColor: 'bg-primary', badgeClass: 'bg-primary', icon: PackageCheck },
  dispatched: { label: 'בדרך', dotColor: 'bg-blue-500', badgeClass: 'bg-blue-500', icon: Truck },
  delivered: { label: 'נמסר', dotColor: 'bg-muted-foreground', badgeClass: 'bg-muted-foreground', icon: CheckCircle },
};

const getWhatsAppUrl = (phone: string | null) => {
  if (!phone) return '';
  const clean = phone.replace(/^0/, '972').replace(/[-\s]/g, '');
  return `https://wa.me/${clean}`;
};

export const DeliveryPage = () => {
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [historyEvents, setHistoryEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DeliveryEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [proofMode, setProofMode] = useState<'none' | 'signature' | 'photo'>('none');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [generatingSlip, setGeneratingSlip] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchDeliveryEvents = useCallback(async () => {
    setLoading(true);
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .in('status', ['confirmed', 'pending', 'in-progress'])
      .eq('date', dateStr)
      .order('delivery_time', { ascending: true, nullsFirst: false })
      .order('time', { ascending: true });

    if (error) {
      toast({ title: 'שגיאה בטעינת משלוחים', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const enriched: DeliveryEvent[] = [];
    for (const event of eventsData || []) {
      const [itemsRes, tasksRes] = await Promise.all([
        supabase.from('event_items').select('id, name, quantity, department, notes').eq('event_id', event.id),
        supabase.from('production_tasks').select('id, name, status, department, target_quantity, completed_quantity, unit').eq('event_id', event.id),
      ]);
      enriched.push({
        ...event,
        delivery_proof_url: (event as any).delivery_proof_url || null,
        items: (itemsRes.data || []) as DeliveryEvent['items'],
        tasks: (tasksRes.data || []) as DeliveryEvent['tasks'],
      });
    }
    setEvents(enriched);
    setLoading(false);
  }, [dateStr, toast]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'completed')
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false });

    setHistoryEvents((data || []).map(e => ({ ...e, delivery_proof_url: (e as any).delivery_proof_url || null, items: [], tasks: [] })));
    setHistoryLoading(false);
  }, []);

  useEffect(() => { fetchDeliveryEvents(); }, [fetchDeliveryEvents]);
  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, fetchHistory]);

  const getDeliveryStatus = (event: DeliveryEvent): DeliveryStatus => {
    if (event.status === 'completed') return 'delivered';
    if (event.status === 'in-progress') return 'dispatched';
    const allDone = event.tasks.length > 0 && event.tasks.every(t => t.status === 'completed' || t.status === 'cancelled');
    if (allDone) return 'ready';
    if (event.tasks.some(t => t.status === 'in-progress' || t.status === 'completed')) return 'preparing';
    return 'pending';
  };

  const handleDispatch = async (event: DeliveryEvent) => {
    setDispatching(true);
    const { error } = await supabase.from('events').update({ status: 'in-progress' }).eq('id', event.id);
    if (!error) {
      await supabase.from('notifications').insert({
        title: '🚚 משלוח יצא לדרך',
        message: `${event.event_type} — ${event.client_name} | ${event.delivery_address}`,
        severity: 'info', type: 'delivery',
      });
      toast({ title: '🚚 משלוח יצא לדרך', description: `${event.client_name}` });
      await fetchDeliveryEvents();
    } else {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
    setDispatching(false);
    setDispatchConfirmOpen(false);
    setCheckedItems(new Set());
    setProofMode('none');
  };

  const handleMarkDelivered = async (event: DeliveryEvent) => {
    await supabase.from('events').update({ status: 'completed' }).eq('id', event.id);
    await supabase.from('notifications').insert({
      title: '✅ משלוח נמסר', message: `${event.client_name}`, severity: 'info', type: 'delivery',
    });
    toast({ title: '✅ משלוח נמסר', description: event.client_name || '' });
    await fetchDeliveryEvents();
  };

  const openDispatchConfirm = (event: DeliveryEvent) => {
    setSelectedEvent(event);
    setCheckedItems(new Set());
    setProofMode('none');
    setDispatchConfirmOpen(true);
  };

  // Signature canvas handlers
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  useEffect(() => { if (proofMode === 'signature') setTimeout(initCanvas, 100); }, [proofMode, initCanvas]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawingRef.current = true;
    const { x, y } = getPos(e);
    canvasRef.current?.getContext('2d')?.beginPath();
    canvasRef.current?.getContext('2d')?.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const endDraw = () => { isDrawingRef.current = false; };

  const uploadProof = async (blob: Blob, ext: string) => {
    if (!selectedEvent) return;
    setUploadingProof(true);
    const path = `${selectedEvent.id}/proof_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('delivery-proofs').upload(path, blob);
    if (uploadErr) {
      toast({ title: 'שגיאה בהעלאה', description: uploadErr.message, variant: 'destructive' });
      setUploadingProof(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('delivery-proofs').getPublicUrl(path);
    await supabase.from('events').update({ delivery_proof_url: urlData.publicUrl } as any).eq('id', selectedEvent.id);
    toast({ title: '✅ אישור משלוח נשמר' });
    setUploadingProof(false);
    setProofMode('none');
  };

  const handleSignatureSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => { if (blob) await uploadProof(blob, 'png'); }, 'image/png');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadProof(file, file.name.split('.').pop() || 'jpg');
  };

  const allItemsChecked = selectedEvent ? selectedEvent.items.every(item => checkedItems.has(item.id)) : false;

  const handleGenerateSlip = async (event: DeliveryEvent) => {
    setGeneratingSlip(event.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-delivery-slip', {
        body: { event_id: event.id },
      });
      if (error) throw error;
      if (data?.slip_url) {
        window.open(data.slip_url, '_blank');
        toast({ title: '📦 בון משלוח הופק', description: 'הקובץ נפתח בחלון חדש' });
        await fetchDeliveryEvents();
      } else if (data?.html) {
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast({ title: '📦 בון משלוח הופק' });
      }
    } catch (err: any) {
      toast({ title: 'שגיאה בהפקת בון', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingSlip(null);
    }
  };

  // Sort events by delivery time for timeline
  const sortedEvents = [...events].sort((a, b) => {
    const tA = a.delivery_time || a.time || '23:59';
    const tB = b.delivery_time || b.time || '23:59';
    return tA.localeCompare(tB);
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <PageHeader
        icon={Truck}
        title="משלוחים"
        description="ניהול משלוחים והזמנות"
        accentColor="blue"
        actions={
          <Button variant="outline" size="sm" className="gap-2 no-print rounded-md" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            הדפס יום
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="no-print">
          <TabsTrigger value="today" className="gap-2"><Truck className="w-4 h-4" />משלוחים</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" />היסטוריה</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4 mt-4">
          {/* Date navigation */}
          <div className="flex items-center justify-center gap-3 no-print">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[160px]">
              <p className="font-bold">{format(selectedDate, 'EEEE', { locale: he })}</p>
              <p className="text-sm text-muted-foreground">{format(selectedDate, 'dd/MM/yyyy')}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {!isToday(selectedDate) && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>היום</Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : sortedEvents.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">אין משלוחים ב{format(selectedDate, 'dd/MM', { locale: he })}</h3>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {sortedEvents.map(event => {
                const status = getDeliveryStatus(event);
                const config = statusConfig[status];
                const completedTasks = event.tasks.filter(t => t.status === 'completed').length;
                const totalTasks = event.tasks.length;
                const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Timeline time column */}
                        <div className="w-20 shrink-0 bg-muted/50 flex flex-col items-center justify-center p-3 border-l border-border">
                          <span className="text-lg font-bold">{(event.delivery_time || event.time || '').slice(0, 5)}</span>
                          <div className={cn("w-3 h-3 rounded-full mt-1", config.dotColor)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold">{event.client_name || event.name}</h3>
                              <p className="text-sm text-muted-foreground">{event.event_type}</p>
                            </div>
                            <Badge className={cn(config.badgeClass, "gap-1 text-primary-foreground")}>
                              <config.icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.guests} אורחים</span>
                            {event.delivery_address && (
                              <a
                                href={`https://waze.com/ul?q=${encodeURIComponent(event.delivery_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <MapPin className="w-3.5 h-3.5" />{event.delivery_address}
                              </a>
                            )}
                          </div>

                          {/* Progress bar for preparing */}
                          {(status === 'preparing' || status === 'pending') && totalTasks > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>התקדמות ייצור</span>
                                <span>{completedTasks}/{totalTasks} ({percent}%)</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Contact + action buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                            {event.client_phone && (
                              <>
                                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                  <a href={`tel:${event.client_phone}`}><Phone className="w-3.5 h-3.5" />התקשר</a>
                                </Button>
                                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                  <a href={getWhatsAppUrl(event.client_phone)} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                                  </a>
                                </Button>
                              </>
                            )}
                            <div className="flex-1" />
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleGenerateSlip(event)} disabled={generatingSlip === event.id}>
                              {generatingSlip === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                              בון משלוח
                            </Button>
                            {status === 'ready' && (
                              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={() => openDispatchConfirm(event)}>
                                <Send className="w-3.5 h-3.5" />שלח
                              </Button>
                            )}
                            {status === 'dispatched' && (
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleMarkDelivered(event)}>
                                <CheckCircle className="w-3.5 h-3.5" />נמסר
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedEvent(event); setDetailOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="mt-4">
          {historyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : historyEvents.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">אין היסטוריית משלוחים</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {historyEvents.map(event => (
                <Card key={event.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => { setSelectedEvent(event); setDetailOpen(true); }}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{event.client_name || event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.event_type} — {event.guests} אורחים</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{format(parseISO(event.date), 'dd/MM/yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{event.delivery_time || event.time}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {selectedEvent.client_name || selectedEvent.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" />{selectedEvent.client_name} — {selectedEvent.guests} אורחים</div>
                  {selectedEvent.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedEvent.client_phone}`} className="text-primary underline">{selectedEvent.client_phone}</a>
                      <a href={getWhatsAppUrl(selectedEvent.client_phone)} target="_blank" rel="noopener noreferrer" className="text-primary underline mr-2">WhatsApp</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{selectedEvent.delivery_address || '—'}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{format(parseISO(selectedEvent.date), 'dd/MM/yyyy')} | {selectedEvent.delivery_time || selectedEvent.time}</div>
                </div>
                {selectedEvent.items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">🍽 פריטי הזמנה ({selectedEvent.items.length})</h4>
                    <div className="divide-y">{selectedEvent.items.map(item => (
                      <div key={item.id} className="flex justify-between py-1.5 text-sm">
                        <span>{item.name}{item.department && <Badge variant="outline" className="mr-2 text-[10px]">{item.department}</Badge>}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </div>
                    ))}</div>
                  </div>
                )}
                {selectedEvent.delivery_proof_url && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">📸 אישור משלוח</h4>
                    <img src={selectedEvent.delivery_proof_url} alt="delivery proof" className="w-full max-h-48 object-contain rounded-lg border" />
                  </div>
                )}
                {selectedEvent.notes && (
                  <div className="p-3 bg-accent/30 rounded-lg text-sm">💬 {selectedEvent.notes}</div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch with checklist + proof */}
      <Dialog open={dispatchConfirmOpen} onOpenChange={(v) => { setDispatchConfirmOpen(v); if (!v) { setCheckedItems(new Set()); setProofMode('none'); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              שליחת משלוח
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="font-bold">{selectedEvent.client_name}</p>
                <p className="text-sm text-muted-foreground">{selectedEvent.delivery_address} — {selectedEvent.delivery_time || selectedEvent.time}</p>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">וודא שהכל עלה לרכב:</h4>
                {selectedEvent.items.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={(checked) => {
                        setCheckedItems(prev => {
                          const next = new Set(prev);
                          checked ? next.add(item.id) : next.delete(item.id);
                          return next;
                        });
                      }}
                    />
                    <span className="flex-1 text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                  </label>
                ))}
                <p className="text-xs text-muted-foreground text-center">
                  {checkedItems.size}/{selectedEvent.items.length} פריטים אושרו
                </p>
              </div>

              {/* Proof section — only show after all checked */}
              {allItemsChecked && proofMode === 'none' && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">אישור משלוח (אופציונלי)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setProofMode('signature')}>
                      ✍️ חתימה
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setProofMode('photo')}>
                      <Camera className="w-4 h-4" />צילום
                    </Button>
                  </div>
                </div>
              )}

              {/* Signature canvas */}
              {proofMode === 'signature' && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">חתימת מקבל המשלוח</p>
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={160}
                    className="border rounded-lg w-full touch-none bg-card"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={initCanvas}>נקה</Button>
                    <Button variant="ghost" size="sm" onClick={() => setProofMode('none')}>ביטול</Button>
                    <div className="flex-1" />
                    <Button size="sm" onClick={handleSignatureSave} disabled={uploadingProof}>
                      {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור חתימה'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Photo upload */}
              {proofMode === 'photo' && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">צלם תמונת אישור</p>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadingProof}>
                      {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" />פתח מצלמה / גלריה</>}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setProofMode('none')}>ביטול</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchConfirmOpen(false)}>ביטול</Button>
            <Button
              className="gap-2"
              onClick={() => selectedEvent && handleDispatch(selectedEvent)}
              disabled={dispatching || !allItemsChecked}
            >
              {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              שלח משלוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

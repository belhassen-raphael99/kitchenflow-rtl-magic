import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface EventLite {
  id: string;
  name: string;
  client_name: string | null;
  date?: string;
  time?: string | null;
  delivery_time?: string | null;
  guests?: number;
  delivery_address?: string | null;
}

interface EventItemRow {
  id: string;
  name: string;
  quantity: number;
  servings: number | null;
  department: string | null;
  notes: string | null;
  recipe_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventLite | null;
}

const deptIcons: Record<string, string> = {
  'מטבח': '🍳',
  'מאפייה': '🍞',
  'קונדיטוריה': '🍰',
  'קונדיטוריה-פטיסרי': '🍰',
  'קונדיטוריה-בצקים': '🥐',
};

export function EventChefDetailDialog({ open, onOpenChange, event }: Props) {
  const [items, setItems] = useState<EventItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !event?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_items')
        .select('id, name, quantity, servings, department, notes, recipe_id')
        .eq('event_id', event.id);
      if (!cancelled) {
        if (!error && data) setItems(data as EventItemRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, event?.id]);

  if (!event) return null;

  // Group by department
  const grouped = items.reduce<Record<string, EventItemRow[]>>((acc, item) => {
    const key = item.department || 'אחר';
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  const time = (event.delivery_time || event.time || '').slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {event.client_name || event.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap text-sm pt-1">
            {time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {time}</span>}
            {typeof event.guests === 'number' && (
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.guests} סועדים</span>
            )}
            {event.delivery_address && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.delivery_address}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">אין פריטים מוגדרים לאירוע זה</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([dept, deptItems]) => (
              <div key={dept} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 font-semibold text-sm border-b border-border">
                  <span>{deptIcons[dept] || '📦'}</span>
                  <span>{dept}</span>
                  <Badge variant="secondary" className="text-[10px] mr-auto">{deptItems.length}</Badge>
                </div>
                <div className="divide-y divide-border">
                  {deptItems.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{it.name}</p>
                        {it.notes && <p className="text-xs text-muted-foreground truncate">{it.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">{it.quantity} מנות</Badge>
                        {it.servings && it.servings > 1 && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">×{it.servings}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
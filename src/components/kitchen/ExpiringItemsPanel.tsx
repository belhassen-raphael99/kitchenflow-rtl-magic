import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInCalendarDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExpiringItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
}

export function ExpiringItemsPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const todayStr = format(today, 'yyyy-MM-dd');
    const futureStr = format(future, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('reserve_items')
      .select('id, name, quantity, unit, expiry_date')
      .gt('quantity', 0)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureStr)
      .order('expiry_date', { ascending: true });

    if (!error && data) setItems(data as ExpiringItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sorted = useMemo(() => items, [items]);

  const handleMarkExpired = async (item: ExpiringItem) => {
    setActing(item.id);
    const before = item.quantity;
    const { error } = await supabase
      .from('reserve_items')
      .update({ quantity: 0 })
      .eq('id', item.id);
    if (!error) {
      const { data: userRes } = await supabase.auth.getUser();
      await supabase.from('production_logs').insert([{
        reserve_item_id: item.id,
        action: 'expired',
        quantity: before,
        previous_quantity: before,
        new_quantity: 0,
        user_id: userRes.user?.id || null,
        notes: 'פג תוקף — סומן להשמדה',
      }]);
      toast({ title: '🗑️ הפריט סומן כפג תוקף', description: item.name });
      fetchData();
    } else {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
    setActing(null);
  };

  if (loading) {
    return (
      <Card className="rounded-lg">
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card className="rounded-lg border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          ✅ אין פריטים עם תוקף קרוב
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="rounded-lg border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          פג תוקף — {sorted.length} פריטים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {sorted.map((item) => {
          const exp = new Date(item.expiry_date! + 'T00:00:00');
          const diff = differenceInCalendarDays(exp, today);
          let tone = 'border-yellow-300 bg-yellow-50/60 text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-200';
          let label = `נותרו ${diff} ימים`;
          if (diff < 0) {
            tone = 'border-red-400 bg-red-50/60 text-red-900 dark:bg-red-950/20 dark:text-red-200';
            label = `פג ${Math.abs(diff)} ימים`;
          } else if (diff <= 3) {
            tone = 'border-orange-400 bg-orange-50/60 text-orange-900 dark:bg-orange-950/20 dark:text-orange-200';
            label = diff === 0 ? 'פג היום' : `נותרו ${diff} ימים`;
          }
          return (
            <div key={item.id} className={cn('flex items-center justify-between p-2.5 rounded-md border', tone)}>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-[11px] opacity-80">
                  {item.quantity} {item.unit} · תוקף: {format(exp, 'dd/MM', { locale: he })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] bg-background">{label}</Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  disabled={acting === item.id}
                  onClick={() => handleMarkExpired(item)}>
                  {acting === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  סמן כמושמד
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
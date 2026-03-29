import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed, Search, Plus, Printer, BookOpen, Loader2, Pencil, Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CatalogItemDialog } from '@/components/catalog/CatalogItemDialog';

interface CatalogItem {
  id: string;
  name_website: string;
  name_internal: string;
  recipe_id: string | null;
  department: string | null;
  unit_type: string | null;
  quantity_per_serving: number | null;
  size_option: string | null;
  notes: string | null;
  price: number | null;
  is_active: boolean;
}

const deptColors: Record<string, string> = {
  'מטבח': 'bg-primary/10 text-primary border-primary/20',
  'מאפייה': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  'קונדיטוריה': 'bg-pink-500/10 text-pink-700 border-pink-500/20',
};

export const CatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const { canWrite, canDelete } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('catalog_items' as any)
      .select('*')
      .order('department')
      .order('name_website');
    if (error) toast({ title: 'שגיאה בטעינת קטלוג', description: error.message, variant: 'destructive' });
    setItems((data || []) as unknown as CatalogItem[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    else { toast({ title: 'פריט נמחק' }); fetchItems(); }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item => {
    const matchSearch = !search || 
      item.name_website.includes(search) || 
      item.name_internal.includes(search);
    const matchDept = !deptFilter || item.department === deptFilter;
    return matchSearch && matchDept;
  });

  const departments = [...new Set(items.map(i => i.department).filter(Boolean))] as string[];

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader
        icon={UtensilsCrossed}
        title="קטלוג מגשים"
        description={`${items.length} פריטים`}
        accentColor="orange"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              הדפס
            </Button>
            {canWrite && (
              <Button size="sm" className="gap-2" onClick={() => { setEditingItem(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4" />
                פריט חדש
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש מנה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={deptFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDeptFilter(null)}
          >
            הכל
          </Button>
          {departments.map(dept => (
            <Button
              key={dept}
              variant={deptFilter === dept ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDeptFilter(dept)}
            >
              {dept}
            </Button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="rounded-2xl hover:shadow-card transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{item.name_website}</h3>
                    {item.name_internal !== item.name_website && (
                      <p className="text-xs text-muted-foreground truncate">{item.name_internal}</p>
                    )}
                  </div>
                  {item.department && (
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", deptColors[item.department] || '')}>
                      {item.department}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.quantity_per_serving && (
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {item.quantity_per_serving} {item.unit_type}
                    </span>
                  )}
                  {item.size_option && (
                    <span className="bg-muted px-2 py-0.5 rounded">{item.size_option}</span>
                  )}
                  {item.price && (
                    <span className="bg-muted px-2 py-0.5 rounded font-medium">₪{item.price}</span>
                  )}
                </div>

                {item.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">{item.notes}</p>
                )}

                <div className="flex gap-1.5 pt-1 border-t border-border">
                  {item.recipe_id && (
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                      <BookOpen className="w-3 h-3" />
                      מתכון
                    </Button>
                  )}
                  {canWrite && (
                    <>
                      <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => { setEditingItem(item); setDialogOpen(true); }}>
                        <Pencil className="w-3 h-3" />
                        ערוך
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UtensilsCrossed}
          title="אין פריטים בקטלוג"
          description="התחל להוסיף מנות לקטלוג"
        />
      )}

      {/* Print view */}
      <div className="hidden print:block">
        <h2 className="text-lg font-bold mb-4">קטלוג מגשי אירוח</h2>
        {departments.map(dept => {
          const deptItems = items.filter(i => i.department === dept);
          if (deptItems.length === 0) return null;
          return (
            <div key={dept} className="mb-4 print-section">
              <h3 className="font-bold text-sm mb-2">{dept}</h3>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>כמות</th>
                    <th>גודל</th>
                    <th>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {deptItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name_website}</td>
                      <td>{item.quantity_per_serving} {item.unit_type}</td>
                      <td>{item.size_option || '-'}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <CatalogItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} onSuccess={fetchItems} />
    </div>
  );
};

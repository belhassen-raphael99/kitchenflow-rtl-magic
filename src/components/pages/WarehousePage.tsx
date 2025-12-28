import { Package, Plus, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export const WarehousePage = () => {
  const { items, categories, loading } = useWarehouse();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-primary';
      case 'low': return 'text-secondary';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryColor = (categoryName: string | undefined) => {
    const colors: Record<string, string> = {
      'יבשים': 'bg-amber-100 text-amber-700',
      'ירקות': 'bg-green-100 text-green-700',
      'פירות': 'bg-red-100 text-red-700',
      'מוצרי חלב': 'bg-blue-100 text-blue-700',
      'כלי הגשה': 'bg-purple-100 text-purple-700',
      'קונדיטוריה ואפייה': 'bg-pink-100 text-pink-700',
      'קפואים': 'bg-cyan-100 text-cyan-700',
      'אחר': 'bg-gray-100 text-gray-700',
    };
    return colors[categoryName || ''] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            <Plus className="w-4 h-4 ml-2" />
            קליטת סחורה
          </Button>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <h1 className="text-2xl font-bold text-foreground">מחסן ראשי (חומרי גלם)</h1>
              <Package className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground">{filteredItems.length} מוצרים</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="חיפוש מוצר..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs text-right"
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              הכל
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
          <div className="text-center">סטטוס</div>
          <div className="text-center">כמות</div>
          <div className="text-center">קטגוריה</div>
          <div className="text-right">שם מוצר</div>
        </div>

        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {filteredItems.map((item, index) => (
            <div 
              key={item.id}
              className="grid grid-cols-4 gap-4 p-4 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center justify-center">
                <div className={cn("flex items-center gap-1", getStatusColor(item.status))}>
                  {item.status === 'ok' ? (
                    <>
                      <span className="text-sm">תקין</span>
                      <CheckCircle className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm">נמוך</span>
                      <AlertTriangle className="w-4 h-4" />
                    </>
                  )}
                </div>
              </div>

              <div className="text-center">
                <span className="font-bold text-foreground">{item.quantity}</span>
                <span className="text-muted-foreground mr-1">{item.unit}</span>
              </div>

              <div className="flex justify-center">
                <span className={cn("px-3 py-1 rounded-lg text-sm", getCategoryColor(item.category?.name))}>
                  {item.category?.name || '-'}
                </span>
              </div>

              <div className="text-right font-semibold text-foreground">
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { Package, Plus, CheckCircle, AlertTriangle, AlertCircle, Loader2, Pencil, ChevronLeft, ChevronRight, Printer, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { useWarehouse, WarehouseItem } from '@/hooks/useWarehouse';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { WarehouseItemDialog } from '@/components/warehouse/WarehouseItemDialog';
import { StockUpdateDialog } from '@/components/warehouse/StockUpdateDialog';
import { PurchaseListDialog } from '@/components/warehouse/PurchaseListDialog';

export const WarehousePage = () => {
  const { items, categories, suppliers, loading, refetch, page, setPage, totalPages, totalCount, search, setSearch, categoryFilter, setCategoryFilter } = useWarehouse();
  const { canWrite } = useAuth();
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [stockItem, setStockItem] = useState<WarehouseItem | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch, setPage]);

  const handleCategoryChange = (catId: string | null) => {
    setCategoryFilter(catId);
    setPage(0);
  };

  const lowStockCount = items.filter(i => i.status === 'low').length;
  const criticalStockCount = items.filter(i => i.status === 'critical').length;

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ok': return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'תקין' };
      case 'low': return { color: 'text-orange-600 bg-orange-50', icon: AlertTriangle, label: 'מלאי נמוך' };
      case 'critical': return { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'קריטי' };
      default: return { color: 'text-muted-foreground bg-muted', icon: CheckCircle, label: status };
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
      <div className="flex flex-col gap-4">
        <PageHeader
          icon={Package}
          title="מחסן ראשי (חומרי גלם)"
          description={`${totalCount} מוצרים`}
          accentColor="violet"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                הדפס
              </Button>
              {canWrite && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPurchaseDialog(true)}>
                  <ShoppingCart className="w-4 h-4" />
                  רשימת קניות
                </Button>
              )}
              {canWrite && (
                <Button onClick={() => { setEditingItem(null); setShowItemDialog(true); }} className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" />
                  קליטת סחורה
                </Button>
              )}
            </div>
          }
        />

        {(lowStockCount > 0 || criticalStockCount > 0) && (
          <div className="flex gap-4 flex-wrap">
            {criticalStockCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-medium">{criticalStockCount} מוצרים במלאי קריטי</span>
              </div>
            )}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-700 font-medium">{lowStockCount} מוצרים במלאי נמוך</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          <Input placeholder="חיפוש מוצר..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="max-w-xs text-right" />
          <div className="flex gap-2 flex-wrap">
            <Button variant={categoryFilter === null ? "default" : "outline"} size="sm" onClick={() => handleCategoryChange(null)}>הכל</Button>
            {categories.map(cat => (
              <Button key={cat.id} variant={categoryFilter === cat.id ? "default" : "outline"} size="sm" onClick={() => handleCategoryChange(cat.id)}>
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div data-demo-tour="warehouse-stock" className="bg-card rounded-2xl shadow-soft overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
          <div className="text-center">פעולות</div>
          <div className="text-center">סטטוס</div>
          <div className="text-center">כמות</div>
          <div className="text-center">קטגוריה</div>
          <div className="text-right">שם מוצר</div>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">לא נמצאו מוצרים</div>
          ) : (
            items.map((item) => {
              const statusDisplay = getStatusDisplay(item.status);
              const StatusIcon = statusDisplay.icon;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid grid-cols-5 gap-4 p-4 hover:bg-accent/30 transition-colors",
                    item.status === 'critical' && 'bg-red-50/50',
                    item.status === 'low' && 'bg-orange-50/50'
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {canWrite && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setStockItem(item); setShowStockDialog(true); }} className="h-8 px-2">עדכון מלאי</Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setShowItemDialog(true); }} className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full", statusDisplay.color)}>
                      <span className="text-xs font-medium">{statusDisplay.label}</span>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-center flex items-center justify-center">
                    <span className={cn("font-bold", item.status === 'critical' && 'text-red-600', item.status === 'low' && 'text-orange-600', item.status === 'ok' && 'text-foreground')}>
                      {item.quantity}
                    </span>
                    <span className="text-muted-foreground mr-1 text-sm">{item.unit}</span>
                  </div>
                  <div className="flex justify-center items-center">
                    <span className={cn("px-3 py-1 rounded-lg text-sm", getCategoryColor(item.category?.name))}>
                      {item.category?.name || '-'}
                    </span>
                  </div>
                  <div className="text-right font-semibold text-foreground flex items-center justify-end">
                    {item.name}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="gap-1">
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>
            <span className="text-sm text-muted-foreground">עמוד {page + 1} מתוך {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="gap-1">
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <WarehouseItemDialog open={showItemDialog} onOpenChange={setShowItemDialog} categories={categories} suppliers={suppliers} item={editingItem} onSuccess={refetch} />
      <StockUpdateDialog open={showStockDialog} onOpenChange={setShowStockDialog} item={stockItem} onSuccess={refetch} />
      <PurchaseListDialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog} />
    </div>
  );
};

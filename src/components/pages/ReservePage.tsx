import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Search,
  Snowflake,
  Thermometer,
  Box,
  AlertTriangle,
  Loader2,
  Factory,
} from 'lucide-react';
import { useReserve, ReserveItem, ReserveItemFormData } from '@/hooks/useReserve';
import { useAuthContext } from '@/context/AuthContext';
import { ReserveItemCard } from '@/components/reserve/ReserveItemCard';
import { ReserveItemDialog } from '@/components/reserve/ReserveItemDialog';
import { QuantityDialog } from '@/components/reserve/QuantityDialog';
import { DeleteReserveItemDialog } from '@/components/reserve/DeleteReserveItemDialog';
import { ProductionScheduleTab } from '@/components/reserve/ProductionScheduleTab';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';

export const ReservePage = () => {
  const { canWrite } = useAuthContext();
  const {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    produce,
    consume,
    getLowStockItems,
    getExpiringItems,
  } = useReserve();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [mainTab, setMainTab] = useState<string>('stock');

  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReserveItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ReserveItem | null>(null);
  const [quantityItem, setQuantityItem] = useState<ReserveItem | null>(null);
  const [quantityMode, setQuantityMode] = useState<'produce' | 'consume'>('produce');

  const lowStockItems = getLowStockItems();
  const expiringItems = getExpiringItems(7);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.storage_type === activeTab;
    return matchesSearch && matchesTab;
  });

  // Stats by storage type
  const frozenCount = items.filter(i => i.storage_type === 'frozen').length;
  const refrigeratedCount = items.filter(i => i.storage_type === 'refrigerated').length;
  const ambientCount = items.filter(i => i.storage_type === 'ambient').length;

  const handleSaveItem = async (data: ReserveItemFormData) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
    setEditingItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleQuantityConfirm = async (quantity: number, notes?: string) => {
    if (!quantityItem) return;
    
    if (quantityMode === 'produce') {
      await produce(quantityItem.id, quantity, notes);
    } else {
      await consume(quantityItem.id, quantity, notes);
    }
    setQuantityItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <PageHeader
        title="רזרבה (מלאי הייצור)"
        description="ניהול מוצרים מוכנים למלאי"
        icon={Package}
        accentColor="violet"
        actions={
          canWrite ? (
            <Button className="gap-2" onClick={() => setItemDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              פריט חדש
            </Button>
          ) : undefined
        }
      />

      {/* Main tabs: Stock vs Production Schedule */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="stock" className="gap-2">
            <Package className="w-4 h-4" />
            מלאי
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <Factory className="w-4 h-4" />
            תכנית ייצור
          </TabsTrigger>
        </TabsList>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4 mt-4">
          {/* Alerts */}
          {(lowStockItems.length > 0 || expiringItems.length > 0) && (
            <div className="flex flex-wrap gap-3">
              {lowStockItems.length > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 py-1 px-3">
                  <AlertTriangle className="w-4 h-4" />
                  {lowStockItems.length} פריטים במלאי נמוך
                </Badge>
              )}
              {expiringItems.length > 0 && (
                <Badge variant="outline" className="text-destructive border-destructive/30 gap-1 py-1 px-3">
                  <AlertTriangle className="w-4 h-4" />
                  {expiringItems.length} פריטים עם תוקף קרוב
                </Badge>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש פריט..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Storage type tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm">
                <Package className="w-3.5 h-3.5" />
                הכל ({items.length})
              </TabsTrigger>
              <TabsTrigger value="frozen" className="gap-1 text-xs sm:text-sm">
                <Snowflake className="w-3.5 h-3.5" />
                הקפאה ({frozenCount})
              </TabsTrigger>
              <TabsTrigger value="refrigerated" className="gap-1 text-xs sm:text-sm">
                <Thermometer className="w-3.5 h-3.5" />
                קירור ({refrigeratedCount})
              </TabsTrigger>
              <TabsTrigger value="ambient" className="gap-1 text-xs sm:text-sm">
                <Box className="w-3.5 h-3.5" />
                אחסון ({ambientCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <ReserveItemCard
                      key={item.id}
                      item={item}
                      onEdit={(i) => {
                        setEditingItem(i);
                        setItemDialogOpen(true);
                      }}
                      onDelete={setDeletingItem}
                      onProduce={(i) => {
                        setQuantityItem(i);
                        setQuantityMode('produce');
                      }}
                      onConsume={(i) => {
                        setQuantityItem(i);
                        setQuantityMode('consume');
                      }}
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="אין פריטים ברזרבה"
                  description="התחל להוסיף פריטים מוכנים למלאי הייצור"
                  action={canWrite ? (
                    <Button onClick={() => setItemDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      צור פריט ראשון
                    </Button>
                  ) : undefined}
                />
              ) : (
                <EmptyState
                  icon={Search}
                  title="לא נמצאו תוצאות"
                  description="נסה לחפש מונח אחר"
                />
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Production Schedule Tab */}
        <TabsContent value="production" className="mt-4">
          <ProductionScheduleTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ReserveItemDialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          setItemDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleSaveItem}
      />

      <QuantityDialog
        open={!!quantityItem}
        onOpenChange={(open) => !open && setQuantityItem(null)}
        item={quantityItem}
        mode={quantityMode}
        onConfirm={handleQuantityConfirm}
      />

      <DeleteReserveItemDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        item={deletingItem}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
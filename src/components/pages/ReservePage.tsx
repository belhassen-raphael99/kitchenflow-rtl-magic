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
} from 'lucide-react';
import { useReserve, ReserveItem, ReserveItemFormData } from '@/hooks/useReserve';
import { useAuth } from '@/hooks/useAuth';
import { ReserveItemCard } from '@/components/reserve/ReserveItemCard';
import { ReserveItemDialog } from '@/components/reserve/ReserveItemDialog';
import { QuantityDialog } from '@/components/reserve/QuantityDialog';
import { DeleteReserveItemDialog } from '@/components/reserve/DeleteReserveItemDialog';

export const ReservePage = () => {
  const { canWrite } = useAuth();
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            רזרבה (מלאי הייצור)
          </h1>
          <p className="text-muted-foreground">ניהול מוצרים מוכנים למלאי</p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setItemDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            פריט חדש
          </Button>
        )}
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {lowStockItems.length > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1 py-1 px-3">
              <AlertTriangle className="w-4 h-4" />
              {lowStockItems.length} פריטים במלאי נמוך
            </Badge>
          )}
          {expiringItems.length > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300 gap-1 py-1 px-3">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            <Package className="w-4 h-4" />
            הכל ({items.length})
          </TabsTrigger>
          <TabsTrigger value="frozen" className="gap-2">
            <Snowflake className="w-4 h-4" />
            הקפאה ({frozenCount})
          </TabsTrigger>
          <TabsTrigger value="refrigerated" className="gap-2">
            <Thermometer className="w-4 h-4" />
            קירור ({refrigeratedCount})
          </TabsTrigger>
          <TabsTrigger value="ambient" className="gap-2">
            <Box className="w-4 h-4" />
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
            /* Empty State */
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    אין פריטים ברזרבה
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    התחל להוסיף פריטים מוכנים למלאי הייצור
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setItemDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      צור פריט ראשון
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* No Results */
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    לא נמצאו תוצאות
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    נסה לחפש מונח אחר
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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

import { useApp } from '@/context/AppContext';
import { Layers, Plus, Leaf, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const ReservePage = () => {
  const { reserve, setReserve, warehouse, setWarehouse } = useApp();
  const { toast } = useToast();

  const handleProduce = (itemId: string, amount: number) => {
    // Find the reserve item and update quantity
    const item = reserve.find(r => r.id === itemId);
    if (!item) return;

    // Deduct from warehouse (simplified)
    setWarehouse(prev => prev.map(w => {
      const usedIngredient = item.ingredients.find(i => i.itemId === w.id);
      if (usedIngredient) {
        return { ...w, quantity: Math.max(0, w.quantity - usedIngredient.amount * amount) };
      }
      return w;
    }));

    // Add to reserve
    setReserve(prev => prev.map(r => 
      r.id === itemId ? { ...r, quantity: r.quantity + amount } : r
    ));

    toast({
      title: "ייצור הושלם! ✅",
      description: `נוספו ${amount} ${item.unit} ל${item.name}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl">
          <Plus className="w-4 h-4 ml-2" />
          דיווח ייצור למלאי
        </Button>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <h1 className="text-2xl font-bold text-foreground">רזרבה (מלאי ייצור)</h1>
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">ניהול הכנות, בצקים, רטבים ומוצרים חצי-מוכנים</p>
        </div>
      </div>

      {/* Reserve Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reserve.map((item, index) => (
          <div 
            key={item.id}
            className="bg-card rounded-2xl shadow-soft p-5 animate-fade-in-up hover:shadow-card transition-shadow"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                item.type === 'frozen' 
                  ? 'bg-frozen/10 text-frozen' 
                  : 'bg-fresh/10 text-fresh'
              }`}>
                {item.type === 'frozen' ? 'קפוא' : 'טרי'}
              </span>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                {item.type === 'frozen' ? (
                  <div className="w-10 h-10 rounded-xl bg-frozen/10 flex items-center justify-center">
                    <Snowflake className="w-5 h-5 text-frozen" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-fresh/10 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-fresh" />
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-foreground">{item.quantity}</span>
              <span className="text-lg text-muted-foreground mr-2">{item.unit}</span>
            </div>

            <Button
              onClick={() => handleProduce(item.id, 5)}
              className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף 5 {item.unit} (ייצור)
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

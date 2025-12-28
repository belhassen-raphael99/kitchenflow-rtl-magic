import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  stockProductions, 
  assemblyOrders, 
  StockProduction, 
  AssemblyOrder,
  Department 
} from '@/data/kitchenOpsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Croissant, 
  Calendar,
  Snowflake,
  Refrigerator,
  CheckCircle2,
  Clock,
  Users,
  Soup,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipeModal } from '@/components/kitchen/RecipeModal';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

export const KitchenOpsPage = () => {
  const { warehouse, setWarehouse, reserve, setReserve } = useApp();
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('kitchen');
  const [selectedDate] = useState<Date>(new Date());
  const [productions, setProductions] = useState(stockProductions);
  const [orders, setOrders] = useState(assemblyOrders);
  const [selectedRecipe, setSelectedRecipe] = useState<StockProduction | null>(null);

  const departmentColors = {
    bakery: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      hover: 'hover:bg-amber-500/20',
    },
    kitchen: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      hover: 'hover:bg-emerald-500/20',
    },
  };

  const currentColors = departmentColors[selectedDepartment];

  const filteredProductions = productions.filter(p => p.department === selectedDepartment);
  const filteredOrders = orders.filter(o => o.department === selectedDepartment);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: selectedDepartment === 'bakery' 
        ? ['#f59e0b', '#d97706', '#b45309']
        : ['#10b981', '#059669', '#047857'],
    });
  };

  const handleProduce = (productionId: string, amount: number) => {
    setProductions(prev => prev.map(p => {
      if (p.id === productionId) {
        const newStatus = p.status === 'pending' ? 'in-progress' : p.status;
        return { ...p, status: newStatus, targetQuantity: p.targetQuantity + amount };
      }
      return p;
    }));

    triggerConfetti();
    toast({
      title: '✅ ייצור הושלם',
      description: `נוספו ${amount} יחידות למלאי`,
    });
  };

  const handleCompleteProduction = (productionId: string) => {
    setProductions(prev => prev.map(p => {
      if (p.id === productionId) {
        return { ...p, status: 'completed' };
      }
      return p;
    }));

    triggerConfetti();
    toast({
      title: '🎉 משימה הושלמה!',
      description: 'המלאי עודכן בהצלחה',
    });
  };

  const handleOrderReady = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'completed' };
      }
      return o;
    }));

    triggerConfetti();
    toast({
      title: '🎉 הזמנה מוכנה!',
      description: 'ההזמנה סומנה כמוכנה למשלוח',
    });
  };

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'frozen': return <Snowflake className="w-4 h-4" />;
      case 'refrigerated': return <Refrigerator className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStorageLabel = (type: string) => {
    switch (type) {
      case 'frozen': return 'הקפאה';
      case 'refrigerated': return 'קירור';
      default: return 'אחסון';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">הושלם ✓</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">בתהליך</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">ממתין</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 backdrop-blur-lg border-b p-4",
        currentColors.bgLight,
        currentColors.border
      )}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="lg" className="h-14 px-6 text-lg font-medium">
              <Calendar className="w-5 h-5 ml-2" />
              היום - {selectedDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Button>
          </div>

          {/* Department Tabs */}
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedDepartment('bakery')}
              size="lg"
              className={cn(
                "h-16 px-8 text-lg font-bold transition-all",
                selectedDepartment === 'bakery'
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30"
                  : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-2 border-amber-500/30"
              )}
            >
              <Croissant className="w-6 h-6 ml-2" />
              מאפייה
            </Button>
            <Button
              onClick={() => setSelectedDepartment('kitchen')}
              size="lg"
              className={cn(
                "h-16 px-8 text-lg font-bold transition-all",
                selectedDepartment === 'kitchen'
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                  : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-2 border-emerald-500/30"
              )}
            >
              <ChefHat className="w-6 h-6 ml-2" />
              מטבח
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <main className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* RIGHT COLUMN: Stock Production */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", currentColors.bg)}>
                <Soup className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">הכנות למלאי</h2>
                <p className="text-sm text-muted-foreground">Production de Stock / Bases</p>
              </div>
            </div>

            <div className="space-y-4">
              {filteredProductions.map((production) => (
                <Card 
                  key={production.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg border-2",
                    production.status === 'completed' 
                      ? "opacity-60 border-emerald-500/30 bg-emerald-500/5" 
                      : currentColors.border,
                    production.status === 'in-progress' && "ring-2 ring-blue-500/50"
                  )}
                  onClick={() => setSelectedRecipe(production)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{production.nameHe}</CardTitle>
                        <p className="text-sm text-muted-foreground">{production.name}</p>
                      </div>
                      {getStatusBadge(production.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{production.targetQuantity}</p>
                          <p className="text-xs text-muted-foreground">{production.unit}</p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getStorageIcon(production.storageType)}
                          {getStorageLabel(production.storageType)}
                        </Badge>
                      </div>
                      
                      {production.status !== 'completed' && (
                        <div className="flex gap-2">
                          <Button
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProduce(production.id, 5);
                            }}
                            className={cn(
                              "h-14 px-6 text-base font-bold",
                              selectedDepartment === 'bakery'
                                ? "bg-amber-500 hover:bg-amber-600"
                                : "bg-emerald-500 hover:bg-emerald-600"
                            )}
                          >
                            +5 {production.unit}
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteProduction(production.id);
                            }}
                            className="h-14 px-4"
                          >
                            <CheckCircle2 className="w-6 h-6" />
                          </Button>
                        </div>
                      )}

                      {production.status === 'completed' && (
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredProductions.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">אין משימות ייצור להיום</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* LEFT COLUMN: Assembly Orders */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", currentColors.bg)}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">הזמנות להרכבה</h2>
                <p className="text-sm text-muted-foreground">Assemblage / Commandes</p>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card 
                  key={order.id}
                  className={cn(
                    "transition-all hover:shadow-lg border-2",
                    order.status === 'completed' 
                      ? "opacity-60 border-emerald-500/30 bg-emerald-500/5" 
                      : currentColors.border,
                    order.status === 'in-progress' && "ring-2 ring-blue-500/50"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                          currentColors.bgLight,
                          currentColors.text
                        )}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className={currentColors.text}>{order.time}</span>
                            <span>-</span>
                            <span>{order.clientName}</span>
                          </CardTitle>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="font-medium">{item.nameHe}</span>
                          <Badge variant="secondary" className="text-base px-3">
                            x{item.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {order.status !== 'completed' && (
                      <Button
                        size="lg"
                        onClick={() => handleOrderReady(order.id)}
                        className={cn(
                          "w-full h-14 text-lg font-bold",
                          selectedDepartment === 'bakery'
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        )}
                      >
                        <CheckCircle2 className="w-6 h-6 ml-2" />
                        הזמנה מוכנה
                      </Button>
                    )}

                    {order.status === 'completed' && (
                      <div className="flex items-center justify-center py-2 text-emerald-500">
                        <CheckCircle2 className="w-8 h-8 ml-2" />
                        <span className="text-lg font-bold">הזמנה הושלמה</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredOrders.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">אין הזמנות להיום</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        departmentColor={currentColors}
      />
    </div>
  );
};

import { useApp } from '@/context/AppContext';
import { Package, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const WarehousePage = () => {
  const { warehouse } = useApp();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-primary';
      case 'low': return 'text-secondary';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'יבשים': 'bg-amber-100 text-amber-700',
      'מקרר': 'bg-blue-100 text-blue-700',
      'דגים': 'bg-cyan-100 text-cyan-700',
      'ירקות': 'bg-green-100 text-green-700',
      'גבינות': 'bg-yellow-100 text-yellow-700',
      'לחמים': 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
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
          <p className="text-muted-foreground">ניהול סחורה מספקים: קמח, ירקות, אריזות...</p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
          <div className="text-center">סטטוס</div>
          <div className="text-center">כמות במלאי</div>
          <div className="text-center">ספק</div>
          <div className="text-center">קטגוריה</div>
          <div className="text-right">שם מוצר</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {warehouse.map((item, index) => (
            <div 
              key={item.id}
              className="grid grid-cols-5 gap-4 p-4 hover:bg-accent/30 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Status */}
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

              {/* Quantity */}
              <div className="text-center">
                <span className="font-bold text-foreground">{item.quantity}</span>
                <span className="text-muted-foreground mr-1">{item.unit}</span>
              </div>

              {/* Supplier */}
              <div className="text-center text-foreground">
                {item.supplier}
              </div>

              {/* Category */}
              <div className="flex justify-center">
                <span className={cn("px-3 py-1 rounded-lg text-sm", getCategoryColor(item.category))}>
                  {item.category}
                </span>
              </div>

              {/* Name */}
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

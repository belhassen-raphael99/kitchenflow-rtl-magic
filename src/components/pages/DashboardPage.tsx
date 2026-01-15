import { useApp } from '@/context/AppContext';
import { useWarehouse } from '@/hooks/useWarehouse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Package, 
  AlertTriangle, 
  Users,
  ChefHat,
  Clock,
  TrendingUp,
  Warehouse,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { clientInfo } = useApp();
  const { items: warehouseItems, loading: warehouseLoading } = useWarehouse();

  // Real KPIs from warehouse data
  const lowStockItems = warehouseItems.filter(item => item.status === 'low').length;
  const criticalStockItems = warehouseItems.filter(item => item.status === 'critical').length;
  const totalItems = warehouseItems.length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Banner */}
      <div className="bg-gradient-to-l from-primary/90 to-primary rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              שלום! 👋
            </h1>
            <p className="text-white/80 text-lg">
              ברוכים הבאים ל{clientInfo.name} - {clientInfo.tagline}
            </p>
          </div>
          <div className="text-6xl">{clientInfo.logo}</div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/warehouse">
              <Warehouse className="w-4 h-4" />
              מחסן
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/kitchen-ops">
              <ChefHat className="w-4 h-4" />
              פוסט מטבח
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/agenda">
              <Calendar className="w-4 h-4" />
              יומן אירועים
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Warehouse Status - Real Data */}
        <Card className="border-r-4 border-r-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              פריטים במחסן
            </CardTitle>
            <Package className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            {warehouseLoading ? (
              <div className="animate-pulse h-8 bg-muted rounded" />
            ) : (
              <>
                <p className="text-3xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">סה״כ פריטים</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts - Real Data */}
        <Card className={`border-r-4 ${criticalStockItems > 0 ? 'border-r-destructive' : lowStockItems > 0 ? 'border-r-amber-500' : 'border-r-green-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              התראות מלאי
            </CardTitle>
            <AlertTriangle className={`w-5 h-5 ${criticalStockItems > 0 ? 'text-destructive' : lowStockItems > 0 ? 'text-amber-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            {warehouseLoading ? (
              <div className="animate-pulse h-8 bg-muted rounded" />
            ) : (
              <>
                <p className="text-3xl font-bold">{criticalStockItems + lowStockItems}</p>
                <div className="flex gap-2 mt-1">
                  {criticalStockItems > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalStockItems} קריטי
                    </Badge>
                  )}
                  {lowStockItems > 0 && (
                    <Badge className="bg-amber-500 text-xs">
                      {lowStockItems} נמוך
                    </Badge>
                  )}
                  {criticalStockItems === 0 && lowStockItems === 0 && (
                    <Badge className="bg-green-500 text-xs">מלאי תקין</Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Events - No Data Yet */}
        <Card className="border-r-4 border-r-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              אירועים השבוע
            </CardTitle>
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">—</p>
            <p className="text-xs text-muted-foreground">לא מחובר לנתונים</p>
          </CardContent>
        </Card>

        {/* Guests - No Data Yet */}
        <Card className="border-r-4 border-r-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              אורחים השבוע
            </CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">—</p>
            <p className="text-xs text-muted-foreground">לא מחובר לנתונים</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events - Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                אירועים קרובים
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/agenda">הכל →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">אין אירועים</p>
              <p className="text-sm text-muted-foreground">
                יש ליצור את טבלת האירועים בבסיס הנתונים
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/agenda">צפה ביומן</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              סטטוס מערכת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warehouse Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">מחסן</p>
                  <p className="text-sm text-muted-foreground">מחובר לנתונים</p>
                </div>
              </div>
              <Badge className="bg-green-500">פעיל</Badge>
            </div>

            {/* Recipes Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">ספר מתכונים</p>
                  <p className="text-sm text-muted-foreground">דרוש חיבור לנתונים</p>
                </div>
              </div>
              <Badge variant="secondary">לא פעיל</Badge>
            </div>

            {/* Events Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">יומן אירועים</p>
                  <p className="text-sm text-muted-foreground">דרוש חיבור לנתונים</p>
                </div>
              </div>
              <Badge variant="secondary">לא פעיל</Badge>
            </div>

            {/* Kitchen Ops Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">פוסט מטבח</p>
                  <p className="text-sm text-muted-foreground">דרוש חיבור לנתונים</p>
                </div>
              </div>
              <Badge variant="secondary">לא פעיל</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

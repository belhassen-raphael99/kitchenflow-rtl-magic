import { useApp } from '@/context/AppContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
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
  const { totalRecipes, eventsThisWeek, guestsThisWeek, activeTasks, loading: statsLoading } = useDashboardStats();

  const lowStockItems = warehouseItems.filter(item => item.status === 'low').length;
  const criticalStockItems = warehouseItems.filter(item => item.status === 'critical').length;
  const totalItems = warehouseItems.length;

  const SkeletonValue = () => <div className="animate-pulse h-6 sm:h-8 bg-muted rounded" />;

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Hero Banner */}
      <div className="bg-gradient-to-l from-primary/90 to-primary rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
              שלום! 👋
            </h1>
            <p className="text-white/80 text-sm sm:text-lg leading-snug">
              ברוכים הבאים ל{clientInfo.name} - {clientInfo.tagline}
            </p>
          </div>
          <div className="text-4xl sm:text-6xl shrink-0">{clientInfo.logo}</div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button asChild variant="secondary" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Link to="/warehouse">
              <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              מחסן
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Link to="/kitchen-ops">
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              פוסט מטבח
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Link to="/agenda">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              יומן אירועים
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Warehouse Status */}
        <Card className="border-r-4 border-r-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">פריטים במחסן</CardTitle>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {warehouseLoading ? <SkeletonValue /> : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{totalItems}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">סה״כ פריטים</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card className={`border-r-4 ${criticalStockItems > 0 ? 'border-r-destructive' : lowStockItems > 0 ? 'border-r-amber-500' : 'border-r-green-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">התראות מלאי</CardTitle>
            <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${criticalStockItems > 0 ? 'text-destructive' : lowStockItems > 0 ? 'text-amber-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {warehouseLoading ? <SkeletonValue /> : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{criticalStockItems + lowStockItems}</p>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                  {criticalStockItems > 0 && <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2">{criticalStockItems} קריטי</Badge>}
                  {lowStockItems > 0 && <Badge className="bg-amber-500 text-[10px] sm:text-xs px-1.5 sm:px-2">{lowStockItems} נמוך</Badge>}
                  {criticalStockItems === 0 && lowStockItems === 0 && <Badge className="bg-green-500 text-[10px] sm:text-xs px-1.5 sm:px-2">מלאי תקין</Badge>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Events This Week */}
        <Card className="border-r-4 border-r-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">אירועים השבוע</CardTitle>
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {statsLoading ? <SkeletonValue /> : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{eventsThisWeek}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">ב-7 הימים הקרובים</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Guests This Week */}
        <Card className="border-r-4 border-r-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">אורחים השבוע</CardTitle>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {statsLoading ? <SkeletonValue /> : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{guestsThisWeek}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">סה״כ אורחים</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                אירועים קרובים
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                <Link to="/agenda">הכל →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="animate-pulse h-12 bg-muted rounded" />)}
              </div>
            ) : eventsThisWeek === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <CalendarDays className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/30 mb-3 sm:mb-4" />
                <p className="text-muted-foreground font-medium text-sm sm:text-base">אין אירועים השבוע</p>
                <Button asChild variant="outline" size="sm" className="mt-3 sm:mt-4 text-xs sm:text-sm">
                  <Link to="/agenda">צפה ביומן</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-3xl font-bold text-primary">{eventsThisWeek}</p>
                <p className="text-muted-foreground text-sm">אירועים מתוכננים השבוע</p>
                <p className="text-lg font-semibold mt-2">{guestsThisWeek} אורחים</p>
                <Button asChild variant="outline" size="sm" className="mt-3 text-xs sm:text-sm">
                  <Link to="/agenda">צפה ביומן</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              סטטוס מערכת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Warehouse className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">מחסן</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{totalItems} פריטים</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-[10px] sm:text-xs">פעיל</Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">ספר מתכונים</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{totalRecipes} מתכונים</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-[10px] sm:text-xs">פעיל</Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">יומן אירועים</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{eventsThisWeek} אירועים השבוע</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-[10px] sm:text-xs">פעיל</Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">פוסט מטבח</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{activeTasks} משימות פעילות</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-[10px] sm:text-xs">פעיל</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

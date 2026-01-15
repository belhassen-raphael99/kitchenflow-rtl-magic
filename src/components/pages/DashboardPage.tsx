import { useApp } from '@/context/AppContext';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Calendar,
  CheckCircle,
  PlayCircle,
  ListTodo,
  Loader2,
  Snowflake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export const DashboardPage = () => {
  const { clientInfo } = useApp();
  const { items: warehouseItems, loading: warehouseLoading } = useWarehouse();
  const { stats, loading: statsLoading } = useDashboardStats();

  // Real KPIs from warehouse data
  const lowStockItems = warehouseItems.filter(item => item.status === 'low').length;
  const criticalStockItems = warehouseItems.filter(item => item.status === 'critical').length;
  const totalItems = warehouseItems.length;

  const isLoading = warehouseLoading || statsLoading;

  // Task progress
  const taskProgress = stats.tasksToday > 0 
    ? Math.round((stats.tasksCompleted / stats.tasksToday) * 100) 
    : 0;

  const formatEventDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    if (dateStr === todayStr) return 'היום';
    return format(date, 'EEE dd/MM', { locale: he });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'in-progress': return 'בתהליך';
      case 'completed': return 'הושלם';
      case 'cancelled': return 'בוטל';
      default: return status;
    }
  };

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
        
        {/* Quick Actions */}
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
        {/* Events This Week */}
        <Card className="border-r-4 border-r-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              אירועים השבוע
            </CardTitle>
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {isLoading ? (
              <div className="animate-pulse h-6 sm:h-8 bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{stats.eventsThisWeek}</p>
                {stats.eventsToday > 0 && (
                  <Badge className="bg-primary/10 text-primary text-[10px] sm:text-xs mt-1">
                    {stats.eventsToday} היום
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Guests This Week */}
        <Card className="border-r-4 border-r-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              אורחים השבוע
            </CardTitle>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {isLoading ? (
              <div className="animate-pulse h-6 sm:h-8 bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{stats.guestsThisWeek}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">סה״כ אורחים</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Warehouse Status */}
        <Card className={`border-r-4 ${criticalStockItems > 0 ? 'border-r-destructive' : lowStockItems > 0 ? 'border-r-amber-500' : 'border-r-green-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              התראות מחסן
            </CardTitle>
            <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${criticalStockItems > 0 ? 'text-destructive' : lowStockItems > 0 ? 'text-amber-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {warehouseLoading ? (
              <div className="animate-pulse h-6 sm:h-8 bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{criticalStockItems + lowStockItems}</p>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                  {criticalStockItems > 0 && (
                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                      {criticalStockItems} קריטי
                    </Badge>
                  )}
                  {lowStockItems > 0 && (
                    <Badge className="bg-amber-500 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      {lowStockItems} נמוך
                    </Badge>
                  )}
                  {criticalStockItems === 0 && lowStockItems === 0 && (
                    <Badge className="bg-green-500 text-[10px] sm:text-xs px-1.5 sm:px-2">מלאי תקין</Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks Today */}
        <Card className="border-r-4 border-r-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              משימות היום
            </CardTitle>
            <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {isLoading ? (
              <div className="animate-pulse h-6 sm:h-8 bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-bold">{stats.tasksToday}</p>
                {stats.tasksToday > 0 && (
                  <div className="mt-1.5">
                    <Progress value={taskProgress} className="h-1.5" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {stats.tasksCompleted}/{stats.tasksToday} הושלמו
                    </p>
                  </div>
                )}
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats.upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CalendarDays className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium text-sm sm:text-base">אין אירועים קרובים</p>
                <Button asChild variant="outline" size="sm" className="mt-3 sm:mt-4 text-xs sm:text-sm">
                  <Link to="/agenda">צפה ביומן</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {formatEventDate(event.date)}
                        </span>
                        <span className="text-[10px] text-primary/70">{event.time.slice(0, 5)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{event.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {event.client_name && <span>{event.client_name}</span>}
                          <span>•</span>
                          <span>{event.guests} אורחים</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(event.status)} text-[10px] sm:text-xs`}>
                      {getStatusLabel(event.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status & Quick Stats */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              סטטוס מערכת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-4 p-4 sm:p-6 pt-0">
            {/* Warehouse Status */}
            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">מחסן חומרי גלם</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{totalItems} פריטים</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-[10px] sm:text-xs">פעיל</Badge>
            </div>

            {/* Reserve Status */}
            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${stats.lowStockReserve > 0 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  <Snowflake className={`w-4 h-4 sm:w-5 sm:h-5 ${stats.lowStockReserve > 0 ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">רזרבה</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stats.lowStockReserve > 0 ? `${stats.lowStockReserve} במלאי נמוך` : 'מלאי תקין'}
                  </p>
                </div>
              </div>
              {stats.expiringItems > 0 && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs">
                  {stats.expiringItems} פג תוקף
                </Badge>
              )}
            </div>

            {/* Recipes Status */}
            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">ספר מתכונים</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stats.totalRecipes} מתכונים</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-[10px] sm:text-xs">פעיל</Badge>
            </div>

            {/* Kitchen Tasks Status */}
            <div className="flex items-center justify-between p-2.5 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">פוסט מטבח</p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    {stats.tasksInProgress > 0 && (
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3 h-3 text-blue-500" />
                        {stats.tasksInProgress} בביצוע
                      </span>
                    )}
                    {stats.tasksPending > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {stats.tasksPending} ממתין
                      </span>
                    )}
                    {stats.tasksToday === 0 && 'אין משימות היום'}
                  </div>
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

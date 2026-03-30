import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  CalendarDays, Package, AlertTriangle, Users,
  ChefHat, TrendingUp, Warehouse, Truck,
  Calendar, Receipt, Timer, Printer, Bell,
  Snowflake, ClipboardList, Eye, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '@/components/layout/CardSkeleton';
import { EmptyState } from '@/components/layout/EmptyState';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const statusColors: Record<string, string> = {
  pending: 'bg-destructive text-destructive-foreground',
  confirmed: 'bg-green-600 text-white',
  in_progress: 'bg-amber-500 text-white',
  ready: 'bg-blue-600 text-white',
  delivered: 'bg-muted text-muted-foreground',
  cancelled: 'bg-foreground/20 text-foreground',
};

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  confirmed: 'מאושר',
  in_progress: 'בהכנה',
  ready: 'מוכן',
  delivered: 'נמסר',
  cancelled: 'בוטל',
};

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const DashboardPage = () => {
  const { clientInfo } = useApp();
  const stats = useDashboardStats();
  const [showNextWeek, setShowNextWeek] = useState(false);

  const today = new Date();
  const isThursday = today.getDay() === 4;
  const todayFormatted = format(today, 'EEEE, dd MMMM yyyy', { locale: he });

  // Placeholder chart data (would be from real monthly aggregation)
  const monthlyData = [
    { month: 'ינו', revenue: 0, events: 0 },
    { month: 'פבר', revenue: 0, events: 0 },
    { month: 'מרץ', revenue: 0, events: 0 },
    { month: 'אפר', revenue: 0, events: 0 },
    { month: 'מאי', revenue: 0, events: 0 },
    { month: format(today, 'MMM', { locale: he }), revenue: stats.monthlyRevenue, events: stats.eventsThisWeek },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      {/* Section A — Day summary bar */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base">
          <span className="font-semibold text-lg sm:text-xl text-foreground">
            {todayFormatted}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="w-4 h-4" /> <strong className="text-foreground">{stats.eventsThisWeek}</strong> אירועים השבוע
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="w-4 h-4" /> <strong className="text-foreground">{stats.todayDeliveries}</strong> משלוחים היום
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="w-4 h-4" /> <strong className="text-foreground">{stats.alertCount}</strong> התראות
          </span>
        </div>
      </div>

      {/* Section B — 4 KPI cards */}
      {stats.loading ? (
        <CardSkeleton variant="kpi" count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'אירועים השבוע', value: stats.eventsThisWeek, icon: CalendarDays },
            { label: 'אורחים השבוע', value: stats.guestsThisWeek, icon: Users },
            { label: 'הכנסות החודש', value: `₪${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign },
            { label: 'משימות פתוחות', value: stats.activeTasks, icon: ClipboardList },
          ].map((kpi) => (
            <Card key={kpi.label} className="rounded-lg border border-border hover:shadow-card transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 sm:p-5">
                <CardTitle className="text-xs sm:text-sm font-normal text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-5 pt-0">
                <p className="text-2xl sm:text-3xl font-semibold">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Section C + D — Events this week + Today's deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section C — This week's events */}
        <Card className="rounded-lg shadow-soft">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 bg-kpi-events/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-kpi-events" />
                </div>
                אירועים השבוע
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/agenda">הכל ←</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-2 max-h-80 overflow-y-auto">
            {stats.loading ? (
              <div className="animate-pulse h-20 bg-muted rounded-md" />
            ) : stats.weekEvents.length === 0 ? (
              <EmptyState icon={CalendarDays} title="אין אירועים השבוע" className="py-6" />
            ) : (
              stats.weekEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.client_name || event.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{format(new Date(event.date), 'EEEE dd/MM', { locale: he })}</span>
                      <span>{event.guests} אורחים</span>
                    </div>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", statusColors[event.status] || 'bg-muted')}>
                    {statusLabels[event.status] || event.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section D — Today's deliveries */}
        <Card className="rounded-lg shadow-soft">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-blue-500" />
                </div>
                משלוחים היום
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/delivery">הכל ←</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-2 max-h-80 overflow-y-auto">
            {stats.loading ? (
              <div className="animate-pulse h-20 bg-muted rounded-md" />
            ) : stats.todayDeliveryEvents.length === 0 ? (
              <EmptyState icon={Truck} title="אין משלוחים היום" className="py-6" />
            ) : (
              stats.todayDeliveryEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.client_name || event.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {event.delivery_time && <span>🕐 {event.delivery_time}</span>}
                      <span>{event.guests} אורחים</span>
                      {event.delivery_address && <span className="truncate max-w-[120px]">📍 {event.delivery_address}</span>}
                    </div>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", statusColors[event.status] || 'bg-muted')}>
                    {statusLabels[event.status] || event.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section E — Active alerts (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low stock */}
        <Card className="rounded-lg shadow-soft border-t-4 border-t-destructive/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-destructive" />
              מלאי נמוך
              {stats.lowStockList.length > 0 && (
                <Badge variant="destructive" className="text-[10px]">{stats.lowStockList.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2 max-h-48 overflow-y-auto">
            {stats.lowStockList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">מלאי תקין ✅</p>
            ) : (
              stats.lowStockList.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-destructive/5 rounded-lg">
                  <span className="font-medium truncate flex-1">{item.name}</span>
                  <span className="text-destructive font-bold shrink-0 mr-2">
                    {item.quantity}/{item.min_stock} {item.unit}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expiring soon */}
        <Card className="rounded-lg shadow-soft border-t-4 border-t-amber-500/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Snowflake className="w-4 h-4 text-amber-500" />
              פג תוקף קרוב
              {stats.expiringItems.length > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px]">{stats.expiringItems.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2 max-h-48 overflow-y-auto">
            {stats.expiringItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">הכל בתוקף ✅</p>
            ) : (
              stats.expiringItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-amber-500/5 rounded-lg">
                  <span className="font-medium truncate flex-1">{item.name}</span>
                  <Badge className={cn("text-[10px] shrink-0", item.daysUntil === 0 ? 'bg-destructive' : 'bg-amber-500')}>
                    {item.daysUntil === 0 ? 'היום!' : `בעוד ${item.daysUntil} ימים`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Urgent tasks */}
        <Card className="rounded-lg shadow-soft border-t-4 border-t-primary/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ChefHat className="w-4 h-4 text-primary" />
              משימות דחופות
              {stats.urgentTasks.length > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px]">{stats.urgentTasks.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2 max-h-48 overflow-y-auto">
            {stats.urgentTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">אין משימות דחופות ✅</p>
            ) : (
              stats.urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-xs p-2 bg-primary/5 rounded-lg">
                  <span className="font-medium truncate flex-1">{task.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{task.department}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section F — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-lg shadow-soft">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              הכנסות חודשיות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`₪${v.toLocaleString()}`, 'הכנסות']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-soft">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-kpi-events" />
              אירועים לחודש
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [v, 'אירועים']} />
                  <Line type="monotone" dataKey="events" stroke="hsl(var(--kpi-events))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section G — Weekly preview */}
      {(isThursday || showNextWeek) && (
        <Card className="rounded-lg shadow-soft border-2 border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-4 h-4 text-primary" />
                📋 תצפית שבועית — שבוע הבא
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5 no-print" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" />
                הדפס
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-2">
            {stats.nextWeekEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">אין אירועים בשבוע הבא</p>
            ) : (
              stats.nextWeekEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-primary/5 rounded-md border border-primary/10">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{event.client_name || event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), 'EEEE dd/MM', { locale: he })} | {event.guests} אורחים
                    </p>
                  </div>
                  <Badge className={cn("text-[10px]", statusColors[event.status] || 'bg-muted')}>
                    {statusLabels[event.status] || event.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {!isThursday && !showNextWeek && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setShowNextWeek(true)} className="gap-2">
            <Eye className="w-4 h-4" />
            צפה בשבוע הבא
          </Button>
        </div>
      )}
    </div>
  );
};

import { useApp } from '@/context/AppContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  CalendarDays, Package, AlertTriangle, Users,
  ChefHat, TrendingUp, Warehouse, BookOpen,
  Calendar, Receipt, Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '@/components/layout/CardSkeleton';
import { EmptyState } from '@/components/layout/EmptyState';
import { cn } from '@/lib/utils';

export const DashboardPage = () => {
  const { clientInfo } = useApp();
  const { 
    totalRecipes, eventsThisWeek, guestsThisWeek, activeTasks,
    totalWarehouseItems, lowStockItems, criticalStockItems,
    pendingInvoices, nextEvent, loading: statsLoading 
  } = useDashboardStats();

  const kpis = [
    {
      label: 'פריטים במחסן',
      value: totalWarehouseItems,
      sub: 'סה״כ פריטים',
      icon: Package,
      gradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      borderColor: 'border-r-primary',
    },
    {
      label: 'התראות מלאי',
      value: criticalStockItems + lowStockItems,
      icon: AlertTriangle,
      gradient: criticalStockItems > 0 ? 'from-destructive/10 to-destructive/5' : lowStockItems > 0 ? 'from-amber-500/10 to-amber-500/5' : 'from-primary/10 to-primary/5',
      iconBg: criticalStockItems > 0 ? 'bg-destructive/15' : lowStockItems > 0 ? 'bg-amber-500/15' : 'bg-primary/15',
      iconColor: criticalStockItems > 0 ? 'text-destructive' : lowStockItems > 0 ? 'text-amber-500' : 'text-primary',
      borderColor: criticalStockItems > 0 ? 'border-r-destructive' : lowStockItems > 0 ? 'border-r-amber-500' : 'border-r-primary',
      badges: [
        criticalStockItems > 0 && { label: `${criticalStockItems} קריטי`, variant: 'destructive' as const },
        lowStockItems > 0 && { label: `${lowStockItems} נמוך`, className: 'bg-amber-500' },
        criticalStockItems === 0 && lowStockItems === 0 && { label: 'מלאי תקין', className: 'bg-primary' },
      ].filter(Boolean),
    },
    {
      label: 'אירועים השבוע',
      value: eventsThisWeek,
      sub: `${guestsThisWeek} אורחים`,
      icon: CalendarDays,
      gradient: 'from-kpi-events/10 to-kpi-events/5',
      iconBg: 'bg-kpi-events/15',
      iconColor: 'text-kpi-events',
      borderColor: 'border-r-kpi-events',
    },
    {
      label: 'ממתינים לתשלום',
      value: pendingInvoices,
      sub: 'חשבוניות פתוחות',
      icon: Receipt,
      gradient: 'from-amber-500/10 to-amber-500/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      borderColor: 'border-r-amber-500',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* Hero Banner */}
      <div className="gradient-hero-soft rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-food-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">שלום! 👋</h1>
            <p className="text-primary-foreground/80 text-sm sm:text-lg leading-snug">
              ברוכים הבאים ל{clientInfo.name} - {clientInfo.tagline}
            </p>
          </div>
          <div className="text-5xl sm:text-7xl shrink-0 drop-shadow-lg">{clientInfo.logo}</div>
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-2 sm:gap-3 mt-5 sm:mt-6">
          <Button asChild variant="secondary" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-xl shadow-soft">
            <Link to="/warehouse"><Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4" />מחסן</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-xl shadow-soft">
            <Link to="/kitchen-ops"><ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />פוסט מטבח</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-xl shadow-soft">
            <Link to="/agenda"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />יומן אירועים</Link>
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      {statsLoading ? (
        <CardSkeleton variant="kpi" count={4} />
      ) : (
        <div data-demo-tour="dashboard-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className={cn(
              "border-r-4 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-card",
              kpi.borderColor
            )}>
              <div className={cn("bg-gradient-to-bl", kpi.gradient)}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                  <div className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center", kpi.iconBg)}>
                    <kpi.icon className={cn("w-4.5 h-4.5 sm:w-5.5 sm:h-5.5", kpi.iconColor)} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-5 pt-0">
                  <p className="text-2xl sm:text-3xl font-bold">{kpi.value}</p>
                  {kpi.sub && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
                  {kpi.badges && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {kpi.badges.map((b: any, i: number) => b && (
                        <Badge key={i} variant={b.variant || 'default'} className={cn("text-[10px] sm:text-xs px-1.5 sm:px-2", b.className)}>
                          {b.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Next Event */}
        <Card className="rounded-2xl shadow-soft hover:shadow-card transition-shadow">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="w-8 h-8 bg-kpi-events/10 rounded-lg flex items-center justify-center">
                  <Timer className="w-4 h-4 text-kpi-events" />
                </div>
                האירוע הקרוב
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                <Link to="/agenda">הכל →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {statsLoading ? (
              <div className="animate-pulse h-20 bg-muted rounded-xl" />
            ) : nextEvent ? (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base">{nextEvent.client_name || nextEvent.name}</h3>
                  <Badge variant={nextEvent.daysUntil <= 2 ? 'destructive' : 'secondary'} className="rounded-lg">
                    {nextEvent.daysUntil === 0 ? 'היום!' : `בעוד ${nextEvent.daysUntil} ימים`}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />{nextEvent.guests} אורחים
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {format(new Date(nextEvent.date), 'dd/MM/yyyy', { locale: he })}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState icon={CalendarDays} title="אין אירועים קרובים" className="py-8" />
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="rounded-2xl shadow-soft hover:shadow-card transition-shadow">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              סטטוס מערכת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
            {[
              { icon: Warehouse, label: 'מחסן', sub: `${totalWarehouseItems} פריטים`, link: '/warehouse', color: 'bg-kpi-reserve/10 text-kpi-reserve' },
              { icon: BookOpen, label: 'ספר מתכונים', sub: `${totalRecipes} מתכונים`, link: '/recipes', color: 'bg-destructive/10 text-destructive' },
              { icon: CalendarDays, label: 'יומן אירועים', sub: `${eventsThisWeek} אירועים השבוע`, link: '/agenda', color: 'bg-kpi-events/10 text-kpi-events' },
              { icon: ChefHat, label: 'פוסט מטבח', sub: `${activeTasks} משימות פעילות`, link: '/kitchen-ops', color: 'bg-secondary/10 text-secondary' },
            ].map(item => (
              <Link key={item.label} to={item.link} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl hover:bg-muted/60 transition-all duration-200 border border-transparent hover:border-border/50 group">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", item.color)}>
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">{item.label}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary text-[10px] sm:text-xs hover:bg-primary/20">פעיל</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

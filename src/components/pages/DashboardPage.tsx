import { useApp } from '@/context/AppContext';
import { Calendar, AlertTriangle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const { events, warehouse, reserve, setCurrentPage } = useApp();

  // Calculate KPIs
  const thisWeekEvents = events.length;
  const totalGuests = events.reduce((sum, e) => sum + e.guests, 0);
  const lowStockItems = warehouse.filter(item => item.status === 'low' || item.status === 'critical').length;
  const reserveTotal = reserve.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero Banner */}
      <div className="gradient-hero rounded-3xl p-6 md:p-8 text-primary-foreground shadow-elevated">
        <div className="max-w-lg">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <span>בוקר טוב, שף! 👨‍🍳</span>
          </h1>
          <p className="mt-3 text-primary-foreground/90">
            יש לך {events.filter(e => e.date === '2026-01-01').length} אירועים היום ו-{reserve.length} הכנות דחופות לרזרבה.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              onClick={() => setCurrentPage('agenda')}
              variant="secondary"
              className="bg-card text-foreground hover:bg-card/90 rounded-xl px-6"
            >
              לוח אירועים
            </Button>
            <Button
              onClick={() => setCurrentPage('reserve')}
              variant="outline"
              className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 rounded-xl px-6"
            >
              ניהול רזרבה
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Events this week */}
        <div 
          className="bg-card rounded-2xl p-5 shadow-soft hover:shadow-card transition-shadow cursor-pointer animate-fade-in-up stagger-1"
          onClick={() => setCurrentPage('agenda')}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-kpi-events/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-kpi-events" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">אירועים השבוע</p>
              <p className="text-3xl font-bold text-foreground mt-1">{thisWeekEvents}</p>
              <p className="text-sm text-muted-foreground mt-1">סה"כ {totalGuests} סועדים</p>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        <div 
          className="bg-card rounded-2xl p-5 shadow-soft hover:shadow-card transition-shadow cursor-pointer animate-fade-in-up stagger-2"
          onClick={() => setCurrentPage('warehouse')}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-kpi-alerts/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-kpi-alerts" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">התראות מחסן</p>
              <p className="text-3xl font-bold text-foreground mt-1">{lowStockItems}</p>
              <p className="text-sm text-muted-foreground mt-1">מוצרים מתחת למינימום</p>
            </div>
          </div>
        </div>

        {/* Reserve Status */}
        <div 
          className="bg-card rounded-2xl p-5 shadow-soft hover:shadow-card transition-shadow cursor-pointer animate-fade-in-up stagger-3"
          onClick={() => setCurrentPage('reserve')}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-kpi-reserve/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-kpi-reserve" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">מצב רזרבה</p>
              <p className="text-3xl font-bold text-foreground mt-1">85%</p>
              <p className="text-sm text-muted-foreground mt-1">בצקים וקישים מוכנים</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions or Recent Activity could go here */}
      <div className="bg-card rounded-2xl p-6 shadow-soft animate-fade-in-up stagger-4">
        <h3 className="font-semibold text-foreground mb-4">אירועים קרובים</h3>
        <div className="space-y-3">
          {events.slice(0, 3).map(event => (
            <div 
              key={event.id}
              className="flex items-center justify-between p-3 bg-background rounded-xl hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{event.time}</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
                  {event.date}
                </span>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">{event.name}</p>
                <p className="text-sm text-muted-foreground">{event.guests} סועדים</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

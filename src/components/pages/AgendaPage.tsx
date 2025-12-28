import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Play, CalendarDays, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const AgendaPage = () => {
  const { events, recipes, setEvents } = useApp();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 0, 1));

  const handleStartProduction = (eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, status: 'in-progress' as const } : e
    ));
    
    toast({
      title: "ייצור הותחל! 🚀",
      description: "המלאי נוכה בהתאם לפריטי ההזמנה",
    });
  };

  const getRecipeName = (recipeId: string) => {
    return recipes.find(r => r.id === recipeId)?.name || recipeId;
  };

  // Format selected date to match event date format
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  // Filter events for selected date
  const filteredEvents = events.filter(event => event.date === selectedDateStr);

  // Get dates that have events for calendar highlighting
  const eventDates = events.map(e => new Date(e.date));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          <span className="text-lg font-medium text-muted-foreground">
            {selectedDate ? format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he }) : 'בחר תאריך'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">יומן אירועים</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl shadow-soft p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={he}
              className="rounded-xl pointer-events-auto"
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersClassNames={{
                hasEvent: 'bg-primary/20 text-primary font-bold',
              }}
            />
            
            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                <span>ימים עם אירועים</span>
                <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Events List Section */}
        <div className="lg:col-span-2 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-soft p-8 text-center">
              <CalendarDays className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">אין אירועים בתאריך זה</h3>
              <p className="text-muted-foreground">בחר תאריך אחר בלוח השנה או הוסף אירוע חדש</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredEvents.length} אירועים
                </span>
                <h2 className="text-lg font-semibold text-foreground">
                  אירועים ליום {format(selectedDate, 'd/M', { locale: he })}
                </h2>
              </div>
              
              {filteredEvents.map((event, index) => (
                <div 
                  key={event.id}
                  className={cn(
                    "bg-card rounded-2xl shadow-soft overflow-hidden animate-fade-in-up border-r-4",
                    event.status === 'in-progress' ? 'border-r-secondary' : 'border-r-primary'
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Event Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {event.status === 'pending' && (
                          <Button
                            onClick={() => handleStartProduction(event.id)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all active:scale-95"
                          >
                            <Play className="w-4 h-4 ml-2" />
                            התחל ייצור
                          </Button>
                        )}
                        {event.status === 'in-progress' && (
                          <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-sm font-medium">
                            בייצור
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-2">
                          <div className="flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{event.name}</h3>
                        <div className="flex items-center gap-1 text-muted-foreground justify-end mt-1">
                          <span>{event.guests} סועדים</span>
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-accent/50 rounded-xl p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-3 text-right">פירוט הזמנה:</p>
                      <div className="space-y-2">
                        {event.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="font-medium text-foreground">x{item.quantity}</span>
                            <span className="text-foreground">{getRecipeName(item.recipeId)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

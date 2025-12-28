import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const AgendaPage = () => {
  const { events, recipes, setEvents } = useApp();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState('ינואר 2026');

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-foreground">{currentMonth}</span>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">יומן אירועים</h1>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <div 
            key={event.id}
            className={`bg-card rounded-2xl shadow-soft overflow-hidden animate-fade-in-up border-r-4 ${
              event.status === 'in-progress' ? 'border-r-secondary' : 'border-r-primary'
            }`}
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
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                      {event.date}
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm">
                      {event.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{event.name}</h3>
                  <p className="text-muted-foreground">{event.guests} סועדים</p>
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
      </div>
    </div>
  );
};

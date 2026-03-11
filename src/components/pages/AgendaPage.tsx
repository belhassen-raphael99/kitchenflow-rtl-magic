import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, Plus, Clock, Loader2 } from 'lucide-react';
import { useEvents, EventWithClient, EventFormData } from '@/hooks/useEvents';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { EventCard } from '@/components/agenda/EventCard';
import { EventDialog } from '@/components/agenda/EventDialog';
import { ClientDialog } from '@/components/agenda/ClientDialog';
import { DeleteEventDialog } from '@/components/agenda/DeleteEventDialog';

export const AgendaPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | null>(null);

  const { events, loading: eventsLoading, getEventsForDate, getDatesWithEvents, createEvent, updateEvent, deleteEvent } = useEvents();
  const { clients, loading: clientsLoading, createClient } = useClients();
  const { isAdmin, canWrite } = useAuth();

  const formattedDate = format(selectedDate, 'dd MMMM yyyy', { locale: he });
  const eventsForSelectedDate = getEventsForDate(selectedDate);
  const datesWithEvents = getDatesWithEvents();

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const handleEditEvent = (event: EventWithClient) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const handleDeleteEvent = (event: EventWithClient) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id);
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleEventSubmit = async (data: EventFormData): Promise<boolean> => {
    if (selectedEvent) {
      return await updateEvent(selectedEvent.id, data);
    } else {
      return await createEvent(data);
    }
  };

  const isLoading = eventsLoading || clientsLoading;

  // Custom day rendering for calendar - show dots on days with events
  const modifiers = {
    hasEvents: (date: Date) => datesWithEvents.some(d => isSameDay(d, date)),
  };

  const modifiersStyles = {
    hasEvents: {
      position: 'relative' as const,
    },
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />
            יומן אירועים
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        {canWrite && (
          <Button className="gap-2" onClick={handleNewEvent}>
            <Plus className="w-4 h-4" />
            אירוע חדש
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md"
              locale={he}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              components={{
                DayContent: ({ date }) => {
                  const hasEvents = datesWithEvents.some(d => isSameDay(d, date));
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {date.getDate()}
                      {hasEvents && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </div>
                  );
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Events for selected date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              אירועים ל-{formattedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : eventsForSelectedDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CalendarDays className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  אין אירועים ביום זה
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  {canWrite
                    ? 'לחץ על "אירוע חדש" כדי להוסיף אירוע לתאריך זה.'
                    : 'אין אירועים מתוכננים לתאריך זה.'}
                </p>
                {isAdmin && (
                  <Button onClick={handleNewEvent} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף אירוע
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {eventsForSelectedDate.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        clients={clients}
        onSubmit={handleEventSubmit}
        onNewClient={() => setClientDialogOpen(true)}
        selectedDate={selectedDate}
      />

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSubmit={createClient}
      />

      <DeleteEventDialog
        event={selectedEvent}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

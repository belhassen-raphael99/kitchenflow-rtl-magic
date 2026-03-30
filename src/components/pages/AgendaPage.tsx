import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, Plus, Clock, Loader2, List, LayoutGrid, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEvents, EventWithClient } from '@/hooks/useEvents';
import { useClients } from '@/hooks/useClients';
import { useRecipes } from '@/hooks/useRecipes';
import { useAuth } from '@/hooks/useAuth';
import { EventCard } from '@/components/agenda/EventCard';
import { EventWizard, EventWizardData } from '@/components/agenda/EventWizard';
import { EventDialog } from '@/components/agenda/EventDialog';
import { ClientDialog } from '@/components/agenda/ClientDialog';
import { DeleteEventDialog } from '@/components/agenda/DeleteEventDialog';
import { EventDetailPanel } from '@/components/agenda/EventDetailPanel';
import { SuccessDialog } from '@/components/agenda/SuccessDialog';

export const AgendaPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventWithClient | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successDepts, setSuccessDepts] = useState<string[]>([]);

  const { events, loading: eventsLoading, getEventsForDate, getDatesWithEvents, createEventFromWizard, updateEvent, deleteEvent, fetchEvents } = useEvents();
  const { clients, loading: clientsLoading, createClient } = useClients();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { isAdmin, canWrite } = useAuth();

  const formattedDate = format(selectedDate, 'dd MMMM yyyy', { locale: he });
  const eventsForSelectedDate = getEventsForDate(selectedDate);
  const datesWithEvents = getDatesWithEvents();

  // Upcoming events for list view
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date(new Date().toDateString()));

  const handleNewEvent = () => setWizardOpen(true);

  const handleEditEvent = (event: EventWithClient) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
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
      setDetailEvent(null);
    }
  };

  const handleWizardSubmit = async (data: EventWizardData): Promise<boolean> => {
    const result = await createEventFromWizard(data);
    if (result.success) {
      setSuccessDepts(result.departments);
      setSuccessOpen(true);
    }
    return result.success;
  };

  const handleEventClick = (event: EventWithClient) => {
    setDetailEvent(event);
  };

  const isLoading = eventsLoading || clientsLoading;

  const modifiers = {
    hasEvents: (date: Date) => datesWithEvents.some(d => isSameDay(d, date)),
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <PageHeader
        icon={CalendarDays}
        title="יומן אירועים"
        description={formattedDate}
        accentColor="blue"
        actions={
          <div className="flex gap-2 no-print">
            <Button variant="outline" size="icon" onClick={() => window.print()} title="הדפס" className="rounded-md">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('calendar')} className="rounded-md">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} className="rounded-md">
              <List className="w-4 h-4" />
            </Button>
            {canWrite && (
              <Button className="gap-2 rounded-md" onClick={handleNewEvent}>
                <Plus className="w-4 h-4" />
                הזמנה חדשה
              </Button>
            )}
          </div>
        }
      />

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card data-demo-tour="agenda-calendar" className="lg:col-span-1">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => { date && setSelectedDate(date); setDetailEvent(null); }}
                className="rounded-md pointer-events-auto"
                locale={he}
                weekStartsOn={0}
                modifiers={modifiers}
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

          {/* Events or Detail Panel */}
          <Card className="lg:col-span-2">
            {detailEvent ? (
              <CardContent className="p-0">
                <EventDetailPanel
                  event={detailEvent}
                  onEdit={() => handleEditEvent(detailEvent)}
                  onDelete={() => handleDeleteEvent(detailEvent)}
                  onClose={() => setDetailEvent(null)}
                  canWrite={canWrite}
                  onStatusChange={fetchEvents}
                />
              </CardContent>
            ) : (
              <>
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
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">אין אירועים ביום זה</h3>
                      <p className="text-sm text-muted-foreground max-w-md mb-6">
                        {canWrite ? 'לחץ על "הזמנה חדשה" כדי להוסיף אירוע.' : 'אין אירועים מתוכננים.'}
                      </p>
                      {canWrite && (
                        <Button onClick={handleNewEvent} variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" />
                          הוסף אירוע
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {eventsForSelectedDate.map((event, index) => (
                        <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards' }}>
                          <EventCard
                            event={event}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                            onClick={handleEventClick}
                            isAdmin={canWrite}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              כל האירועים הקרובים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>אין אירועים קרובים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}>
                    <EventCard
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onClick={handleEventClick}
                      isAdmin={canWrite}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <EventWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        clients={clients}
        recipes={recipes}
        onSubmit={handleWizardSubmit}
        selectedDate={selectedDate}
      />

      <EventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={selectedEvent}
        clients={clients}
        onSubmit={async (data) => {
          if (selectedEvent) return await updateEvent(selectedEvent.id, data);
          return false;
        }}
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

      <SuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        departments={successDepts}
        onBackToAgenda={() => setSuccessOpen(false)}
      />
    </div>
  );
};

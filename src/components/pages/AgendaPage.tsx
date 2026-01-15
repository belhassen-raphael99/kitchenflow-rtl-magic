import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarDays, Plus, Clock, Users, Package, Database } from 'lucide-react';

export const AgendaPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formattedDate = format(selectedDate, 'dd MMMM yyyy', { locale: he });

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
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" />
          אירוע חדש
        </Button>
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
            {/* No Data State */}
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Database className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                לא מחובר לנתונים
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                יש ליצור את טבלאות events, clients ו-event_items בבסיס הנתונים כדי להשתמש ביומן האירועים.
              </p>
              
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <CalendarDays className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">events</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">clients</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Package className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">event_items</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

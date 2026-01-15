import { Clock, Users, Phone, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventWithClient, EventStatus } from '@/hooks/useEvents';

interface EventCardProps {
  event: EventWithClient;
  onEdit: (event: EventWithClient) => void;
  onDelete: (event: EventWithClient) => void;
  isAdmin: boolean;
}

const statusConfig: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'ממתין', variant: 'secondary' },
  'in-progress': { label: 'בתהליך', variant: 'default' },
  completed: { label: 'הושלם', variant: 'outline' },
  cancelled: { label: 'בוטל', variant: 'destructive' },
};

export const EventCard = ({ event, onEdit, onDelete, isAdmin }: EventCardProps) => {
  const status = statusConfig[event.status] || statusConfig.pending;
  const formattedTime = event.time.slice(0, 5); // HH:MM format

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedTime}
              </span>
            </div>
            
            <h3 className="font-semibold text-lg">{event.name}</h3>
            
            {event.clients && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{event.clients.name}</span>
                {event.clients.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {event.clients.phone}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{event.guests} אורחים</span>
            </div>
            
            {event.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {event.notes}
              </p>
            )}
          </div>
          
          {isAdmin && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(event)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(event)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

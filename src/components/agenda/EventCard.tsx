import { differenceInDays } from 'date-fns';
import { Clock, Users, Phone, Edit, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventWithClient, EventStatus } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: EventWithClient;
  onEdit: (event: EventWithClient) => void;
  onDelete: (event: EventWithClient) => void;
  onClick?: (event: EventWithClient) => void;
  isAdmin: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'ממתין', variant: 'secondary' },
  confirmed: { label: 'מאושר', variant: 'default' },
  'in-progress': { label: 'בתהליך', variant: 'default' },
  completed: { label: 'הושלם', variant: 'outline' },
  cancelled: { label: 'בוטל', variant: 'destructive' },
};

export const EventCard = ({ event, onEdit, onDelete, onClick, isAdmin }: EventCardProps) => {
  const status = statusConfig[event.status] || statusConfig.pending;
  const formattedTime = event.time?.slice(0, 5) || '';
  const eventData = event as any;
  
  const daysUntil = differenceInDays(new Date(event.date), new Date());
  const urgencyBorder = daysUntil <= 2 && daysUntil >= 0 ? 'border-r-4 border-r-destructive' :
    daysUntil <= 7 ? 'border-r-4 border-r-amber-500' : '';

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
        urgencyBorder
      )}
      onClick={() => onClick?.(event)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status.variant}>{status.label}</Badge>
              {eventData.event_type && <Badge variant="outline" className="text-xs">{eventData.event_type}</Badge>}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedTime}
              </span>
              {daysUntil <= 2 && daysUntil >= 0 && <Badge variant="destructive" className="text-xs">דחוף!</Badge>}
            </div>
            
            <h3 className="font-semibold text-lg">{eventData.client_name || event.name}</h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {event.guests} אורחים
              </span>
              {eventData.client_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {eventData.client_phone}
                </span>
              )}
              {eventData.delivery_address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {eventData.delivery_address}
                </span>
              )}
            </div>
            
            {event.notes && (
              <p className="text-sm text-muted-foreground line-clamp-1">{event.notes}</p>
            )}
          </div>
          
          {isAdmin && (
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={() => onEdit(event)} className="h-8 w-8">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

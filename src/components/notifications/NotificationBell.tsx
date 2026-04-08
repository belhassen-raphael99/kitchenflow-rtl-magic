import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Check,
  Trash2,
  RefreshCw,
  Package,
  Calendar,
  AlertTriangle,
  Info,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { useNotifications, Notification, NotificationType, NotificationSeverity } from '@/hooks/useNotifications';
import { useAuthContext } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export const NotificationBell = () => {
  const { isAdmin } = useAuthContext();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshAlerts,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isAdmin) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAlerts();
    setRefreshing(false);
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'low_stock':
        return <Package className="w-4 h-4" />;
      case 'expiring':
        return <AlertTriangle className="w-4 h-4" />;
      case 'upcoming_event':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSeverityBg = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">התראות</h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={markAllAsRead}
                  title="סמן הכל כנקרא"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={clearAllNotifications}
                  title="מחק הכל"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">אין התראות</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4 ml-1" />
                בדוק עכשיו
              </Button>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    getTypeIcon={getTypeIcon}
                    getSeverityColor={getSeverityColor}
                    getSeverityBg={getSeverityBg}
                  />
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: NotificationType) => React.ReactNode;
  getSeverityColor: (severity: NotificationSeverity) => string;
  getSeverityBg: (severity: NotificationSeverity) => string;
}

const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
  getTypeIcon,
  getSeverityColor,
  getSeverityBg,
}: NotificationItemProps) => {
  return (
    <div
      className={cn(
        "p-3 hover:bg-muted/50 transition-colors",
        !notification.is_read && "bg-muted/30"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white",
            getSeverityColor(notification.severity)
          )}
        >
          {getTypeIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { 
                locale: he, 
                addSuffix: true 
              })}
            </span>

            <div className="flex gap-1">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMarkRead(notification.id)}
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => onDelete(notification.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Snowflake,
  Thermometer,
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  Calendar,
  MapPin,
  ChefHat,
} from 'lucide-react';
import { ReserveItem } from '@/hooks/useReserve';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

interface ReserveItemCardProps {
  item: ReserveItem;
  onEdit: (item: ReserveItem) => void;
  onDelete: (item: ReserveItem) => void;
  onProduce: (item: ReserveItem) => void;
  onConsume: (item: ReserveItem) => void;
}

export const ReserveItemCard = ({
  item,
  onEdit,
  onDelete,
  onProduce,
  onConsume,
}: ReserveItemCardProps) => {
  const { isAdmin } = useAuth();

  const isLowStock = item.quantity <= item.min_stock;
  const isExpiringSoon = item.expiry_date && differenceInDays(new Date(item.expiry_date), new Date()) <= 7;
  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();

  const getStorageIcon = () => {
    switch (item.storage_type) {
      case 'frozen':
        return <Snowflake className="w-5 h-5" />;
      case 'refrigerated':
        return <Thermometer className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStorageLabel = () => {
    switch (item.storage_type) {
      case 'frozen':
        return 'הקפאה';
      case 'refrigerated':
        return 'קירור';
      default:
        return 'אחסון';
    }
  };

  const getStorageColor = () => {
    switch (item.storage_type) {
      case 'frozen':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'refrigerated':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-200';
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
    }
  };

  const getStockStatus = () => {
    if (item.quantity === 0) return { color: 'bg-red-500', label: 'אזל' };
    if (isLowStock) return { color: 'bg-orange-500', label: 'נמוך' };
    return { color: 'bg-green-500', label: 'תקין' };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isExpired && "border-red-300 bg-red-50/50",
      isLowStock && !isExpired && "border-orange-300 bg-orange-50/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              {item.recipe && (
                <Badge variant="outline" className="text-xs gap-1">
                  <ChefHat className="w-3 h-3" />
                  מתכון
                </Badge>
              )}
            </div>
            <Badge className={cn("mt-1 gap-1", getStorageColor())}>
              {getStorageIcon()}
              {getStorageLabel()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", stockStatus.color)} />
            <div className="text-left">
              <p className="text-2xl font-bold">{item.quantity}</p>
              <p className="text-xs text-muted-foreground">{item.unit}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Alerts */}
        <div className="flex flex-wrap gap-2">
          {isLowStock && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1">
              <AlertTriangle className="w-3 h-3" />
              מלאי נמוך (מינ׳: {item.min_stock})
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="gap-1">
              <Calendar className="w-3 h-3" />
              פג תוקף!
            </Badge>
          )}
          {isExpiringSoon && !isExpired && (
            <Badge variant="outline" className="text-red-600 border-red-300 gap-1">
              <Calendar className="w-3 h-3" />
              פג תוקף בקרוב
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {item.expiry_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>תוקף: {format(new Date(item.expiry_date), 'dd/MM/yyyy', { locale: he })}</span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{item.location}</span>
            </div>
          )}
        </div>

        {item.recipe && (
          <p className="text-sm text-muted-foreground">
            קשור למתכון: <span className="font-medium">{item.recipe.name}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          {isAdmin && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => onProduce(item)}
              >
                <Plus className="w-4 h-4" />
                ייצר
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => onConsume(item)}
                disabled={item.quantity === 0}
              >
                <Minus className="w-4 h-4" />
                צרוך
              </Button>
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(item)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(item)}
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

import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  totalMissing: number;
  affectedEvents: number;
  onClick: () => void;
}

export function CriticalStockBanner({ totalMissing, affectedEvents, onClick }: Props) {
  if (totalMissing === 0) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between gap-3 rounded-xl border-2 border-destructive/50 bg-destructive/10 px-4 py-3 text-right',
        'hover:bg-destructive/15 transition-colors animate-in fade-in-50'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-full bg-destructive/20 p-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-destructive">
            🚨 התראה: חוסרים קריטיים במלאי
          </p>
          <p className="text-xs text-destructive/80">
            {totalMissing} רכיבי גלם חסרים עבור {affectedEvents} {affectedEvents === 1 ? 'אירוע' : 'אירועים'} בימים הקרובים
          </p>
        </div>
      </div>
      <ChevronLeft className="w-5 h-5 text-destructive shrink-0" />
    </button>
  );
}

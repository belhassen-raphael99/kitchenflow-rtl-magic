import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  accentColor?: 'green' | 'blue' | 'orange' | 'violet' | 'rose';
}

const accentClasses: Record<string, string> = {
  green: 'text-primary',
  blue: 'text-kpi-events',
  orange: 'text-secondary',
  violet: 'text-kpi-reserve',
  rose: 'text-destructive',
};

const accentBg: Record<string, string> = {
  green: 'bg-primary/10',
  blue: 'bg-kpi-events/10',
  orange: 'bg-secondary/10',
  violet: 'bg-kpi-reserve/10',
  rose: 'bg-destructive/10',
};

export const PageHeader = ({ icon: Icon, title, description, actions, accentColor = 'green' }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center", accentBg[accentColor])}>
            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", accentClasses[accentColor])} />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

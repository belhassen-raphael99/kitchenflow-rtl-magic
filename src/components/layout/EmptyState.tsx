import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-muted-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
};

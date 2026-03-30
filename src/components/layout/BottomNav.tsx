import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, ChefHat, Package, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'דשבורד' },
  { path: '/agenda', icon: Calendar, label: 'יומן' },
  { path: '/chef', icon: ChefHat, label: 'שף' },
  { path: '/warehouse', icon: Package, label: 'מחסן' },
  { path: '/recipes', icon: BookOpen, label: 'מתכונים' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border shadow-elevated safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
                isActive && "bg-primary/10 scale-110"
              )}>
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

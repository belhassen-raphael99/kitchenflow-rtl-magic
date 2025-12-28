import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  ChefHat, 
  Layers, 
  Package,
  Maximize,
  LogOut,
  Monitor,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const navItems = [
  { id: '/', label: 'דשבורד', icon: LayoutDashboard },
  { id: '/kitchen-ops', label: 'פוסט מטבח', icon: Monitor, section: 'תפעול' },
  { id: '/agenda', label: 'יומן אירועים', icon: Calendar },
  { id: '/recipes', label: 'ספר מתכונים', icon: ChefHat },
  { id: '/reserve', label: 'רזרבה (הכנות)', icon: Layers, section: 'ניהול מלאי' },
  { id: '/warehouse', label: 'מחסן (חומרי גלם)', icon: Package },
];

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, toggleFullscreen, clientInfo } = useApp();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } else {
      navigate('/auth');
    }
  };
  return (
    <>
      {/* Mobile/Tablet overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-sidebar border-l border-sidebar-border z-50 transition-all duration-300 flex flex-col shadow-xl lg:shadow-none",
          // Mobile: Full width slide-in
          sidebarOpen ? "w-72 translate-x-0" : "translate-x-full lg:translate-x-0",
          // Desktop: Collapsible
          !sidebarOpen && "lg:w-20"
        )}
      >
        {/* Header with close button for mobile */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {/* Close button - mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              {(sidebarOpen || window.innerWidth >= 1024) && (
                <div className={cn(
                  "text-right animate-fade-in",
                  !sidebarOpen && "lg:hidden"
                )}>
                  <h1 className="font-bold text-lg text-foreground">{clientInfo.name}</h1>
                  <p className="text-xs text-muted-foreground">{clientInfo.tagline}</p>
                </div>
              )}
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-2xl shrink-0">
                {clientInfo.logo}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.section && sidebarOpen && (
                  <p className="text-xs text-muted-foreground px-3 py-2 mt-4 font-medium uppercase tracking-wide">
                    {item.section}
                  </p>
                )}
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200",
                    "hover:bg-sidebar-accent active:scale-[0.98]",
                    // Larger touch targets for mobile/tablet
                    "min-h-[56px] md:min-h-[52px] lg:min-h-[48px]",
                    location.pathname === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground",
                    !sidebarOpen && "lg:justify-center lg:px-0"
                  )}
                >
                  <item.icon className={cn(
                    "shrink-0 transition-all",
                    // Larger icons for mobile
                    "w-6 h-6 md:w-5 md:h-5",
                    location.pathname === item.id && "text-primary"
                  )} />
                  <span className={cn(
                    "text-base md:text-sm font-medium",
                    !sidebarOpen && "lg:hidden"
                  )}>
                    {item.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <button
            onClick={toggleFullscreen}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200",
              "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "min-h-[56px] md:min-h-[52px] lg:min-h-[48px]",
              !sidebarOpen && "lg:justify-center lg:px-0"
            )}
          >
            <Maximize className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
            <span className={cn(
              "text-base md:text-sm",
              !sidebarOpen && "lg:hidden"
            )}>
              מסך מלא
            </span>
          </button>
          
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200",
              "text-destructive hover:bg-destructive/10",
              "min-h-[56px] md:min-h-[52px] lg:min-h-[48px]",
              !sidebarOpen && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut className="w-6 h-6 md:w-5 md:h-5 shrink-0" />
            <span className={cn(
              "text-base md:text-sm",
              !sidebarOpen && "lg:hidden"
            )}>
              התנתק
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile/Tablet toggle button - Floating hamburger menu */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={cn(
          "fixed top-4 right-4 z-30 lg:hidden",
          "w-14 h-14 md:w-12 md:h-12",
          "bg-primary text-primary-foreground rounded-2xl",
          "flex items-center justify-center shadow-lg shadow-primary/30",
          "hover:bg-primary/90 active:scale-95 transition-all",
          sidebarOpen && "opacity-0 pointer-events-none scale-90"
        )}
      >
        <Menu className="w-7 h-7 md:w-6 md:h-6" />
      </button>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed z-50 hidden lg:flex",
          "top-1/2 transform -translate-y-1/2",
          sidebarOpen ? "right-[280px]" : "right-[68px]",
          "w-6 h-16 bg-card border border-border rounded-l-lg",
          "items-center justify-center shadow-md hover:bg-accent transition-all duration-300"
        )}
      >
        <div className={cn(
          "w-1 h-6 bg-border rounded-full transition-transform",
          !sidebarOpen && "rotate-180"
        )} />
      </button>
    </>
  );
};
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from '@/hooks/useTheme';
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
  Users,
  ChevronsUpDown,
  Settings,
  Truck,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { id: '/', label: 'דשבורד', icon: LayoutDashboard },
  { id: '/chef', label: 'דשבורד שף', icon: ChefHat, section: 'תפעול' },
  { id: '/kitchen-ops', label: 'פוסט מטבח', icon: Monitor },
  { id: '/delivery', label: 'משלוחים', icon: Truck },
  { id: '/agenda', label: 'יומן אירועים', icon: Calendar },
  { id: '/recipes', label: 'ספר מתכונים', icon: ChefHat },
  { id: '/reserve', label: 'רזרבה (הכנות)', icon: Layers, section: 'ניהול מלאי' },
  { id: '/warehouse', label: 'מחסן (חומרי גלם)', icon: Package },
];

const adminNavItems = [
  { id: '/admin/users', label: 'ניהול משתמשים', icon: Users, section: 'ניהול' },
];

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, toggleFullscreen, clientInfo } = useApp();
  const { signOut, isAdmin, user, role } = useAuth();
  const { full_name, avatar_url } = useUserProfile();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = user?.email || '';
  const displayName = full_name || userEmail;
  const userInitials = full_name
    ? full_name.substring(0, 2).toUpperCase()
    : userEmail ? userEmail.substring(0, 2).toUpperCase() : '??';
  const roleLabel = role === 'admin' ? 'מנהל' : role === 'demo' ? 'דמו' : 'עובד';

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Notification Bell */}
              {sidebarOpen && <NotificationBell />}
            </div>

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

        {/* Global Search */}
        {sidebarOpen && (
          <div className="px-3 pb-2">
            <GlobalSearch />
          </div>
        )}

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
                    "w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 relative",
                    "hover:bg-sidebar-accent active:scale-[0.98]",
                    "min-h-[56px] md:min-h-[52px] lg:min-h-[48px]",
                    location.pathname === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground",
                    !sidebarOpen && "lg:justify-center lg:px-0"
                  )}
                >
                  {/* Active indicator bar */}
                  {location.pathname === item.id && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full transition-all duration-300" />
                  )}
                  <item.icon className={cn(
                    "shrink-0 transition-all",
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

            {/* Admin Navigation */}
            {isAdmin && adminNavItems.map((item) => (
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
                    "min-h-[56px] md:min-h-[52px] lg:min-h-[48px]",
                    location.pathname === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground",
                    !sidebarOpen && "lg:justify-center lg:px-0"
                  )}
                >
                  <item.icon className={cn(
                    "shrink-0 transition-all",
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

        {/* User profile footer */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  "hover:bg-sidebar-accent active:scale-[0.98]",
                  "min-h-[56px] md:min-h-[52px] lg:min-h-[48px]",
                  !sidebarOpen && "lg:justify-center lg:px-0"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/20">
                  <AvatarImage src={avatar_url || undefined} alt="Profile" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0 text-right animate-fade-in">
                    <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">
                      {roleLabel}
                    </Badge>
                  </div>
                )}
                {sidebarOpen && (
                  <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1 text-right">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 w-fit mr-auto">
                    {roleLabel}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavClick('/settings')} className="cursor-pointer gap-2">
                <Settings className="w-4 h-4" />
                <span>הגדרות</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleFullscreen} className="cursor-pointer gap-2">
                <Maximize className="w-4 h-4" />
                <span>מסך מלא</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>{theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                <span>התנתק</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
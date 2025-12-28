import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  ChefHat, 
  Layers, 
  Package,
  Maximize,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { id: 'agenda', label: 'יומן אירועים', icon: Calendar },
  { id: 'recipes', label: 'ספר מתכונים', icon: ChefHat },
  { id: 'reserve', label: 'רזרבה (הכנות)', icon: Layers, section: 'ניהול מלאי' },
  { id: 'warehouse', label: 'מחסן (חומרי גלם)', icon: Package },
];

export const Sidebar = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    sidebarOpen, 
    setSidebarOpen,
    toggleFullscreen,
    clientInfo,
    logout,
    currentClient
  } = useApp();

  // Dynamic logo background based on client
  const logoBgColor = currentClient === 'pizzaking' ? 'bg-[#EF4444]' : 'bg-primary';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-sidebar border-l border-sidebar-border z-50 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-0 lg:w-16"
        )}
      >
        {/* Logo section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 justify-end">
            {sidebarOpen && (
              <div className="text-right animate-fade-in">
                <h1 className="font-bold text-lg text-foreground">{clientInfo.name}</h1>
                <p className="text-xs text-muted-foreground">{clientInfo.tagline}</p>
              </div>
            )}
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0", logoBgColor)}>
              {clientInfo.logo}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.section && sidebarOpen && (
                  <p className="text-xs text-muted-foreground px-3 py-2 mt-4">
                    {item.section}
                  </p>
                )}
                <button
                  onClick={() => {
                    setCurrentPage(item.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                    "hover:bg-sidebar-accent",
                    currentPage === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="animate-fade-in">{item.label}</span>
                  )}
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
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
              "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !sidebarOpen && "justify-center"
            )}
          >
            <Maximize className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>מסך מלא למטבח</span>}
          </button>
          
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
              "text-destructive hover:bg-destructive/10",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>התנתק</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-1/2 -left-3 transform -translate-y-1/2 w-6 h-12 bg-card border border-border rounded-lg flex items-center justify-center shadow-soft hover:bg-accent transition-colors hidden lg:flex"
        >
          {sidebarOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-4 right-4 z-50 lg:hidden w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center shadow-soft",
          sidebarOpen && "opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </>
  );
};

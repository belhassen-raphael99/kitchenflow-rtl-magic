import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

import { DemoBanner } from './DemoBanner';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { sidebarOpen } = useApp();
  const { isDemo } = useAuth();
  const isImpersonating = localStorage.getItem('impersonation_active') === 'true';

  return (
    <div dir="rtl" className={cn("min-h-screen bg-background font-heebo", (isImpersonating || isDemo) && "pt-10")}>
      {isDemo && <DemoBanner />}
      <Sidebar />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarOpen ? "lg:mr-72" : "lg:mr-20",
          "pt-20 lg:pt-0",
          "pb-0"
        )}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/pages/LoginPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { AgendaPage } from './components/pages/AgendaPage';
import { RecipesPage } from './components/pages/RecipesPage';
import { ReservePage } from './components/pages/ReservePage';
import { WarehousePage } from './components/pages/WarehousePage';
import { Toaster } from '@/components/ui/toaster';

const AppContent = () => {
  const { isLoggedIn, currentPage } = useApp();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'agenda':
        return <AgendaPage />;
      case 'recipes':
        return <RecipesPage />;
      case 'reserve':
        return <ReservePage />;
      case 'warehouse':
        return <WarehousePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}

export default App;

// @refresh reset
import { AppProvider } from '@/context/AppContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './components/pages/AuthPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { AgendaPage } from './components/pages/AgendaPage';
import { RecipesPage } from './components/pages/RecipesPage';
import { ReservePage } from './components/pages/ReservePage';
import { WarehousePage } from './components/pages/WarehousePage';
import { KitchenOpsPage } from './components/pages/KitchenOpsPage';
import { AdminUsersPage } from './components/pages/AdminUsersPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { DemoPage } from './components/pages/DemoPage';
import { DemoExpiredPage } from './components/pages/DemoExpiredPage';
import { NotFoundPage } from './components/pages/NotFoundPage';

import { Toaster } from '@/components/ui/toaster';
import { FoodBackground } from './components/layout/FoodBackground';
import { ImpersonationBanner } from './components/layout/ImpersonationBanner';
import { DemoTour } from './components/onboarding/DemoTour';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AuthRoute } from '@/components/auth/AuthRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <AuthPage />
          </AuthRoute>
        }
      />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/demo-expired" element={<DemoExpiredPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WarehousePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen-ops"
        element={
          <ProtectedRoute>
            <AppLayout>
              <KitchenOpsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AgendaPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RecipesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reserve"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReservePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminUsersPage />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <FoodBackground />
        <ImpersonationBanner />
        <AppRoutes />
        <Toaster />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;

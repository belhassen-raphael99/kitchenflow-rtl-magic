// @refresh reset
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps the public /auth (login) page.
 * Recovery / first-password flows now live on the dedicated /reset-password
 * route, so this guard only needs to redirect already-logged-in users away.
 */
export const AuthRoute = ({ children }: AuthRouteProps) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If a recovery flow is mid-flight, never silently redirect into the app.
  if (sessionStorage.getItem('auth_recovery') === 'true') {
    return <Navigate to="/reset-password" replace />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

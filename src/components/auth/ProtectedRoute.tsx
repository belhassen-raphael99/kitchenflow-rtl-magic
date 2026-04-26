// @refresh reset
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is mid password-recovery, force them to finish that flow
  // before they can access protected routes.
  if (sessionStorage.getItem('auth_recovery') === 'true') {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user || !role) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

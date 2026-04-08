// @refresh reset
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
  children: React.ReactNode;
}

export const AuthRoute = ({ children }: AuthRouteProps) => {
  const { user, loading } = useAuthContext();
  const [searchParams] = useSearchParams();

  // Don't redirect during password recovery flow
  const isRecovery = searchParams.get('type') === 'recovery' ||
    window.location.hash.includes('type=recovery');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !isRecovery) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

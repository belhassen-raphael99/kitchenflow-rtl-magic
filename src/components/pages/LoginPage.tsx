// LoginPage - Deprecated, redirecting to AuthPage
// This file is kept for compatibility but should not be used
import { Navigate } from 'react-router-dom';

export const LoginPage = () => {
  return <Navigate to="/auth" replace />;
};

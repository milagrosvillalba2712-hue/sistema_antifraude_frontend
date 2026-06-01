import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import type { Rol } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Rol[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

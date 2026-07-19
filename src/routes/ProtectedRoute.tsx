import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import type { Permission } from '../types';

interface ProtectedRouteProps {
  requiredPermissions?: Permission[];
}

export const ProtectedRoute = ({ requiredPermissions }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions?.length && user) {
    const permisos = user.permisos || [];
    const hasAll = requiredPermissions.every((permission) => permisos.includes(permission));
    if (!hasAll) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import type { Permission, Rol } from '../types';

interface ProtectedRouteProps {
  requiredPermissions?: Permission[];
  requiredRoles?: Rol[];
  blockedRoles?: Rol[];
}

export const ProtectedRoute = ({ requiredPermissions, requiredRoles, blockedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles?.length && (!user || !requiredRoles.includes(user.rol))) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (blockedRoles?.length && user && blockedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
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

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import type { Permission, Rol } from '../types';

interface ProtectedRouteProps {
  requiredPermissions?: Permission[];
  requiredRoles?: Rol[];
  blockedRoles?: Rol[];
  skipTerminosCheck?: boolean;
}

const PUBLIC_AFTER_AUTH = ['/acepte-terminos', '/unauthorized'];

export const ProtectedRoute = ({ requiredPermissions, requiredRoles, blockedRoles, skipTerminosCheck }: ProtectedRouteProps) => {
  const { isAuthenticated, user, aceptoTerminos } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!skipTerminosCheck && !aceptoTerminos && !PUBLIC_AFTER_AUTH.includes(location.pathname)) {
    return <Navigate to="/acepte-terminos" replace />;
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

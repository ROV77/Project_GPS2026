import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * Guard de rutas privadas. Si no hay sesión, redirige a /login. Se usa como
 * elemento padre de todas las rutas del panel (ver app/router/routes.tsx).
 */
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

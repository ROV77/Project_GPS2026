import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MyStorePage } from '@/features/stores/pages/MyStorePage';
import { ProductsListPage } from '@/features/products/pages/ProductsListPage';
import { PlansListPage } from '@/features/plans/pages/PlansListPage';
import { MyAccountPage } from '@/features/user/pages/MyAccountPage';
import { CouriersPage } from '@/features/couriers/pages/CouriersPage';

/**
 * Árbol de rutas. La jerarquía aplica los wrappers en orden:
 * ProtectedRoute (exige sesión) → AdminLayout (shell con <Outlet/>) → página.
 * Las rutas del menú coinciden con las `key` de shared/config/navigation.
 * "/mi-cuenta" existe pero no está en la barra: se accede desde el avatar.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/mi-tienda', element: <MyStorePage /> },
          { path: '/productos', element: <ProductsListPage /> },
          { path: '/repartidores', element: <CouriersPage /> },
          { path: '/planes', element: <PlansListPage /> },
          { path: '/mi-cuenta', element: <MyAccountPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

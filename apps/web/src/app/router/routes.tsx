import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { RegisterCourierPage } from '@/features/auth/pages/RegisterCourierPage';
import { DeliveryDashboardPage } from '@/features/delivery/pages/DeliveryDashboardPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MyStorePage } from '@/features/stores/pages/MyStorePage';
import { ProductsListPage } from '@/features/products/pages/ProductsListPage';
import { PromotionsListPage } from '@/features/promotions/pages/PromotionsListPage';
import { PlansListPage } from '@/features/plans/pages/PlansListPage';
import { MyAccountPage } from '@/features/user/pages/MyAccountPage';
import { CouriersPage } from '@/features/couriers/pages/CouriersPage';
import { ExplorePage } from '@/features/explore/pages/ExplorePage';
import { PublicStorePage } from '@/features/explore/pages/PublicStorePage';

/**
 * Árbol de rutas. La jerarquía aplica los wrappers en orden:
 * ProtectedRoute (exige sesión) → AdminLayout (shell con <Outlet/>) → página.
 * Las rutas del menú coinciden con las `key` de shared/config/navigation.
 * "/mi-cuenta" existe pero no está en la barra: se accede desde el avatar.
 */
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/explorar', element: <ExplorePage /> },
  { path: '/tienda/:id', element: <PublicStorePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/register-repartidor', element: <RegisterCourierPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/delivery', element: <DeliveryDashboardPage /> },
      {
        element: <AdminLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/mi-tienda', element: <MyStorePage /> },
          { path: '/productos', element: <ProductsListPage /> },
          { path: '/promociones', element: <PromotionsListPage /> },
          { path: '/repartidores', element: <CouriersPage /> },
          { path: '/planes', element: <PlansListPage /> },
          { path: '/mi-cuenta', element: <MyAccountPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

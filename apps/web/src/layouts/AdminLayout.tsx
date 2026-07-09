import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/shared/config/navigation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useCapabilities } from '@/features/subscriptions/hooks/useSubscription';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { CloudinaryImg } from '@/shared/ui/CloudinaryImg';
import logoNavy from '@/assets/icons/logo-caseritapp_navy.png';
import { SidebarLogout } from './SidebarProfile';

/**
 * Shell del panel: sidebar (marca + nav + perfil) + header (título + acciones) +
 * contenido con <Outlet/>. El item activo se deriva de la URL con startsWith, de
 * modo que las rutas anidadas mantengan resaltado su item padre.
 */
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const capabilities = useCapabilities();
  const { data: store } = useMyStore();

  // El panel de tienda no aplica a repartidores: van a su propio dashboard.
  if (user?.roles?.includes('delivery')) {
    return <Navigate to="/delivery" replace />;
  }

  // Oculta los items que exigen una capacidad que el plan vigente no incluye
  // (ej. "Promociones" solo en Pro/Premium). El backend igual protege las rutas.
  const visibleNavItems = navItems.filter(
    (i) => !i.requiresFeature || capabilities[i.requiresFeature],
  );

  const selectedKey =
    visibleNavItems.find((i) => location.pathname.startsWith(i.key))?.key ?? '/dashboard';
  const isAccountPage = location.pathname.startsWith('/mi-cuenta');
  const currentLabel = isAccountPage
    ? 'Mi perfil'
    : navItems.find((i) => i.key === selectedKey)?.label ?? 'Panel';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={cn(
          'flex flex-col bg-brand-900 text-white transition-all duration-200',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Marca */}
        <div
          className={cn(
            'flex h-16 items-center gap-2.5 px-4',
            collapsed && 'justify-center px-0',
          )}
        >
          <img
            src={logoNavy}
            alt="CaseritApp"
            className="size-9 shrink-0 rounded-lg ring-1 ring-white/10"
          />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">CaseritApp</span>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 px-2 py-2">
          {visibleNavItems.map((item) => {
            const active = item.key === selectedKey;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  collapsed && 'justify-center',
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <SidebarLogout collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-5">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Alternar barra lateral"
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
          <h1 className="text-lg font-semibold text-slate-800">{currentLabel}</h1>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Burbuja con el logo de la tienda. Usa el mismo useMyStore() que
                /mi-tienda (key ['my-store']), así cuando se actualiza el logo
                ahí, se refresca solo acá. Al presionar lleva a /mi-tienda. */}
            <button
              type="button"
              onClick={() => navigate('/mi-tienda')}
              aria-label="Mi tienda"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700 text-white">
                {store?.logo_url ? (
                  <CloudinaryImg
                    src={store.logo_url}
                    alt={store.name ?? 'Mi tienda'}
                    displayWidthPx={36}
                    className="size-full object-cover"
                  />
                ) : (
                  <Store className="size-4" strokeWidth={2} />
                )}
              </span>
              {!collapsed && (
                <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                  {store?.name ?? 'Mi tienda'}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

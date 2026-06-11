import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { DropdownMenu } from '@/shared/ui';
import { navItems } from '@/shared/config/navigation';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * Shell del panel: sidebar (marca + nav + usuario) + header + contenido con
 * <Outlet/>. El item activo se deriva de la URL con startsWith, de modo que las
 * rutas anidadas mantengan resaltado su item padre.
 */
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const selectedKey =
    navItems.find((i) => location.pathname.startsWith(i.key))?.key ?? '/dashboard';
  const currentLabel = navItems.find((i) => i.key === selectedKey)?.label ?? 'Panel';

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
        <div className="flex h-16 items-center gap-2.5 px-4">
          <ShoppingCart className="size-6 shrink-0" />
          {!collapsed && <span className="text-base font-semibold">CaseritApp</span>}
        </div>

        <nav className="flex-1 space-y-1 px-2 py-2">
          {navItems.map((item) => {
            const active = item.key === selectedKey;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-brand-700 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  collapsed && 'justify-center',
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-2">
          <DropdownMenu
            anchor="top start"
            trigger={
              <div
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2 py-2 text-slate-200 hover:bg-white/5',
                  collapsed && 'justify-center',
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700">
                  <User className="size-4" />
                </span>
                {!collapsed && (
                  <span className="truncate text-sm">{user?.name ?? 'Usuario'}</span>
                )}
              </div>
            }
            items={[
              {
                key: 'account',
                label: 'Mi cuenta',
                icon: <User className="size-4" />,
                onClick: () => navigate('/mi-cuenta'),
              },
              {
                key: 'logout',
                label: 'Cerrar sesión',
                icon: <LogOut className="size-4" />,
                danger: true,
                onClick: handleLogout,
              },
            ]}
          />
        </div>
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
          <h1 className="text-base font-semibold text-slate-800">{currentLabel}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

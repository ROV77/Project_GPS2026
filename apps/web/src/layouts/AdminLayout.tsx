import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Bell,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { cn } from '@/shared/lib/cn';
import { DropdownMenu } from '@/shared/ui';
import { navItems } from '@/shared/config/navigation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import logoNavy from '@/assets/icons/logo-caseritapp_navy.png';

/** Iniciales (1–2 letras) a partir del nombre; fallback "U". */
function getInitials(name?: string | null): string {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  const letters = parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '');
  return letters.toUpperCase();
}

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

  const selectedKey =
    navItems.find((i) => location.pathname.startsWith(i.key))?.key ?? '/dashboard';
  const currentLabel = navItems.find((i) => i.key === selectedKey)?.label ?? 'Panel';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = getInitials(user?.name);

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
          {navItems.map((item) => {
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
            {/* Notificaciones (estado vacío — pendiente de conectar a la API) */}
            <Popover className="relative">
              <PopoverButton
                aria-label="Notificaciones"
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Bell className="size-5" />
              </PopoverButton>
              <PopoverPanel
                anchor="bottom end"
                transition
                className="z-50 w-72 rounded-lg border border-slate-200 bg-white shadow-lg [--anchor-gap:0.5rem] transition duration-100 ease-out focus:outline-hidden data-[closed]:opacity-0"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
                </div>
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Bell className="size-5" />
                  </span>
                  <p className="text-sm text-slate-500">No tienes notificaciones nuevas.</p>
                </div>
              </PopoverPanel>
            </Popover>

            {/* Menú de usuario */}
            <DropdownMenu
              anchor="bottom end"
              trigger={
                <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                    {initials}
                  </span>
                  <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                    {user?.name ?? 'Usuario'}
                  </span>
                  <ChevronDown className="size-4 text-slate-400" />
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
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

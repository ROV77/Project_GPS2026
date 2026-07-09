import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLogoutProps {
  collapsed: boolean;
  onLogout: () => void;
}

/** Botón de cierre de sesión, anclado al pie del sidebar. */
export function SidebarLogout({ collapsed, onLogout }: SidebarLogoutProps) {
  return (
    <div className="border-t border-white/10 p-2">
      <button
        type="button"
        onClick={onLogout}
        title={collapsed ? 'Cerrar sesión' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
          collapsed && 'justify-center px-0',
        )}
      >
        <LogOut className="size-5 shrink-0" strokeWidth={2} />
        {!collapsed ? (
          <span className="truncate text-sm font-medium">Cerrar sesión</span>
        ) : null}
      </button>
    </div>
  );
}
import { cn } from '@/lib/utils';
import { getInitials } from '@/shared/lib/format';
import type { User } from '@/features/user/types';

interface SidebarProfileProps {
  account?: User | null;
  displayName?: string | null;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
}

/** Acceso al perfil del vendedor, anclado al pie del sidebar. */
export function SidebarProfile({
  account,
  displayName,
  collapsed,
  active,
  onClick,
}: SidebarProfileProps) {
  const name = account?.name ?? displayName ?? 'Mi perfil';
  const initials = getInitials(name) || 'U';

  return (
    <div className="border-t border-white/10 p-2">
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? 'Mi perfil' : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors',
          active
            ? 'bg-brand-700 text-white shadow-sm'
            : 'text-slate-300 hover:bg-white/5 hover:text-white',
          collapsed && 'justify-center px-0',
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700 text-xs font-semibold text-white ring-2 ring-white/15">
          {account?.avatar_url ? (
            <img src={account.avatar_url} alt={name} className="size-full object-cover" />
          ) : (
            initials
          )}
        </span>
        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{name}</span>
            <span className="block truncate text-xs text-slate-400">Mi perfil</span>
          </span>
        ) : null}
      </button>
    </div>
  );
}

import type { ReactNode } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { cn } from '@/shared/lib/cn';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

/** Menú contextual (Headless UI Menu), p. ej. el del avatar. */
export function DropdownMenu({
  trigger,
  items,
  anchor = 'bottom end',
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  anchor?: 'bottom end' | 'bottom start' | 'top end' | 'top start';
}) {
  return (
    <Menu>
      <MenuButton as="div" className="cursor-pointer">
        {trigger}
      </MenuButton>
      <MenuItems
        anchor={anchor}
        transition
        className={cn(
          'z-50 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg [--anchor-gap:0.5rem]',
          'transition duration-100 ease-out focus:outline-hidden data-[closed]:opacity-0',
        )}
      >
        {items.map((it) => (
          <MenuItem key={it.key}>
            <button
              onClick={it.onClick}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm data-[focus]:bg-slate-100',
                it.danger ? 'text-red-600' : 'text-slate-700',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

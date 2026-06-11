import { Switch as HSwitch } from '@headlessui/react';
import { cn } from '@/shared/lib/cn';

/** Toggle on/off (Headless UI Switch). */
export function Switch({
  checked,
  onChange,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <HSwitch
      checked={!!checked}
      onChange={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        checked ? 'bg-brand-700' : 'bg-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </HSwitch>
  );
}

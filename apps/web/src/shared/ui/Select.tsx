import { useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlBase, controlBorder } from './_control';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  allowClear?: boolean;
  loading?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Select con búsqueda sobre el Combobox accesible de Headless UI; el estilo es
 * 100% Tailwind. El value es el id como string (ver useCatalogOptions).
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecciona...',
  allowClear = false,
  loading = false,
  invalid = false,
  disabled = false,
  className,
}: SelectProps) {
  const [query, setQuery] = useState('');
  const filtered =
    query === ''
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const showClear = allowClear && value != null && value !== '';

  return (
    <Combobox
      value={value ?? null}
      onChange={(v: string | null) => onChange(v)}
      onClose={() => setQuery('')}
      disabled={disabled}
    >
      <div className={cn('relative', className)}>
        <ComboboxInput
          className={cn(
            controlBase,
            'h-10 truncate',
            showClear ? 'pr-14' : 'pr-9',
            controlBorder(invalid),
          )}
          placeholder={placeholder}
          displayValue={(val: string | null) =>
            options.find((o) => o.value === val)?.label ?? ''
          }
          onChange={(e) => setQuery(e.target.value)}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 flex items-center',
            showClear ? 'gap-0.5 pr-1' : 'justify-center',
            showClear ? 'w-14' : 'w-9',
          )}
        >
          {showClear && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="pointer-events-auto rounded p-0.5 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              <X className="size-4 shrink-0" />
            </button>
          )}
          <ComboboxButton className="pointer-events-auto rounded p-0.5 text-slate-400">
            <ChevronDown className="size-4 shrink-0" />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom"
          transition
          className={cn(
            'z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg',
            'transition duration-100 ease-out data-[closed]:opacity-0',
          )}
        >
          {loading && <div className="px-3 py-2 text-sm text-slate-400">Cargando...</div>}
          {!loading && filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">Sin resultados</div>
          )}
          {filtered.map((opt) => (
            <ComboboxOption
              key={opt.value}
              value={opt.value}
              className="group flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-slate-700 data-[focus]:bg-brand-50"
            >
              <span>{opt.label}</span>
              <Check className="size-4 text-brand-700 opacity-0 group-data-[selected]:opacity-100" />
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

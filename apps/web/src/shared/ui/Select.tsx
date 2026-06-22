import { useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import { ChevronsUpDown, Check, X } from 'lucide-react';
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

  return (
    <Combobox
      value={value ?? null}
      onChange={(v: string | null) => onChange(v)}
      onClose={() => setQuery('')}
      disabled={disabled}
    >
      <div className={cn('relative', className)}>
        <ComboboxInput
          className={cn(controlBase, 'h-10 pr-16', controlBorder(invalid))}
          placeholder={placeholder}
          displayValue={(val: string | null) =>
            options.find((o) => o.value === val)?.label ?? ''
          }
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {allowClear && value != null && value !== '' && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              <X className="size-4" />
            </button>
          )}
          <ComboboxButton className="text-slate-400">
            <ChevronsUpDown className="size-4" />
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

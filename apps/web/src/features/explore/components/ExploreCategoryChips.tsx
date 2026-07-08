import { cn } from '@/lib/utils';
import { Store, Croissant, Carrot, ShoppingBasket, Beef, Cake, Wine, LayoutGrid } from 'lucide-react';
import type { CategoryChipItem } from '../lib/filterStoresByCategory';

interface ExploreCategoryChipsProps {
  totalCount: number;
  chips: CategoryChipItem[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
  className?: string;
}

export function ExploreCategoryChips({
  totalCount,
  chips,
  selectedId,
  onSelect,
  className,
}: ExploreCategoryChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn('mb-5', className)}>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryChip
          label="Todas"
          count={totalCount}
          active={selectedId === null}
          onClick={() => onSelect(null)}
        />
        {chips.map((chip) => (
          <CategoryChip
            key={chip.id}
            label={chip.label}
            count={chip.count}
            active={selectedId === chip.id}
            onClick={() => onSelect(chip.id)}
          />
        ))}
      </div>
    </div>
  );
}

function getCategoryIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('panad')) return Croissant;
  if (l.includes('verdul') || l.includes('frut')) return Carrot;
  if (l.includes('almac')) return ShoppingBasket;
  if (l.includes('carni')) return Beef;
  if (l.includes('pastel')) return Cake;
  if (l.includes('botill') || l.includes('licor')) return Wine;
  if (l === 'todas') return LayoutGrid;
  return Store;
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = getCategoryIcon(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-base font-semibold transition-all hover:scale-[1.02]',
        active
          ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-600/20'
          : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50',
      )}
    >
      <Icon className={cn("size-5", active ? "text-brand-200" : "text-brand-500")} />
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
        )}
      >
        {count}
      </span>
    </button>
  );
}

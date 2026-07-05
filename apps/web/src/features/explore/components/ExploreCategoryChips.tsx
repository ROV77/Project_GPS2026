import { cn } from '@/lib/utils';
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-brand-700 text-white shadow-sm ring-1 ring-brand-600/50'
          : 'bg-white/10 text-slate-200 ring-1 ring-white/10 hover:bg-white/15',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-black/20 text-slate-300',
        )}
      >
        {count}
      </span>
    </button>
  );
}

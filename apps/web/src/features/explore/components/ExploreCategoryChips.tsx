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
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600',
        )}
      >
        {count}
      </span>
    </button>
  );
}

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/shared/ui/Select';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';
import { useCommunesByRegion } from '@/shared/hooks/useCommunesByRegion';

interface ExploreSearchBarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  regionId: string | null;
  onRegionChange: (value: string | null) => void;
  communeId: string | null;
  onCommuneChange: (value: string | null) => void;
  onSubmit: () => void;
  className?: string;
}

export function ExploreSearchBar({
  keyword,
  onKeywordChange,
  regionId,
  onRegionChange,
  communeId,
  onCommuneChange,
  onSubmit,
  className,
}: ExploreSearchBarProps) {
  const regions = useCatalogOptions('regions');
  const communes = useCommunesByRegion(regionId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur',
        className,
      )}
    >
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <Input
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={handleKeyDown}
          prefix={<Search className="size-5" />}
          placeholder="¿Qué buscas? Ej: panadería, sushi…"
          className="h-12 text-base"
        />

        <Select
          value={regionId}
          onChange={(v) => {
            onRegionChange(v);
            onCommuneChange(null);
          }}
          options={regions.options}
          placeholder="Región"
        />

        <Select
          value={communeId}
          onChange={onCommuneChange}
          options={communes.options}
          placeholder={regionId ? 'Comuna' : 'Elige región primero'}
          disabled={!regionId || communes.isLoading}
          loading={communes.isLoading}
        />

        <Button
          variant="primary"
          onClick={onSubmit}
          icon={<Search className="size-5" />}
          className="h-12 px-6 text-base"
        >
          Buscar
        </Button>
      </div>
    </div>
  );
}

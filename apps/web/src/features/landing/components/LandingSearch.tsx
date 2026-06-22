import { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/shared/ui/Select';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';
import { useCommunesByRegion } from '@/shared/hooks/useCommunesByRegion';

// Barra de búsqueda de la landing: palabra clave + región/comuna (sincronizadas
// con la BD). La región y la comuna van en cascada. El botón "Buscar" aún no
// dispara nada (la búsqueda real se cablea en otra entrega).
export function LandingSearch() {
  const [keyword, setKeyword] = useState('');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [communeId, setCommuneId] = useState<string | null>(null);

  const regions = useCatalogOptions('regions');
  const communes = useCommunesByRegion(regionId);

  const handleSearch = () => {
    // ponytail: búsqueda no cableada aún; solo confirma los filtros elegidos.
    toast.info('Búsqueda próximamente disponible');
  };

  return (
    <div className="rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          prefix={<Search className="size-5" />}
          placeholder="¿Qué buscas? Ej: panadería, sushi…"
          className="h-12 text-base"
        />

        <Select
          value={regionId}
          onChange={(v) => {
            setRegionId(v);
            setCommuneId(null);
          }}
          options={regions.options}
          placeholder="Región"
        />

        <Select
          value={communeId}
          onChange={setCommuneId}
          options={communes.options}
          placeholder={regionId ? 'Comuna' : 'Elige región primero'}
          disabled={!regionId || communes.isLoading}
          loading={communes.isLoading}
        />

        <Button
          variant="primary"
          onClick={handleSearch}
          icon={<Search className="size-5" />}
          className="h-12 px-6 text-base"
        >
          Buscar
        </Button>
      </div>
    </div>
  );
}

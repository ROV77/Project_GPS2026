import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const triggerClass =
    'data-[size=default]:h-12 w-full justify-between border-slate-200 bg-white text-slate-900 data-placeholder:text-slate-400';

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
          value={regionId ?? undefined}
          onValueChange={(v) => {
            setRegionId(v);
            setCommuneId(null);
          }}
        >
          <SelectTrigger className={triggerClass} aria-label="Región">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-slate-400" />
              <SelectValue placeholder="Región" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {regions.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={communeId ?? undefined}
          onValueChange={setCommuneId}
          disabled={!regionId || communes.isLoading}
        >
          <SelectTrigger className={triggerClass} aria-label="Comuna">
            <SelectValue
              placeholder={regionId ? 'Comuna' : 'Elige región primero'}
            />
          </SelectTrigger>
          <SelectContent>
            {communes.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

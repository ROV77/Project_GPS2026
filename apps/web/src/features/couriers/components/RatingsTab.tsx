import { useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { Table, type Column, Drawer, Button, Input } from '@/shared/ui';
import { useApplications, useCreateCourierRating } from '../hooks/useCouriers';
import { useMyStore } from '@/features/stores/hooks/useStores';
import type { CourierApplication } from '../types';
import { toast } from 'sonner';

export function RatingsTab() {
  const { data: myStore } = useMyStore();
  
  // Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [selectedCourierName, setSelectedCourierName] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const { mutate: createRating, isPending: submitting } = useCreateCourierRating();

  const { data: applicationsData, isLoading } = useApplications({ page: 1, store_id: myStore?.id, limit: 100 });
  
  const couriersList = useMemo(() => {
    const apps = Array.isArray(applicationsData) ? applicationsData : (applicationsData?.data ?? []);
    // Filtrar solo las aceptadas
    const acceptedApps = apps.filter((a: CourierApplication) => String(a.state_id) === '2');
    
    // Extraer repartidores únicos y calcular su promedio de estrellas general
    const uniqueCouriers = new Map<string, { id: string, name: string, email: string, averageRating: number }>();
    acceptedApps.forEach((a: CourierApplication) => {
      const courierIdStr = String(a.courier_id);
      if (!uniqueCouriers.has(courierIdStr)) {
        // Calcular promedio de estrellas si existe
        let avg = 0;
        const ratings = a.users?.courier_ratings ?? [];
        if (ratings.length > 0) {
          const sum = ratings.reduce((acc, r) => acc + (r.stars ?? 0), 0);
          avg = sum / ratings.length;
        }

        uniqueCouriers.set(courierIdStr, {
          id: courierIdStr,
          name: a.users?.name || `ID: ${courierIdStr}`,
          email: a.users?.email || 'Sin correo',
          averageRating: avg
        });
      }
    });

    return Array.from(uniqueCouriers.values());
  }, [applicationsData]);

  const openRatingModal = (courierId: string, name: string) => {
    setSelectedCourierId(courierId);
    setSelectedCourierName(name);
    setStars(5);
    setHoverStars(0);
    setComment('');
    setRatingModalOpen(true);
  };

  const handleRate = () => {
    if (!myStore?.id || !selectedCourierId) return;
    createRating(
      { store_id: Number(myStore.id), courier_id: Number(selectedCourierId), stars, comment },
      {
        onSuccess: () => {
          toast.success('Calificación guardada exitosamente');
          setRatingModalOpen(false);
        },
        onError: () => toast.error('Error al guardar calificación')
      }
    );
  };

  const columns: Column<typeof couriersList[0]>[] = [
    { key: 'name', header: 'Repartidor', dataIndex: 'name' },
    { key: 'email', header: 'Correo', dataIndex: 'email' },
    { 
      key: 'averageRating', 
      header: 'Promedio General', 
      render: (r) => (
        <div className="flex items-center gap-1 font-medium">
          {r.averageRating > 0 ? r.averageRating.toFixed(1) : 'S/N'} <Star className="size-4 text-yellow-500 fill-current" />
        </div>
      )
    },
    { 
      key: 'actions', 
      header: 'Acciones', 
      render: (r) => (
        <Button 
          variant="default" 
          size="sm"
          onClick={() => openRatingModal(r.id, r.name)}
        >
          Calificar
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-brand-900">Repartidores Actuales</h3>
      </div>

      <Table<typeof couriersList[0]>
        columns={columns}
        data={couriersList}
        loading={isLoading}
        emptyText="No hay repartidores trabajando contigo actualmente"
      />

      <Drawer
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title={`Calificar a ${selectedCourierName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estrellas
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => {
                const isActive = hoverStars > 0 ? s <= hoverStars : s <= stars;
                return (
                  <button
                    key={s}
                    onClick={() => setStars(s)}
                    onMouseEnter={() => setHoverStars(s)}
                    onMouseLeave={() => setHoverStars(0)}
                    className={`p-2 rounded-full transition-colors ${isActive ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                  >
                    <Star className={`size-8 transition-colors ${isActive ? 'fill-current' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej. Excelente disposición..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="default" onClick={() => setRatingModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRate} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Calificación'}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

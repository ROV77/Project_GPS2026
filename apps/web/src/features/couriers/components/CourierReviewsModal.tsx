import { Button, Drawer } from '@/shared/ui';
import { useCourierReviews } from '../hooks/useCouriers';
import { Star } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courierId: string | null;
  courierName: string;
}

export function CourierReviewsModal({ isOpen, onClose, courierId, courierName }: Props) {
  const { data: reviews, isLoading } = useCourierReviews(courierId);

  return (
    <Drawer 
      open={isOpen} 
      onClose={onClose}
      title={`Evaluaciones de ${courierName}`}
    >
      <div className="mt-4 space-y-4 pr-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando opiniones...</div>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-brand-900">{r.stores?.name || 'Tienda anónima'}</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`size-4 ${s <= (r.stars || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">
                {r.comment ? `"${r.comment}"` : 'Sin comentario'}
              </p>
              <div className="text-xs text-gray-400 mt-2 text-right">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aún no hay opiniones para este repartidor.
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <Button variant="default" onClick={onClose}>Cerrar</Button>
      </div>
    </Drawer>
  );
}

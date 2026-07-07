import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingSearch() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center">
      <Button
        onClick={() => navigate('/explorar')}
        size="lg"
        className="h-16 rounded-2xl px-12 text-lg shadow-lg hover:scale-105 transition-transform duration-300"
        variant="primary"
        icon={<Search className="size-6" />}
      >
        Buscar comercios
      </Button>
    </div>
  );
}

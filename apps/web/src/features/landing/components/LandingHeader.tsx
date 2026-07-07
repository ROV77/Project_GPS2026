import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/icons/logo_caseritapp3.webp';

interface LandingHeaderProps {
  /** `brand` = fondo navy para páginas de exploración. */
  variant?: 'light' | 'brand';
}

export function LandingHeader({ variant = 'light' }: LandingHeaderProps) {
  const isBrand = variant === 'brand';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-sm',
        isBrand
          ? 'border-b border-white/10 bg-brand-900/95 shadow-md'
          : 'border-b border-slate-200/80 bg-white/95 shadow-sm',
      )}
    >
      <div className="flex h-20 w-full items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logoUrl} alt="CaseritApp" className="h-16 w-auto sm:h-[4.5rem]" />
        </Link>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-4">
          <Link
            to="/login"
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition sm:px-5',
              isBrand
                ? 'border border-white/30 bg-white/10 text-white hover:bg-white/20'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
            )}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition sm:px-5',
              isBrand
                ? 'bg-white text-brand-900 hover:bg-white/90'
                : 'bg-slate-900 text-white hover:bg-slate-800',
            )}
          >
            Regístrate
          </Link>
        </nav>
      </div>
    </header>
  );
}

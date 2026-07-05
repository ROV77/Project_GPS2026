import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import logoUrl from '@/assets/icons/logo_caseritapp3.png';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="flex h-20 w-full items-center justify-between px-5 sm:px-8 md:px-12 lg:px-16">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logoUrl} alt="CaseritApp" className="h-16 w-auto sm:h-[4.5rem]" />
        </Link>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-4">
          <Link
            to="/register-repartidor"
            className="hidden items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 md:inline-flex"
          >
            Soy repartidor
            <ExternalLink className="size-3.5 opacity-70" />
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 sm:px-5"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:px-5"
          >
            Regístrate
          </Link>
        </nav>
      </div>
    </header>
  );
}

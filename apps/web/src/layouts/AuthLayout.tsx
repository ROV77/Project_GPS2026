import type { ReactNode } from 'react';
import { Package, LineChart, Tag, ShoppingCart } from 'lucide-react';

const features = [
  { icon: <Package className="size-5" />, text: 'Administra tu catálogo de productos' },
  { icon: <LineChart className="size-5" />, text: 'Sigue tus visitas y ventas en tiempo real' },
  { icon: <Tag className="size-5" />, text: 'Crea promociones para atraer clientes' },
];

/**
 * Layout de la zona pública (login): split-screen. El panel de marca (izquierda)
 * se oculta en móvil con `hidden md:flex`. El formulario llega por children.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-brand-700 to-brand-900 p-14 text-white md:flex">
        <div className="mb-10 flex items-center gap-2.5">
          <ShoppingCart className="size-7" />
          <span className="text-xl font-bold">CaseritApp</span>
        </div>
        <h1 className="max-w-md text-3xl font-bold leading-tight">
          Gestiona tu comercio en un solo lugar
        </h1>
        <p className="mb-8 mt-3 max-w-md text-slate-300">
          Catálogo, promociones y estadísticas de tu negocio, conecta con los vecinos de tu comuna.
        </p>
        <div className="flex flex-col gap-4">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-sky-300">{f.icon}</span>
              <span className="text-slate-200">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Package, LineChart, Tag, ArrowLeft } from "lucide-react";
import bgVideo from "@/assets/videos/15759309_960_540_60fps.mp4";
import logoUrl from "@/assets/icons/logo_caseritapp.png";

const features = [
  {
    icon: <Package className="size-5" />,
    text: "Administra tu catálogo de productos",
  },
  {
    icon: <LineChart className="size-5" />,
    text: "Sigue tus visitas y ventas en tiempo real",
  },
  {
    icon: <Tag className="size-5" />,
    text: "Crea promociones para atraer clientes",
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Botón volver a la landing: translúcido para verse sobre el video */}
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-black/40"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      {/* Panel de marca con video de fondo */}
      <div className="relative hidden flex-1 overflow-hidden text-white md:flex">
        {/* Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>

        {/* Overlay oscuro con tinte brand para legibilidad */}
        <div className="absolute inset-0 bg-brand-900/65 backdrop-blur-[2px]" />

        {/* Contenido encima del overlay */}
        <div className="relative z-10 flex flex-1 flex-col justify-center p-14">
          <h1 className="max-w-xl text-5xl font-bold leading-tight">
            Gestiona tu comercio en un solo lugar
          </h1>
          <p className="mb-10 mt-4 max-w-md text-lg text-slate-300">
            Catálogo, promociones y estadísticas de tu negocio, conecta con los
            vecinos de tu comuna.
          </p>
          <ul className="flex flex-col gap-5">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-sky-300 ring-1 ring-white/15">
                  {f.icon}
                </span>
                <span className="text-slate-100">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Logo grande a color, centrado sobre superficie blanca */}
          <img
            src={logoUrl}
            alt="CaseritApp"
            className="mx-auto mb-16 h-40 w-auto"
          />

          {children}

          {/* Pie compartido: CTA de registro + soporte */}
          <footer className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600">
              ¿Aún no vendes con nosotros?{" "}
              <a
                href="#"
                className="font-medium text-brand-700 hover:underline"
              >
                Crear cuenta
              </a>
            </p>
            <nav className="mt-3 flex gap-4 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600">
                Ayuda
              </a>
              <a href="#" className="hover:text-slate-600">
                Contacto
              </a>
              <a href="#" className="hover:text-slate-600">
                Términos
              </a>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  Store,
  LineChart,
  Megaphone,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicFooter } from '../components/PublicFooter';
import { LandingSearch } from '../components/LandingSearch';
import { LandingHeader } from '../components/LandingHeader';

import bgVideo from '@/assets/videos/entrega_pedido.mp4';
import imgHamburguesa from '@/assets/images/hamburguesa_con_papas.jpg';
import imgSushi from '@/assets/images/sushi.jpg';
import imgCallejera from '@/assets/images/entrega_comida_callejera.jpg';
import imgRopa from '@/assets/images/ropa_callejera.jpg';
import imgRepartidor from '@/assets/images/repartidor.jpg';

const benefits = [
  {
    icon: Store,
    title: 'Tu vitrina online',
    text: 'Publica tu catálogo y deja que los vecinos de tu comuna te encuentren.',
  },
  {
    icon: LineChart,
    title: 'Vende y mide',
    text: 'Sigue tus visitas y ventas en tiempo real desde un panel simple.',
  },
  {
    icon: Megaphone,
    title: 'Promociones',
    text: 'Crea ofertas para atraer más clientes y fidelizar a los de siempre.',
  },
  {
    icon: MapPin,
    title: 'Cerca de ti',
    text: 'Conectamos comercios locales con compradores de su misma zona.',
  },
];

const categoriesTop = [
  { img: imgHamburguesa, title: 'Comida rápida', tone: 'gold' as const },
  { img: imgSushi, title: 'Restaurantes', tone: 'red' as const },
  { img: imgCallejera, title: 'Comida callejera', tone: 'gold' as const },
];

const categoriesBottom = [
  { img: imgRopa, title: 'Moda y ropa', tone: 'blue' as const },
  { img: imgRepartidor, title: 'Delivery', tone: 'green' as const },
];

function CategoryCard({
  img,
  title,
  tone,
}: {
  img: string;
  title: string;
  tone: 'gold' | 'red' | 'blue' | 'green';
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
      <img
        src={img}
        alt={title}
        loading="lazy"
        className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
        <Badge tone={tone}>{title}</Badge>
        <span className="text-lg font-semibold text-white">{title}</span>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero con video de fondo */}
      <section className="relative isolate flex min-h-[calc(88vh-5rem)] flex-col overflow-hidden text-white">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-brand-900/70" />

        {/* Contenido del hero */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12 text-center">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Descubre los comercios de tu barrio
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200">
            Encuentra pymes, almacenes y emprendimientos cerca de ti. Y si tienes
            un negocio, súmalo gratis y llega a más vecinos.
          </p>

          <div className="mx-auto mt-10 w-full max-w-4xl">
            <LandingSearch />
          </div>
        </div>
      </section>

      {/* Por qué registrar tu negocio */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            ¿Por qué registrar tu negocio?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            CaseritApp es la plataforma que conecta a los comercios locales con los
            vecinos que quieren comprar cerca. Gestiona todo desde un solo lugar.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <Card 
                key={b.title} 
                className="group relative flex aspect-square cursor-default flex-col justify-start overflow-hidden p-6 pt-8 transition-all duration-500 hover:-translate-y-2 hover:border-brand-300 hover:shadow-2xl"
              >
                {/* Texto por encima */}
                <div className="relative z-10 max-w-[90%]">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{b.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{b.text}</p>
                </div>

                {/* Ícono gigante como fondo */}
                <div className="absolute -bottom-6 -right-6 z-0 text-brand-100/60 transition-transform duration-500 group-hover:scale-110 group-hover:text-brand-200/80">
                  <Icon className="size-36 lg:size-40" strokeWidth={1.5} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Qué encontrarás */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              ¿Qué encontrarás?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Desde comida hasta moda: explora las categorías más buscadas en tu
              zona.
            </p>
          </div>
          <div className="mt-12 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categoriesTop.map((c) => (
                <CategoryCard key={c.title} {...c} />
              ))}
            </div>
            <div className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-2">
              {categoriesBottom.map((c) => (
                <CategoryCard key={c.title} {...c} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-900 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold md:text-4xl">
            ¿Tienes un negocio? Súmalo hoy
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Crea tu cuenta en minutos y empieza a vender a los vecinos de tu comuna.
          </p>
          <Link
            to="/register"
            className={cn(
              buttonVariants({ variant: 'primary' }),
              'mt-8 inline-flex h-12 px-8 text-base',
            )}
          >
            Registra tu negocio
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

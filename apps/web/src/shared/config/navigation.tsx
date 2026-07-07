import type { ReactNode } from 'react';
import { Store, Package, Tag, CreditCard, LayoutDashboard, Bike } from 'lucide-react';

/**
 * Fuente única de la navegación del panel. La `key` ES la ruta: así el menú
 * deriva el item activo de la URL y navega sin mapas id↔ruta paralelos.
 *
 * Modelo de una sola tienda: el panel administra UN comercio, por eso "Mi Tienda"
 * (perfil único) reemplaza a una lista de tiendas. "Mi cuenta" no va aquí: se
 * accede desde el menú del avatar (ver AdminLayout).
 */
/** Capacidad de plan requerida para mostrar un item (ver PlanCapabilities). */
export type NavFeature = 'canViewStats' | 'canUsePromotions' | 'verifiedBadge' | 'prioritySupport';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Si está presente, el item solo se muestra cuando el plan incluye la capacidad. */
  requiresFeature?: NavFeature;
}

export const navItems: NavItem[] = [
  { key: '/mi-tienda', label: 'Mi Tienda', icon: <Store className="size-5" /> },
  { key: '/productos', label: 'Productos', icon: <Package className="size-5" /> },
  {
    key: '/promociones',
    label: 'Promociones',
    icon: <Tag className="size-5" />,
    requiresFeature: 'canUsePromotions',
  },
  { key: '/repartidores', label: 'Repartidores', icon: <Bike className="size-5" /> },
  { key: '/planes', label: 'Planes', icon: <CreditCard className="size-5" /> },
  { key: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" /> },
];

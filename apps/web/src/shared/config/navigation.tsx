import type { ReactNode } from 'react';
import { Store, Package, CreditCard, LayoutDashboard, Bike } from 'lucide-react';

/**
 * Fuente única de la navegación del panel. La `key` ES la ruta: así el menú
 * deriva el item activo de la URL y navega sin mapas id↔ruta paralelos.
 *
 * Modelo de una sola tienda: el panel administra UN comercio, por eso "Mi Tienda"
 * (perfil único) reemplaza a una lista de tiendas. "Mi cuenta" no va aquí: se
 * accede desde el menú del avatar (ver AdminLayout).
 */
export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export const navItems: NavItem[] = [
  { key: '/mi-tienda', label: 'Mi Tienda', icon: <Store className="size-5" /> },
  { key: '/productos', label: 'Productos', icon: <Package className="size-5" /> },
  { key: '/repartidores', label: 'Repartidores', icon: <Bike className="size-5" /> },
  { key: '/planes', label: 'Planes', icon: <CreditCard className="size-5" /> },
  { key: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" /> },
];

import type { ReactNode } from 'react';
import { useCapabilities } from '../hooks/useSubscription';
import { UpgradeBanner } from './UpgradeBanner';
import type { PlanCapabilities } from '../types';

/** Capacidades booleanas que puede exigir un gate (todas menos maxProducts). */
type GatedFeature = Exclude<keyof PlanCapabilities, 'maxProducts'>;

interface PlanGateProps {
  /** Capacidad requerida para ver el contenido. */
  feature: GatedFeature;
  children: ReactNode;
  /** Qué mostrar si el plan no la incluye. Por defecto, un aviso de mejora. */
  fallback?: ReactNode;
}

/**
 * Muestra `children` solo si el plan vigente incluye la capacidad; si no,
 * muestra el `fallback` (por defecto un <UpgradeBanner>). Es exclusivamente
 * experiencia de usuario: la autorización real la impone el backend
 * (requireFeature). Nunca decide comparando el nombre del plan.
 */
export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const capabilities = useCapabilities();
  if (capabilities[feature]) return <>{children}</>;
  return (
    <>
      {fallback ?? (
        <UpgradeBanner description="Esta función está disponible en un plan superior." />
      )}
    </>
  );
}

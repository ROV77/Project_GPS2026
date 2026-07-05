import { Check, Minus } from 'lucide-react';
import type { Plan } from '../types';

/** Todas las filas de la tabla comparativa, en orden lógico. */
const COMPARISON_FEATURES = [
  'Hasta 20 productos',
  'Perfil básico de tienda',
  'Productos ilimitados',
  'Ver estadísticas (dashboard)',
  'Promociones',
  'Verificación destacada',
  'Soporte prioritario',
] as const;

const PLAN_TIER: Record<string, number> = {
  Gratis: 0,
  Pro: 1,
  Premium: 2,
};

/** Beneficios por nivel; los planes superiores heredan los inferiores. */
const FEATURES_BY_TIER: Record<number, readonly string[]> = {
  0: ['Hasta 20 productos', 'Perfil básico de tienda'],
  1: ['Productos ilimitados', 'Ver estadísticas (dashboard)', 'Promociones'],
  2: ['Verificación destacada', 'Soporte prioritario'],
};

function planIncludesFeature(plan: Plan, feature: string): boolean {
  const features = plan.features ?? [];
  if (features.includes(feature)) return true;

  const tier = PLAN_TIER[plan.name];
  if (tier === undefined) return false;

  for (let t = 0; t <= tier; t++) {
    if (FEATURES_BY_TIER[t]?.includes(feature)) return true;
  }
  return false;
}

export function PlanComparisonTable({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Comparar planes</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Revisa qué incluye cada plan antes de contratar.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Beneficio</th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-4 py-3 text-center font-semibold text-foreground">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((feature) => (
              <tr key={feature} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-foreground">{feature}</td>
                {plans.map((plan) => {
                  const included = planIncludesFeature(plan, feature);
                  return (
                    <td key={plan.id} className="px-4 py-3 text-center">
                      {included ? (
                        <Check className="mx-auto size-4 text-emerald-600" strokeWidth={2.5} />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/40" strokeWidth={2} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

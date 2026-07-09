# Implementación — Apartado Premium (verificación destacada + soporte prioritario)

Registro del trabajo realizado para la **Etapa 4 (Premium)** del plan de gating
(ver [`plan-trabajo-gating-planes.md`](./plan-trabajo-gating-planes.md)).
Documenta **qué** se hizo, **qué archivos** se tocaron y **por qué**.

---

## 1. Resumen en una frase

Una tienda con plan **Premium** obtiene dos ventajas exclusivas: el **badge de
verificado** (✔️) que ven los clientes, y una sección de **soporte prioritario**
en el panel. Ambas se **calculan desde el plan** (no se guardan): si el plan se
cancela o vence, la ventaja desaparece sola.

---

## 2. Decisiones de producto tomadas

| Decisión | Elección |
|---|---|
| ¿Cómo se otorga la verificación? | **Calculada desde el plan** (compute, don't store), no por un flujo de admin. |
| ¿Qué planes muestran el badge? | **Solo Premium** (no Pro). |
| Regla del badge | `verified efectivo = stores.verified (manual) OR plan Premium vigente`. |
| ¿Soporte prioritario ahora? | **Sí**, versión mínima: sección gateada + canal de contacto. |

> La verificación **manual** (`stores.verified`) se conserva: sirve para tiendas
> que el equipo verifique a mano, independiente del plan. Premium solo **agrega**
> el badge; no puede quitar uno puesto a mano.

---

## 3. Verificación destacada (backend)

La verdad se calcula al leer, combinando la columna manual con el plan vigente.

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/api/src/services/plan-access.service.ts`](../apps/api/src/services/plan-access.service.ts) | ✏️ Modificado | Nueva `findVerifiedByPlanStoreIds(storeIds)`: de un conjunto de tiendas, cuáles muestran el badge **por su plan Premium activo y vigente**. Deriva los planes que dan badge desde la misma fuente única (`getPlanCapabilities`). |
| [`apps/api/src/repositories/store.repository.ts`](../apps/api/src/repositories/store.repository.ts) | ✏️ Modificado | En la **búsqueda** (`findStoresWithRating`) y la **ficha** (`findStoreByIdWithRating`): `verified = manual OR verificado por plan`. Así mobile y web pública muestran el badge **sin tocarse**. |

**Por qué así:** es el mismo espíritu "compute, don't store" que el proyecto ya
usa para el plan Gratis implícito y el vencimiento. No hay cron ni columna que
mantener: el badge refleja el estado del plan en cada consulta.

---

## 4. Frontend web (panel del vendedor)

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/web/src/features/subscriptions/components/PrioritySupportCard.tsx`](../apps/web/src/features/subscriptions/components/PrioritySupportCard.tsx) | 🆕 Nuevo | Sección **"Soporte prioritario"** gateada con `PlanGate feature="prioritySupport"` (visible solo en Premium; fallback vacío, sin upsell). Botón que abre un canal de contacto (WhatsApp). |
| [`apps/web/src/features/user/pages/MyAccountPage.tsx`](../apps/web/src/features/user/pages/MyAccountPage.tsx) | ✏️ Modificado | Renderiza `<PrioritySupportCard />` bajo el perfil. |
| [`apps/web/src/features/stores/pages/MyStorePage.tsx`](../apps/web/src/features/stores/pages/MyStorePage.tsx) | ✏️ Modificado | El **preview** de la tienda ahora usa `capabilities.verifiedBadge` (solo Premium) en vez del helper viejo. |
| `apps/web/src/features/plans/lib/planBenefits.ts` | 🗑️ Eliminado | Tenía `planShowsVerifiedBadge` que daba el badge a **cualquier plan pago (Pro+)** — inconsistente con "solo Premium". Se reemplazó por la capacidad. |

---

## 5. Mobile (app cliente)

**Sin cambios de código.** El badge de verificado ya se muestra leyendo
`store.verified` de la API ([StoreCard](../apps/mobile/src/components/StoreCard.tsx),
[StoreDetailSheet](../apps/mobile/src/components/StoreDetailSheet.tsx),
[ficha](../apps/mobile/src/app/(public)/store/[id].tsx)). Como el backend ahora
devuelve ese campo **ya calculado** (manual OR Premium), el mobile refleja el
badge de las tiendas Premium automáticamente.

> El soporte prioritario es del **vendedor** (panel web), no del cliente, por eso
> no aplica al mobile.

---

## 6. Datos de ejemplo (seed)

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/api/prisma/seed.ts`](../apps/api/prisma/seed.ts) | ✏️ Modificado | "Panadería del Norte" (demo2) pasó a `verified: false`, para que sea un **ejemplo limpio de Premium**: sin badge en Gratis, con badge solo si contrata Premium. |

> Otras tiendas del seed siguen **verificadas a mano** a propósito (ej. "Panadería
> La Esquina" y varias del Biobío): esas muestran el badge siempre, tengan Premium
> o no.

---

## 7. Reglas de negocio resueltas

- **Badge efectivo** = `manual OR Premium activo`. Con que uno sea verdadero, se
  muestra.
- **Cancelar Premium** → el badge "por plan" desaparece en la siguiente lectura
  (la suscripción queda `canceled`, deja de estar `active`).
- **Vencimiento de Premium** → igual: el filtro exige `expires_at > ahora`, así
  que al vencer el mes el badge se cae solo.
- **Verificación manual** → persiste pase lo que pase con el plan (Premium solo
  agrega, no quita el badge manual).
- **Soporte prioritario** → acceso gateado a Premium; la "prioridad" es
  **operativa** (el equipo responde primero por ese canal), no una cola en código.

---

## 8. Cómo se verificó

- **Backend en runtime (con `curl` + `set-plan`):**
  - Tienda `verified=false` puesta en **Premium** → la API devuelve `verified: true`. ✅
  - Al **cancelar** (volver a Gratis) → `verified: false`. ✅
  - Tienda `verified=false` en Gratis → `verified: false` (control). ✅
  - Tiendas verificadas a mano → `verified: true` intacto. ✅
- **Typecheck (`tsc --noEmit`):** API y web → sin errores. ✅

---

## 9. Base de capacidades sobre la que se apoya (Etapa 0)

Premium reutiliza el sistema de capacidades ya existente:
- [`plan-access.service.ts`](../apps/api/src/services/plan-access.service.ts) →
  `getPlanCapabilities` ya definía `verifiedBadge` y `prioritySupport` como
  `true` **solo en Premium**.
- [`requireFeature.ts`](../apps/api/src/middlewares/requireFeature.ts),
  [`PlanGate`](../apps/web/src/features/subscriptions/components/PlanGate.tsx),
  `useCapabilities` y `NavFeature` ya soportaban esas dos capacidades.

Por eso la Etapa 4 fue **poco código**: la infraestructura estaba lista; solo
faltaba *conectar* el plan con el badge que ven los clientes y agregar la sección
de soporte.

---

## 10. Notas y pendientes

- **Canal de soporte placeholder:** `SUPPORT_WHATSAPP` en
  [`PrioritySupportCard.tsx`](../apps/web/src/features/subscriptions/components/PrioritySupportCard.tsx)
  usa un número de ejemplo (`wa.me/56912345678`). **Reemplazar** por el
  WhatsApp/correo real del equipo.
- **Costo de consulta:** `findVerifiedByPlanStoreIds` agrega una consulta por
  página en la búsqueda (batch, no N+1). Suficiente para el MVP; si escalara,
  se podría cachear o materializar.
- **Herramienta de dev:** [`apps/api/set-plan.ts`](../apps/api/set-plan.ts)
  (`tsx set-plan.ts <email> Premium`) sirve para probar el badge sin pagar.

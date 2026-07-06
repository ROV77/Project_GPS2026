# Plan de trabajo — Gating de planes (foco: plan Pro)

> Documento de planificación para implementar el **control de acceso por plan**
> (*gating*) descrito en la §13 de [`planes-y-suscripciones.md`](./planes-y-suscripciones.md).
> El módulo de cobro ya está completo (contratar, pagar, cancelar, cambiar de
> plan). Lo que falta es que **los planes signifiquen algo**: hoy Gratis, Pro y
> Premium desbloquean exactamente lo mismo.
>
> Este plan se enfoca en el **plan Pro**: primero **visualizar** sus funciones
> exclusivas en el panel, y luego **implementar** los candados de las funciones
> que ya existen. Promociones (una capacidad Pro que hay que **construir desde
> cero**) y las capacidades **Premium** quedan como etapas posteriores, a
> planificar en su propio detalle.

---

## Estado de avance (actualizado)

> **Etapas 0 a 4 implementadas y verificadas** (typecheck API/web/mobile +
> backend probado end-to-end con `curl`). Detalle de archivos por feature en
> [`implementacion-promociones.md`](./implementacion-promociones.md) (Etapa 3) y
> [`implementacion-premium.md`](./implementacion-premium.md) (Etapa 4).

| Etapa | Estado |
|---|---|
| 0 · Fundamentos (capacidades) | ✅ Hecha — se eligió la **opción B** (helper `getPlanCapabilities`, sin migración) |
| 1 · Visualización | ✅ Hecha — falta solo el badge de plan en el sidebar (menor) |
| 2 · Candados Pro (backend) | ✅ Hecha — límite de productos + estadísticas responden `403` |
| 3 · Promociones | ✅ Hecha — feature completa; se **rediseñó** el modelo a *promo por producto* |
| 4 · Premium (verificación + soporte) | ✅ Hecha — verificado **calculado desde el plan** (solo Premium) + soporte prioritario gateado |

---

## 1. Objetivo y criterio de éxito

**Objetivo:** que al contratar Pro el vendedor obtenga capacidades reales que en
Gratis no tiene, y que en Gratis esas capacidades se **muestren bloqueadas** con
una invitación a mejorar el plan.

**Criterio de éxito (Pro):**
1. Una tienda en **Gratis** ve en el panel qué gana con Pro (estadísticas y el
   límite de productos), en estado *bloqueado/limitado*, con CTA "Mejora a Pro".
2. Una tienda en **Pro** ve esas mismas secciones *desbloqueadas y funcionando*.
3. El bloqueo es **real en el backend** (no solo cosmético): llamar la API con
   `curl` saltándose la UI también se rechaza con `403`.

---

## 2. Alcance

### Entra en este plan
| Capacidad | Plan | Estado hoy | Trabajo |
|---|---|---|---|
| **Límite de productos** (Gratis: 20 · Pro/Premium: ∞) | Pro | El dato existe (`plans.max_products`), el `create()` lo ignora | Candado + UI de límite |
| **Estadísticas / dashboard** | Pro | El endpoint `GET /stores/:id/stats` funciona para todos | Candado + ocultar/bloquear UI |

### Se planifica pero se ejecuta después
| Capacidad | Plan | Estado |
|---|---|---|
| **Promociones** | Pro | ✅ **Ya implementada** (Etapa 3): se rediseñó el modelo a *promo por producto* + CRUD web + vista mobile. Ver [`implementacion-promociones.md`](./implementacion-promociones.md). |
| **Verificación destacada** | Premium | ✅ **Ya implementada** (Etapa 4): badge **calculado desde el plan** (solo Premium) + verificación manual. Ver [`implementacion-premium.md`](./implementacion-premium.md). |
| **Soporte prioritario** | Premium | ✅ **Ya implementado** (Etapa 4): sección gateada a Premium con canal de contacto. |

### Fuera de alcance
- Cambios al flujo de cobro/MercadoPago (ya funciona).
- Prorrateo/reembolso al bajar de plan (decisión MVP: cambios inmediatos sin reembolso).

---

## 3. Mapa de capacidades por plan (fuente: seed real)

Tomado de [`apps/api/prisma/seed.ts`](../apps/api/prisma/seed.ts) (líneas 206–247):

| Capacidad | Gratis | Pro | Premium | Dónde vive el dato hoy |
|---|:---:|:---:|:---:|---|
| Máx. de productos | 20 | ∞ | ∞ | `plans.max_products` (columna real, `null` = ilimitado) |
| Ver estadísticas | ❌ | ✅ | ✅ | Solo texto en `plans.features` |
| Promociones | ❌ | ✅ | ✅ | Solo texto en `plans.features` (+ modelo `promotions` sin usar) |
| Verificación destacada | ❌ | ❌ | ✅ | Columna `stores.verified` (existe) |
| Soporte prioritario | ❌ | ❌ | ✅ | Solo texto en `plans.features` |

Precios: Gratis `$0`, Pro `$9.990`, Premium `$19.990` (mensual).

---

## 4. Principios de diseño (no negociables)

1. **El candado va en el backend.** El frontend solo mejora la UX (oculta,
   deshabilita, muestra "Mejora a Pro"). La autorización real se hace en el
   service/middleware que ejecuta la acción. Ocultar un botón **no** es
   seguridad (§13.2 del doc base).
2. **Fuente única de verdad:** el plan vigente se obtiene siempre de
   [`subscriptionsService.getCurrentSubscription(storeId)`](../apps/api/src/services/subscriptions.service.ts#L71).
   No se inventa un mecanismo nuevo; se consulta el que ya existe.
3. **Capacidades como claves estables, no como texto.** Nunca se decide gating
   comparando contra el string libre de `plans.features` ni contra el **nombre**
   del plan (`plan.name === 'Pro'`). Se compara contra una **capacidad
   estructurada** (`canViewStats`, `maxProducts`, …). Ver Etapa 0.
4. **Extraer al segundo uso.** La pregunta "¿el plan permite X?" aparece más de
   una vez → vive en **un** helper (`plan-access.service.ts`), no repetida.

---

## 5. Arquitectura objetivo

### 5.1 Flujo de una acción restringida (backend)

```
Request autenticada (requireAuth + withStore → res.locals.storeId)
        │
        ▼
Middleware / service de gating
  getCurrentSubscription(storeId)  ──►  plan vigente
        │
        ▼
getPlanCapabilities(plan)  ──►  { maxProducts, canViewStats, canUsePromotions, ... }
        │
   ┌────┴─────────────────────────┐
   │ ¿la capacidad permite esto?  │
   └────┬───────────────┬─────────┘
        │ sí            │ no
        ▼               ▼
   next() / acción   HttpError(403, "Tu plan no incluye ...")
```

### 5.2 Flujo en el frontend (panel web)

```
useMySubscription()  ──►  Subscription { plan, capabilities }
        │
        ▼
<PlanGate feature="canViewStats">
   ├─ permitido  → renderiza la sección real (Estadísticas)
   └─ bloqueado  → renderiza <UpgradeBanner plan="Pro" />
```

### 5.3 Archivos NUEVOS que introduce el plan

```
apps/api/src/
  services/plan-access.service.ts     ← getPlanCapabilities() + assertCanAddProduct()
  middlewares/requireFeature.ts       ← requireFeature('canViewStats') para rutas

apps/web/src/features/subscriptions/
  lib/capabilities.ts                 ← normaliza plan → capabilities (o lo trae la API)
  components/PlanGate.tsx             ← envoltorio que muestra hijo o UpgradeBanner
  components/UpgradeBanner.tsx        ← CTA "Mejora a Pro" reutilizable

(Etapa 3 — Promociones, feature nueva:)
packages/validations/src/promotions.schema.ts
apps/api/src/services/promotions.service.ts
apps/api/src/controllers/promotions.controller.ts
apps/api/src/routes/promotions.routes.ts
apps/web/src/features/promotions/{types.ts, api/, hooks/, pages/, components/}
```

---

## 6. Etapas del plan

Las etapas son **progresivas**: cada una se apoya en la anterior. El orden
respeta tu criterio (**primero visualizar, después implementar**), con una etapa
0 de fundamentos que habilita todo lo demás.

```
Etapa 0  Fundamentos        →  fuente única de capacidades (back + front)
Etapa 1  Visualización      →  el panel refleja el plan (UI, sin candado real)
Etapa 2  Candados Pro       →  enforcement real en backend (productos + stats)
Etapa 3  Promociones        →  feature nueva completa (a planear en detalle)
Etapa 4  Premium            →  verificación + soporte (decisión de producto)
```

---

### Etapa 0 — Fundamentos: la fuente única de capacidades

**Objetivo:** que exista **un solo lugar** (en backend y en frontend) que
responda "¿qué permite el plan vigente de esta tienda?". Sin esto, las etapas 1
y 2 terminarían comparando por nombre de plan (frágil).

**Decisión a tomar (capacidades estructuradas).** Elegir una de:
- **(A) Recomendada — columnas booleanas en `plans`.** Agregar
  `can_view_stats`, `can_use_promotions`, `verified_badge`, `priority_support`
  (Boolean) vía migración de Prisma + poblarlas en el seed. Ventaja: la verdad
  vive en la base, el candado compara contra un booleano estable. Como
  `getCurrentSubscription` ya devuelve `plan: row.plans`, esas columnas viajan
  solas al frontend.
- **(B) MVP rápida — derivar en un helper, sin migración.** `getPlanCapabilities(plan)`
  mapea el plan a capacidades usando datos existentes (`max_products` real + un
  mapa por nombre **dentro del helper**). Más rápida, sin tocar la base, pero
  el acoplamiento al nombre queda encapsulado en un solo archivo (aceptable) en
  vez de disperso.

> Recomendación: **(A)** si se busca el resultado "como corresponde" (salda la
> deuda técnica de §13.4); **(B)** si se prioriza velocidad para el MVP. En ambos
> casos el resto del plan es idéntico porque todos consumen `getPlanCapabilities`.
>
> ✅ **Decisión tomada: opción (B).** Las capacidades se derivan en un único helper
> ([`plan-access.service.ts`](../apps/api/src/services/plan-access.service.ts)),
> sin migración. Queda con la misma forma que tendría (A), así migrar a columnas
> booleanas después es trivial.

**Tareas — backend**
- [ ] `apps/api/src/services/plan-access.service.ts` (nuevo):
  - `getPlanCapabilities(plan)` → `{ maxProducts: number|null, canViewStats: boolean, canUsePromotions: boolean, verifiedBadge: boolean, prioritySupport: boolean }`.
  - `assertCanAddProduct(storeId)` → usa `getCurrentSubscription` + cuenta productos; lanza `HttpError(403, ...)` si excede. (Se **usa** en Etapa 2.)
- [ ] `apps/api/src/middlewares/requireFeature.ts` (nuevo): middleware
  `requireFeature(cap: keyof Capabilities)` que lee `res.locals.storeId`,
  resuelve capacidades y hace `next()` o `403`. (Se **usa** en Etapa 2.)
- [ ] (Solo opción A) migración Prisma + actualizar
  [`seed.ts`](../apps/api/prisma/seed.ts#L206) con las nuevas columnas.
- [ ] Exponer capacidades al cliente: incluir el objeto `capabilities` (o las
  columnas) en la respuesta de `GET /subscriptions/me`
  ([`subscriptions.service.ts` → `toResponse`](../apps/api/src/services/subscriptions.service.ts#L32)).

**Tareas — frontend**
- [ ] `apps/web/src/features/subscriptions/lib/capabilities.ts` (nuevo): tipo
  `Capabilities` + normalización de la respuesta de la API (idealmente ya viene
  del backend; el front solo la tipa).
- [ ] Extender `Subscription` en
  [`features/subscriptions/types.ts`](../apps/web/src/features/subscriptions/types.ts)
  con `capabilities`.
- [ ] Hook conveniente: `useCapabilities()` (envuelve `useMySubscription`), o
  exponer `capabilities` desde el mismo hook.

**Criterios de aceptación**
- Existe **un** helper backend y **una** forma frontend de preguntar por una
  capacidad. Ningún componente ni ruta compara por `plan.name`.
- `GET /subscriptions/me` devuelve las capacidades del plan vigente.

**Cómo probar**
- `curl` autenticado a `/api/subscriptions/me` con una tienda en Gratis vs. una
  en Pro → las capacidades cambian. (Ver §7 para poner una tienda en Pro sin pagar.)

---

### Etapa 1 — Visualización: el panel refleja el plan

**Objetivo:** cumplir el "**que se logren visualizar**": el vendedor en Gratis
ve las funciones Pro, bloqueadas y con CTA; en Pro las ve desbloqueadas. **Sin
enforcement de backend todavía** (eso es Etapa 2); esta etapa es pura UX.

**Tareas — componentes reutilizables**
- [ ] `features/subscriptions/components/UpgradeBanner.tsx` (nuevo): tarjeta/CTA
  "Mejora a Pro" (con enlace a `/planes`). Reutiliza estilos existentes.
- [ ] `features/subscriptions/components/PlanGate.tsx` (nuevo): recibe
  `feature` (o `require`) + `children`; si la capacidad está, renderiza
  `children`; si no, renderiza `fallback` (por defecto `<UpgradeBanner/>` o un
  overlay bloqueado).

**Tareas — Estadísticas (dashboard)**
- [ ] En [`features/dashboard/pages/DashboardPage.tsx`](../apps/web/src/features/dashboard/pages/DashboardPage.tsx)
  envolver el panel de estadísticas
  ([`DashboardStatsCards.tsx`](../apps/web/src/features/dashboard/components/DashboardStatsCards.tsx))
  con `<PlanGate feature="canViewStats">`. En Gratis: overlay/blur + "Mejora a Pro".

**Tareas — Límite de productos**
- [ ] En [`features/products/pages/ProductsListPage.tsx`](../apps/web/src/features/products/pages/ProductsListPage.tsx):
  - Mostrar contador **"X / 20 productos"** cuando el plan es limitado
    (`capabilities.maxProducts !== null`); ocultarlo/"∞" cuando es ilimitado.
  - Al llegar al límite: **deshabilitar** el botón "Nuevo producto" + tooltip
    "Alcanzaste el límite de tu plan. Mejora a Pro para productos ilimitados".
  - Aviso "estás sobre el límite" si la tienda quedó sobre el tope tras un
    downgrade (ver caso borde en Etapa 2).

**Tareas — Entradas de navegación**
- [ ] Mostrar el **plan actual** de forma visible (badge en
  [`layouts/SidebarProfile.tsx`](../apps/web/src/layouts/SidebarProfile.tsx) o
  header) con enlace a `/planes`.
- [ ] (Opcional, teaser) Sección "Promociones (Pro)" bloqueada que anticipa la
  Etapa 3.

**Criterios de aceptación**
- Con una tienda en Gratis: estadísticas bloqueadas + contador "X / 20" + botón
  de crear deshabilitado al tope.
- Con una tienda en Pro: estadísticas visibles + productos "ilimitados" + botón
  siempre habilitado.
- Todo condicionado por `capabilities` (Etapa 0), **nunca** por `plan.name`.

**Cómo probar**
- Alternar el plan de la tienda demo (§7) y recargar el panel; la UI cambia sin
  tocar código.

---

### Etapa 2 — Candados Pro reales (enforcement en backend)

**Objetivo:** convertir la visualización en **seguridad**. Aquí se implementan
las funciones Pro que **ya tienen su funcionalidad** (solo faltaba el candado).

**Tarea 2.1 — Límite de productos**
- [ ] En [`products.routes.ts` → `create()`](../apps/api/src/routes/products.routes.ts#L104),
  **antes** de `crud.create(req, res)`, llamar
  `await assertCanAddProduct(storeId)` (helper de Etapa 0). Si excede → `403`
  con mensaje `Tu plan permite hasta 20 productos.`.
- [ ] **Caso borde (decisión de producto):** tienda con 50 productos creados en
  Pro que **baja a Gratis** (límite 20). Regla recomendada: **no borrar** nada;
  solo **bloquear crear nuevos** hasta que baje de 20 por su cuenta. El candado
  se evalúa *al crear*, no retroactivamente. Reflejarlo en la UI ("estás sobre
  el límite de tu plan").
- [ ] El frontend (Etapa 1) ya deshabilita el botón; esto es la **defensa real**
  detrás.

**Tarea 2.2 — Estadísticas**
- [ ] Aplicar `requireFeature('canViewStats')` (middleware de Etapa 0) a la ruta
  [`GET /stores/:id/stats`](../apps/api/src/routes/stores.routes.ts#L70). En
  Gratis → `403`. El endpoint y su lógica
  ([`getStoreStats`](../apps/api/src/controllers/store.controller.ts#L27)) no
  cambian.
- [ ] Verificar que el frontend maneje el `403` con gracia (además del gate de UI).

**Criterios de aceptación**
- `POST /api/products` con una tienda Gratis que ya tiene 20 productos → `403`
  (probado con `curl`, sin pasar por la UI).
- `GET /api/stores/:id/stats` con tienda Gratis → `403`; con Pro → `200`.
- Los mensajes de error son claros y en español.

**Cómo probar (paso a paso)**
1. Tienda demo en Gratis con 20 productos → intentar crear el 21 por `curl` → `403`.
2. Poner la tienda en Pro (§7) → crear el 21 → `200`.
3. `curl` a `/stores/:id/stats` en Gratis (`403`) y en Pro (`200`).

---

### Etapa 3 — Promociones: la feature nueva ✅ IMPLEMENTADA

**Objetivo (cumplido):** construir Promociones **desde cero** (backend + web +
mobile) y gatearla para Pro+. El detalle completo de archivos está en
[`implementacion-promociones.md`](./implementacion-promociones.md); acá el resumen.

**Decisión de diseño clave:** en vez de la promo "banner suelto" que sugería el
modelo original, se **rediseñó** la tabla `promotions` para que sea una **promo
sobre un producto**: se agregó `product_id`, `is_active` y se dejó
`discount_type` como `'percentage' | '2x1' | '3x2'`. Se **eliminaron** `title`,
`description` e `image_url` (los aporta el producto). Migración aplicada.

**Backend** ✅
- [x] `packages/validations/src/promotions.schema.ts` + export en `index.ts`.
- [x] `apps/api/src/services/promotions.service.ts` (CRUD + regla "una activa por
  producto" → `409`, pertenencia del producto, normalización del valor).
- [x] `apps/api/src/controllers/promotions.controller.ts`.
- [x] `apps/api/src/routes/promotions.routes.ts` (`requireAuth` + `withStore` +
  `requireFeature('canUsePromotions')`) + montado en `routes/index.ts`.
- [x] `store.repository.ts`: el catálogo público adjunta la promo vigente (mobile).

**Frontend web** ✅
- [x] `apps/web/src/features/promotions/` (types, api, hooks, lib, página + drawer).
- [x] Ítem de menú **"Promociones"** gateado por `canUsePromotions` + ruta `/promociones`.

**Mobile** ✅
- [x] Sección **"Promociones" primero** en la ficha de tienda + badge y precio con
  descuento en `ProductCard`.

**Reglas resueltas:** una promo activa por producto, vigencia opcional
(fuera de rango no se muestra), estado activa/inactiva, precio mostrado como
texto, validación de % (1–100) / tipo / pertenencia.

---

### Etapa 4 — Premium: verificación destacada + soporte prioritario ✅ IMPLEMENTADA

**Objetivo (cumplido):** las capacidades exclusivas de Premium. El detalle
completo está en [`implementacion-premium.md`](./implementacion-premium.md); acá
el resumen.

**Decisiones de producto tomadas:**
- Verificación **calculada desde el plan** (compute, don't store), no por admin.
- Badge **solo Premium** (no Pro). Regla: `verified = manual OR Premium vigente`.
- Soporte prioritario: **sí**, versión mínima (sección gateada + canal).

**Verificación destacada** ✅
- [x] `plan-access.service.ts` → `findVerifiedByPlanStoreIds()` (qué tiendas
  tienen badge por su plan Premium activo/vigente).
- [x] `store.repository.ts` → `verified = manual OR plan` en búsqueda y ficha
  (mobile y web pública lo muestran **sin cambios**).
- [x] Web `MyStorePage` usa `capabilities.verifiedBadge`; se **eliminó** el helper
  inconsistente `planBenefits.ts` (daba badge a Pro+).
- [x] Comportamiento: cancelar/vencer Premium **quita** el badge por plan; la
  verificación manual persiste.

**Soporte prioritario** ✅
- [x] `PrioritySupportCard.tsx` (gateada a `prioritySupport`) en `MyAccountPage`.
  La "prioridad" es operativa; el canal es un WhatsApp **placeholder** a
  reemplazar.

---

## 7. Cómo poner una tienda en Pro para probar (sin pagar)

El gating no se puede probar sin una tienda que **esté** en Pro, y el flujo de
pago real necesita MercadoPago + ngrok (ver §12 del doc base). Para desarrollo,
alternativas de menor a mayor "parche":

1. **Insertar una suscripción activa a mano** (SQL o `prisma studio`): una fila
   en `subscriptions` con `store_id` de la tienda demo, `plan_id` del plan Pro,
   `state_id` = `active`, `starts_at = now()`, `expires_at = now() + 1 mes`.
   `getCurrentSubscription` la tomará como plan vigente.
2. **Script de dev** (`apps/api/`): un pequeño script tipo `set-plan.ts` que
   reciba email de tienda + nombre de plan y cree/actualice la suscripción
   activa. Reutilizable por todo el equipo para QA de gating.
3. **Simular el webhook** desde el panel de MercadoPago (§12.8 del doc base),
   si ya se tiene ngrok levantado.

> Recomendación: la **opción 2** (script de dev) es la que más acelera las
> pruebas de esta feature y conviene crearla como parte de la Etapa 0.
>
> ✅ **Creado:** [`apps/api/set-plan.ts`](../apps/api/set-plan.ts). Uso:
> `tsx set-plan.ts demo@caserita.cl Pro`. Ya se usó para dejar al vendedor demo en
> Pro con 2 promociones de ejemplo.

---

## 8. Estrategia de pruebas y verificación

| Nivel | Qué probar | Cómo |
|---|---|---|
| **Backend (unidad)** | `getPlanCapabilities`, `assertCanAddProduct` (límite, ilimitado, sobre el tope) | Test del service con planes Gratis/Pro |
| **Backend (integración)** | `403` en `POST /products` (tope) y `GET /stores/:id/stats` (Gratis); `200` en Pro | `curl` / cliente HTTP con tienda en cada plan |
| **Frontend** | Gate visual en Gratis vs Pro; contador de productos; botón deshabilitado | Alternar plan (§7) y recargar el panel |
| **Regresión** | El flujo de contratar/cancelar/cambiar sigue intacto | Recorrido de §12 del doc base |

**Verificación de tipos/CI:** correr `tsc --noEmit` en `apps/api` y `apps/web`
antes de cada PR (es lo que revisa el pipeline).

---

## 9. Riesgos y decisiones pendientes

| Tema | Decisión pendiente | Recomendación |
|---|---|---|
| Modelado de capacidades | Columnas booleanas (A) vs helper derivado (B) | (A) si se busca calidad; (B) si prioridad es velocidad |
| Downgrade con exceso de productos | ¿Qué pasa con tiendas sobre el nuevo tope? | No borrar; solo bloquear crear (evaluar al crear) |
| Verificación destacada (Premium) | ✅ Resuelto: **calculada desde el plan** (solo Premium), combinada con la verificación manual | — |
| Probar Pro en dev | Cómo poner una tienda en Pro sin pagar | Script de dev `set-plan` (§7, opción 2) |

---

## 10. Checklist de progreso

**Etapa 0 — Fundamentos** ✅
- [x] Decisión A/B de modelado de capacidades → **opción B**
- [x] `plan-access.service.ts` (`getPlanCapabilities`, `assertCanAddProduct`)
- [x] `requireFeature.ts`
- [x] Capacidades expuestas en `GET /subscriptions/me`
- [x] Frontend: tipo `PlanCapabilities` + `useCapabilities`
- [x] (Opción 2 de §7) script de dev `set-plan`

**Etapa 1 — Visualización** ✅ (menos el badge de plan)
- [x] `UpgradeBanner` + `PlanGate`
- [x] Estadísticas gateadas en el dashboard (UI)
- [x] Contador y botón de productos según límite
- [ ] Badge de plan actual + enlace a `/planes` — **pendiente** (menor)

**Etapa 2 — Candados Pro** ✅
- [x] `assertCanAddProduct` en `products.routes.ts create()`
- [x] `requireFeature('canViewStats')` en `GET /stores/:id/stats`
- [x] Caso borde downgrade (se bloquea al crear, no borra) — reflejado en UI

**Etapa 3 — Promociones** ✅ — ver [`implementacion-promociones.md`](./implementacion-promociones.md)
- [x] Modelo rediseñado (promo por producto) + migración aplicada
- [x] Backend: validación + service + controller + rutas gateadas + endpoint público
- [x] Web: CRUD (listado + form) + menú gateado + ruta
- [x] Mobile: promociones primero en la ficha de tienda

**Etapa 4 — Premium** ✅ — ver [`implementacion-premium.md`](./implementacion-premium.md)
- [x] Verificación destacada: `verified = manual OR Premium` (calculado en backend)
- [x] Web: preview con `capabilities.verifiedBadge` + se eliminó `planBenefits.ts`
- [x] Soporte prioritario: sección gateada a Premium (canal placeholder)
- [ ] Reemplazar el canal de soporte por el WhatsApp/correo real — **pendiente** (menor)

---

_Base conceptual: [`docs/planes-y-suscripciones.md`](./planes-y-suscripciones.md), §13._

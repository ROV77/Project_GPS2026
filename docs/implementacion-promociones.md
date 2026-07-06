# Implementación — Sistema de Promociones

Registro del trabajo realizado para el módulo de **promociones** (Etapa 3 del
plan de gating, ver [`plan-trabajo-gating-planes.md`](./plan-trabajo-gating-planes.md)),
junto con la **base de gating por plan** (Etapas 0–2) sobre la que se apoya.
Documenta **qué** se hizo, **qué archivos** se tocaron y **por qué**.

---

## 1. Resumen en una frase

Una tienda con plan **Pro/Premium** puede crear promociones (un **descuento %**
o una **promo por cantidad 2x1/3x2**) sobre sus productos desde el panel web; el
cliente las ve destacadas en la app mobile al entrar a la tienda. En **Gratis**,
el módulo está bloqueado (candado real en el backend, no solo en la UI).

---

## 2. Modelo de datos y migración

Se rediseñó la tabla `promotions`, que existía como "banner suelto de la tienda"
y pasó a ser una **promoción sobre un producto concreto**.

| Cambio | Detalle |
|---|---|
| **Relación** | Ahora tiene `product_id` (FK a `products`) además de `store_id`. |
| **Tipo** | `discount_type`: `'percentage'` \| `'2x1'` \| `'3x2'` (obligatorio). |
| **Valor** | `discount_value`: solo lo usa `percentage` (el %); en 2x1/3x2 es `null`. |
| **Estado** | `is_active` (Boolean) para **pausar** sin borrar. |
| **Vigencia** | `valid_from` / `valid_until` opcionales (null = sin límite por ese lado). |
| **Se eliminaron** | `title`, `description`, `image_url` (los aporta el producto). |

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) | ✏️ Modificado | Nuevo modelo `promotions` + relación `promotions[]` en `products`. |
| [`apps/api/prisma/migrations/20260705000000_redesign_promotions/migration.sql`](../apps/api/prisma/migrations/20260705000000_redesign_promotions/migration.sql) | 🆕 Nuevo | Migración: elimina columnas, agrega `product_id`/`is_active`, FK e índice. **Aplicada** (no destructiva, solo limpió filas viejas incompatibles). |
| [`apps/api/prisma/seed.ts`](../apps/api/prisma/seed.ts) | ✏️ Modificado | Semillas actualizadas: 2 promos demo (2x1 en Berlín, 20% en Palta). |

---

## 3. Backend (API)

CRUD en arquitectura de capas (rutas → controller → service), igual que
`subscriptions`. El router entero está **gateado** por la capacidad `canUsePromotions`.

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/api/src/services/promotions.service.ts`](../apps/api/src/services/promotions.service.ts) | 🆕 Nuevo | Lógica de negocio: `list`/`create`/`update`/`remove` + reglas (pertenencia del producto, una activa por producto, normalización del valor). |
| [`apps/api/src/controllers/promotions.controller.ts`](../apps/api/src/controllers/promotions.controller.ts) | 🆕 Nuevo | Traduce HTTP ↔ service (lee `res.locals.storeId`/`body`). |
| [`apps/api/src/routes/promotions.routes.ts`](../apps/api/src/routes/promotions.routes.ts) | 🆕 Nuevo | Expone `GET/POST/PUT/DELETE /api/promotions`, protegido con `requireAuth + withStore + requireFeature('canUsePromotions')`. |
| [`apps/api/src/routes/index.ts`](../apps/api/src/routes/index.ts) | ✏️ Modificado | Monta el router en `/api/promotions`. |
| [`apps/api/src/repositories/store.repository.ts`](../apps/api/src/repositories/store.repository.ts) | ✏️ Modificado | `findPublicStoreProducts` ahora adjunta a cada producto su **promoción vigente** (activa + dentro de fechas) → lo consume mobile. |

---

## 4. Validaciones compartidas (`packages/validations`)

Mismas reglas Zod que usa el backend y (a futuro) el frontend.

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`packages/validations/src/promotions.schema.ts`](../packages/validations/src/promotions.schema.ts) | 🆕 Nuevo | `createPromotionSchema`/`updatePromotionSchema` + `PROMOTION_TYPES`. Valida: % 1–100, % obligatorio en `percentage`, término ≥ inicio. |
| [`packages/validations/src/index.ts`](../packages/validations/src/index.ts) | ✏️ Modificado | Exporta el nuevo schema. |

---

## 5. Frontend web (panel del vendedor)

Feature nueva `apps/web/src/features/promotions/`, replicando el patrón de
**Productos** (api → hooks → página + drawer de formulario).

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`.../features/promotions/types.ts`](../apps/web/src/features/promotions/types.ts) | 🆕 Nuevo | Tipo `Promotion` (con el producto embebido). |
| [`.../features/promotions/api/promotionsApi.ts`](../apps/web/src/features/promotions/api/promotionsApi.ts) | 🆕 Nuevo | Llamadas a `/api/promotions` (list/create/update/remove). |
| [`.../features/promotions/hooks/usePromotions.ts`](../apps/web/src/features/promotions/hooks/usePromotions.ts) | 🆕 Nuevo | Hooks TanStack Query con invalidación de caché. |
| [`.../features/promotions/lib/promotionDisplay.ts`](../apps/web/src/features/promotions/lib/promotionDisplay.ts) | 🆕 Nuevo | Formato **como texto**: badge ("20% dcto", "2x1") y precio con descuento. |
| [`.../features/promotions/components/PromotionFormDrawer.tsx`](../apps/web/src/features/promotions/components/PromotionFormDrawer.tsx) | 🆕 Nuevo | Formulario crear/editar: elegir producto + tipo + (si %) valor + vigencia + estado. |
| [`.../features/promotions/pages/PromotionsListPage.tsx`](../apps/web/src/features/promotions/pages/PromotionsListPage.tsx) | 🆕 Nuevo | Listado (tabla) con crear/editar/eliminar. Incluye gate por si se entra por URL sin plan. |
| [`.../shared/config/navigation.tsx`](../apps/web/src/shared/config/navigation.tsx) | ✏️ Modificado | Ítem **"Promociones"** con `requiresFeature: 'canUsePromotions'`. |
| [`.../layouts/AdminLayout.tsx`](../apps/web/src/layouts/AdminLayout.tsx) | ✏️ Modificado | Filtra el menú por capacidad → el ítem solo aparece en Pro/Premium. |
| [`.../app/router/routes.tsx`](../apps/web/src/app/router/routes.tsx) | ✏️ Modificado | Registra la ruta `/promociones`. |

---

## 6. Mobile (app cliente)

Al entrar a una tienda, las promociones aparecen **primero**, arriba del catálogo.

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/mobile/src/features/stores/types.ts`](../apps/mobile/src/features/stores/types.ts) | ✏️ Modificado | `Product` ahora incluye `promotions?` (tipo `ProductPromotion`). |
| [`apps/mobile/src/features/stores/promotion.ts`](../apps/mobile/src/features/stores/promotion.ts) | 🆕 Nuevo | Helpers: promo vigente, badge de texto y precio con descuento. |
| [`apps/mobile/src/components/ProductCard.tsx`](../apps/mobile/src/components/ProductCard.tsx) | ✏️ Modificado | Muestra badge de promo (amber) y precio tachado + con descuento. |
| [`apps/mobile/src/app/(public)/store/[id].tsx`](../apps/mobile/src/app/(public)/store/[id].tsx) | ✏️ Modificado | Sección **"Promociones"** arriba del catálogo (lo primero visible). |

---

## 7. Reglas de negocio resueltas

- **Una promoción activa por producto**: al crear/activar una segunda sobre el
  mismo producto, el backend responde `409` (hay que pausar o eliminar la otra).
- **Vigencia**: `valid_from`/`valid_until` opcionales; sin fin = indefinida. El
  endpoint público solo devuelve promos **activas y dentro de la ventana**.
- **Estado**: `is_active` permite pausar una promo sin borrarla.
- **Precio mostrado (como texto)**: descuento → "precio original / precio con
  descuento"; 2x1/3x2 → etiqueta sobre el producto.
- **Validaciones**: % en rango 1–100, tipo obligatorio, y el producto debe
  pertenecer a la tienda del usuario.

---

## 8. Cómo se verificó

- **Backend en runtime (end-to-end, con `curl`):** `403` en Gratis, `200` en
  Pro, crear `201`, promo duplicada `409`, validación `400`, y el endpoint
  público devolviendo las promos por producto. ✅
- **Typecheck (`tsc --noEmit`):** API, web y mobile → sin errores. ✅

---

## 9. Herramienta de desarrollo

| Archivo | Tipo | Qué hace |
|---|---|---|
| [`apps/api/set-plan.ts`](../apps/api/set-plan.ts) | 🆕 Nuevo | Pone una tienda en un plan sin pagar. Uso: `tsx set-plan.ts demo@caserita.cl Pro`. Sirve para probar el gating (promociones/estadísticas) en local. |

> Con esto, el vendedor demo (`demo@caserita.cl` / `demo123`) quedó en **Pro** con
> 2 promociones de ejemplo para probar la UI.

---

## 10. Base de gating (Etapas 0–2) sobre la que se apoya

Promociones reutiliza el sistema de **capacidades por plan** construido antes en
esta misma sesión. Resumen de esos archivos:

| Archivo | Tipo | Rol |
|---|---|---|
| [`apps/api/src/services/plan-access.service.ts`](../apps/api/src/services/plan-access.service.ts) | 🆕 | Fuente única de "qué permite cada plan" (`getPlanCapabilities`, `assertCanAddProduct`). |
| [`apps/api/src/middlewares/requireFeature.ts`](../apps/api/src/middlewares/requireFeature.ts) | 🆕 | Candado de ruta por capacidad (lo usa promociones y estadísticas). |
| [`apps/api/src/controllers/subscriptions.controller.ts`](../apps/api/src/controllers/subscriptions.controller.ts) | ✏️ | `GET /subscriptions/me` expone las `capabilities` del plan. |
| [`apps/api/src/routes/products.routes.ts`](../apps/api/src/routes/products.routes.ts) | ✏️ | Candado del límite de productos (`assertCanAddProduct`). |
| [`apps/api/src/routes/stores.routes.ts`](../apps/api/src/routes/stores.routes.ts) | ✏️ | Estadísticas gateadas con `requireFeature('canViewStats')`. |
| [`apps/web/src/features/subscriptions/lib/capabilities.ts`](../apps/web/src/features/subscriptions/lib/capabilities.ts) | 🆕 | Default restrictivo de capacidades. |
| [`apps/web/src/features/subscriptions/components/PlanGate.tsx`](../apps/web/src/features/subscriptions/components/PlanGate.tsx) | 🆕 | Muestra contenido o aviso de mejora según el plan. |
| [`apps/web/src/features/subscriptions/components/UpgradeBanner.tsx`](../apps/web/src/features/subscriptions/components/UpgradeBanner.tsx) | 🆕 | CTA "Mejora a Pro". |
| [`apps/web/src/features/subscriptions/{types.ts, hooks/useSubscription.ts}`](../apps/web/src/features/subscriptions/) | ✏️ | Tipo `PlanCapabilities` + hook `useCapabilities`. |
| [`apps/web/src/features/dashboard/{pages/DashboardPage.tsx, hooks/useDashboardStats.ts}`](../apps/web/src/features/dashboard/) | ✏️ | Estadísticas gateadas visualmente. |
| [`apps/web/src/features/products/pages/ProductsListPage.tsx`](../apps/web/src/features/products/pages/ProductsListPage.tsx) | ✏️ | Contador de límite + botón bloqueado al tope. |

---

## 11. Notas y pendientes

- **Drift ajeno no tocado:** el schema del equipo tiene un `@@unique` en
  `delivery_applications` sin migrar (de otra rama). **No se modificó** para no
  mezclar cambios; queda como estaba.
- **Reseed:** la migración se aplicó con `migrate deploy` (no destructivo), por
  eso las promos demo se crearon con el script `set-plan` + la API. Un
  `prisma migrate reset` (o `dev:reset`) recreará todo desde el seed nuevo.

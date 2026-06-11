# Revisión del apartado web — CaseritApp (Project_GPS2026)

> Actualizado tras el merge que introdujo la arquitectura en capas en el backend
> (controllers / services / repositories) y el middleware de validación.

## Contexto

Revisión del estado actual de `apps/web` contra los docs del proyecto para determinar: (1) qué falta en el apartado web, (2) qué rutas habría que agregar, y (3) si la web puede consumir la API actualmente.

---

## ✅ La web SÍ puede consumir la API hoy

- **Conexión:** axios con `baseURL '/api'` (`apps/web/src/shared/api/client.ts`) + proxy de Vite `/api → http://localhost:3000` (`apps/web/vite.config.ts`). La API tiene `cors()` abierto (`apps/api/src/app.ts:16`).
- **Contratos coinciden:** la API devuelve listas como `{ data, page, limit, total }` (`apps/api/src/lib/crud.ts`) y la web espera exactamente eso (`Paginated<T>` en `shared/api/types.ts`). Errores 400/409 también coinciden.
- **Funcionando contra API real hoy:** Productos (CRUD completo), Mi Tienda, Planes, Mi Cuenta, catálogos (categories/regions/communes vía `useCatalogOptions`).
- **El merge no rompió nada en la web:** `useCatalogOptions` (`apps/web/src/shared/hooks/useCatalogOptions.ts`) carga los catálogos con el CRUD genérico `GET /{recurso}?limit=100`. **No** consume los endpoints de cascada que se movieron (ver abajo); esos son para la búsqueda pública de tiendas (mobile), no para el panel.

**Para levantar el proyecto:**
```bash
pnpm --filter api dev   # API en http://localhost:3000 (requiere PostgreSQL + DATABASE_URL)
pnpm --filter web dev   # Vite en http://localhost:5173
```

---

## Arquitectura backend (tras el merge)

El backend ahora tiene **dos patrones conviviendo**:

| Patrón | Flujo | Recursos que lo usan |
|---|---|---|
| **En capas** | `route → validate → controller → service → repository → prisma` | `stores` (endpoint `/search`), `regions` (endpoints de cascada) |
| **CRUD genérico** (`makeCrud`, `lib/crud.ts`) | `route → crud handler → prisma` | `products`, `users`, `plans`, `categories`, `communes` (y el CRUD base de `stores`/`regions`) |

Piezas nuevas:

- **`apps/api/src/controllers/`** — `region.controller.ts`, `store.controller.ts`: leen el request, llaman al service, responden.
- **`apps/api/src/services/`** — `region.service.ts`, `store.service.ts`: capa de lógica de negocio (hoy delgada, lista para crecer).
- **`apps/api/src/repositories/`** — `region.repository.ts`, `store.repository.ts`: acceso a BD; `store.repository.ts` usa `prisma.$queryRaw` con `Prisma.sql` (parametrizado, anti-inyección) para el rating promedio.
- **`apps/api/src/middlewares/validate.ts`** — `validateBody` / `validateQuery`: factories Zod que validan y dejan el resultado en `res.locals`. Hoy solo se usa `validateQuery(StoreFiltersSchema)` en `/stores/search`.
- **`errorHandler.ts`** — ahora mapea Prisma → HTTP (`P2025→404`, `P2002→409`, `P2003→409`) y `ZodError→400`. ⚠️ **Deuda de hardening:** en el `500` filtra `details` y `stack` al cliente; hay que ocultarlos en producción (`NODE_ENV`).

> **Decisión de diseño:** el backend nuevo (auth, promociones, stats) se construye **en capas** (controller/service/repository), siguiendo el patrón ya aplicado en `stores`/`regions`.

---

## Endpoints disponibles en la API

Todos montados en `/api`, sin autenticación.

| Recurso | Rutas |
|---|---|
| `products`, `users`, `plans`, `categories`, `communes` | CRUD genérico: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `stores` | CRUD genérico + `GET /stores/search` (en capas; filtros región/comuna/categoría/verified + rating, validado con `validateQuery(StoreFiltersSchema)`) |
| `regions` | CRUD genérico + `GET /regions/all` (lista para selects) + `GET /regions/:regionId/communes` (comunas en cascada, en capas) |
| Health | `GET /health` |

> **Endpoints movidos en el merge** (antes colgaban del router de stores):
> `GET /stores/regions` → ahora **`GET /regions/all`**;
> `GET /stores/regions/:id/communes` → ahora **`GET /regions/:regionId/communes`**.
> El panel web **no** los usa (carga catálogos con el CRUD genérico), así que el cambio es transparente para la web.

---

## ❌ Qué falta

| Brecha | Detalle |
|---|---|
| **Autenticación real** | No existe `POST /api/auth/login` ni `GET /api/auth/me`. Login web es simulado; contraseña se guarda sin hashear (TODO en `apps/api/src/routes/users.routes.ts:21`). No hay interceptor `Authorization` en axios. |
| **Dashboard con datos reales** | KPIs, gráfico y actividad reciente son hardcodeados. Modelo `profile_analytics` existe en Prisma pero sin rutas. |
| **Promociones** | Tabla `promotions` en schema Prisma, pero sin rutas en API ni feature en la web. |
| **Mi Tienda / Mi Cuenta** usan placeholder | Cargan `?limit=1` (primer registro) en vez del de la cuenta logueada. Depende de auth. |
| **Sin manejo de `isError`** | Las páginas muestran "sin datos" si la API falla, sin opción de reintentar. |
| **Sin tests** | Vitest configurado, 0 specs. |
| **`errorHandler` filtra stack en 500** | Ocultar `details`/`stack` en producción. |

---

## Rutas web que habría que agregar

| Ruta | Página | Dependencia backend |
|---|---|---|
| `/promociones` | CRUD de promociones (copiar patrón `products`) | `promotions` **en capas** + schema Zod |
| `/resenas` | Lista de reseñas de la tienda (solo lectura) | Rutas de `reviews` (no existen) |
| `/suscripcion` | Plan activo + estado de suscripción | Rutas de `subscriptions` (no existen) |

Las rutas actuales están bien y son suficientes para el MVP del panel:

```
/login           → LoginPage
/dashboard       → DashboardPage
/mi-tienda       → MyStorePage
/productos       → ProductsListPage
/planes          → PlansListPage
/mi-cuenta       → MyAccountPage
```

---

## Plan de implementación recomendado (por prioridad)

### Fase 1 — Auth real con JWT stateless (desbloquea todo lo demás)

1. **Backend (en capas):**
   - `auth.controller.ts` + `auth.service.ts`: `POST /auth/login` valida credenciales (bcrypt sobre `password_hash`) y firma un **JWT**; `GET /auth/me` devuelve usuario + su tienda.
   - `requireAuth` middleware (verifica el JWT del header `Authorization: Bearer`).
   - Hashear password con **bcrypt** al crear/editar usuarios (reemplaza el TODO en `users.routes.ts:21`).
2. **Web:**
   - Conectar `authStore.login()` al endpoint real; guardar el JWT.
   - Interceptor en `shared/api/client.ts` que adjunte `Authorization: Bearer <token>` y haga **logout en 401**.
   - Reemplazar el placeholder `?limit=1` de `storesApi.getMine()` / `userApi.getMine()` por `GET /auth/me`.

### Fase 2 — Promociones (end-to-end, en capas)

3. **Backend (en capas):** `packages/validations/src/promotion.schema.ts` + `promotion.repository.ts` + `promotion.service.ts` + `promotion.controller.ts` + `routes/promotions.routes.ts`; montar en `routes/index.ts`.
4. **Web:** feature `features/promotions/` (types, api, hooks, drawer, page) copiando el patrón de `features/products/`; ruta `/promociones` en `routes.tsx`; ítem en `navigation.tsx`.

### Fase 3 — Dashboard real y deuda técnica

5. Endpoint **en capas** `GET /api/stores/:id/stats` (conteo de productos, promedio de rating desde `reviews`); conectar `DashboardPage`.
6. Componente `ErrorState` compartido + manejo de `isError` en páginas de lista.
7. Ocultar `details`/`stack` del `errorHandler` en producción.
8. Primeros tests con Vitest (al menos el flujo CRUD de productos).

### Oportunidad de mejora UX (opcional)

- El select de comuna en "Mi Tienda" (`MyStorePage`) carga **todas** las comunas planas vía `useCatalogOptions`. Podría adoptar `GET /regions/:regionId/communes` para una **cascada región → comuna** (ya existe en el backend).

---

## Verificación

```bash
pnpm --filter web lint   # tsc --noEmit (es lo que corre el CI)
pnpm --filter api lint
```

Flujo manual: login con usuario seedeado (JWT) → CRUD promociones → Mi Tienda carga datos del usuario logueado → Dashboard muestra KPIs reales.

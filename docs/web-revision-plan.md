# Revisión del apartado web — CaseritApp (Project_GPS2026)

## Contexto

Revisión del estado actual de `apps/web` contra los docs del proyecto para determinar: (1) qué falta en el apartado web, (2) qué rutas habría que agregar, y (3) si la web puede consumir la API actualmente.

---

## ✅ La web SÍ puede consumir la API hoy

- **Conexión:** axios con `baseURL '/api'` (`apps/web/src/shared/api/client.ts`) + proxy de Vite `/api → http://localhost:3000` (`apps/web/vite.config.ts`). La API tiene `cors()` abierto (`apps/api/src/app.ts:16`).
- **Contratos coinciden:** la API devuelve listas como `{ data, page, limit, total }` (`apps/api/src/lib/crud.ts`) y la web espera exactamente eso (`Paginated<T>` en `shared/api/types.ts`). Errores 400/409 también coinciden.
- **Funcionando contra API real hoy:** Productos (CRUD completo), Mi Tienda, Planes, Mi Cuenta, catálogos (categories/regions/communes vía `useCatalogOptions`).

**Para levantar el proyecto:**
```bash
pnpm --filter api dev   # API en http://localhost:3000 (requiere PostgreSQL + DATABASE_URL)
pnpm --filter web dev   # Vite en http://localhost:5173
```

---

## Endpoints disponibles en la API

Todos montados en `/api`, sin autenticación.

| Recurso | Rutas |
|---|---|
| `products`, `users`, `plans`, `categories`, `regions`, `communes`, `stores` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `stores` extra | `GET /stores/search` (filtros región/comuna/categoría + rating), `GET /stores/regions`, `GET /stores/regions/:id/communes` |
| Health | `GET /health` |

---

## ❌ Qué falta

| Brecha | Detalle |
|---|---|
| **Autenticación real** | No existe `POST /api/auth/login` ni `GET /api/me`. Login web es simulado; contraseña se guarda sin hashear (TODO en `apps/api/src/routes/users.routes.ts:21`). No hay interceptor `Authorization` en axios. |
| **Dashboard con datos reales** | KPIs, gráfico y actividad reciente son hardcodeados. Modelo `profile_analytics` existe en Prisma pero sin rutas. |
| **Promociones** | Tabla `promotions` en schema Prisma, pero sin rutas en API ni feature en la web. |
| **Mi Tienda / Mi Cuenta** usan placeholder | Cargan `?limit=1` (primer registro) en vez del de la cuenta logueada. Depende de auth. |
| **Sin manejo de `isError`** | Las páginas muestran "sin datos" si la API falla, sin opción de reintentar. |
| **Sin tests** | Vitest configurado, 0 specs. |

---

## Rutas web que habría que agregar

| Ruta | Página | Dependencia backend |
|---|---|---|
| `/promociones` | CRUD de promociones (copiar patrón `products`) | `promotions.routes.ts` + schema zod |
| `/resenas` | Lista de reseñas de la tienda (solo lectura) | Rutas de `reviews` (no existen) |
| `/suscripcion` | Plan activo + estado de suscripción | Rutas de `subscriptions` (no existen) |

Las rutas actuales están bien y son suficientes para el MVP del panel:

```
/login           → LoginPage
/dashboard       → DashboardPage
/mi-tienda       → MyStorePage
/productos       → ProductsListPage
/repartidores    → CouriersPage
/planes          → PlansListPage
/mi-cuenta       → MyAccountPage
```

---

## Plan de implementación recomendado (por prioridad)

### Fase 1 — Auth real (desbloquea todo lo demás)

1. **Backend:** crear `apps/api/src/routes/auth.routes.ts` con `POST /auth/login` (bcrypt + JWT) y `GET /auth/me` (usuario + su tienda). Hashear password con bcrypt en `users.routes.ts`. Middleware `requireAuth`.
2. **Web:** conectar `authStore.login()` al endpoint real; interceptor en `shared/api/client.ts` que adjunte `Authorization: Bearer` y haga logout en 401; reemplazar placeholder `?limit=1` de `storesApi.getMine()` / `userApi.getMine()` por `GET /auth/me`.

### Fase 2 — Promociones (patrón `products`, end-to-end)

3. **Backend:** `packages/validations/src/promotion.schema.ts` + `apps/api/src/routes/promotions.routes.ts` con `makeCrud`; montar en `routes/index.ts`.
4. **Web:** feature `features/promotions/` (types, api, hooks, drawer, page); ruta `/promociones` en `routes.tsx`; ítem en `navigation.tsx`.

### Fase 3 — Dashboard real y deuda técnica

5. Endpoint `GET /api/stores/:id/stats` (conteo de productos, promedio rating desde `reviews`); conectar `DashboardPage`.
6. Componente `ErrorState` compartido + manejo de `isError` en páginas de lista.
7. Primeros tests con Vitest (al menos el flujo CRUD de productos).

---

## Verificación

```bash
pnpm --filter web lint   # tsc --noEmit (es lo que corre el CI)
pnpm --filter api lint
```

Flujo manual: login con usuario seedeado → CRUD promociones → Mi Tienda carga datos del usuario logueado → Dashboard muestra KPIs reales.

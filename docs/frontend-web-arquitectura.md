# Frontend Web (`apps/web`): arquitectura, tecnologías y funcionamiento

Guía del **panel administrativo** de CaseritApp: la app web que usa una **tienda** para
gestionar su catálogo de productos (los productos luego se muestran a los clientes en la app
mobile). **No es un sistema de pedidos.**

Este documento explica cómo está construido el front, qué tecnologías usa y cómo fluye una
petición. Para el detalle del diseño visual (mockups → componentes) ver
[`../apps/web/ARCHITECTURE.md`](../apps/web/ARCHITECTURE.md); para el lado del backend ver
[`./prisma-zod-flujo.md`](./prisma-zod-flujo.md).

> **Modelo de negocio:** una cuenta = **una sola tienda**. Por eso "Mi Tienda" es un perfil
> único editable (no una lista) y los productos se asignan automáticamente a esa tienda.

---

## Índice

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Arquitectura por features](#3-arquitectura-por-features)
4. [Las tres capas de un feature](#4-las-tres-capas-de-un-feature)
5. [La capa compartida (`shared/`)](#5-la-capa-compartida-shared)
6. [Estado: servidor vs cliente](#6-estado-servidor-vs-cliente)
7. [Routing y sesión](#7-routing-y-sesión)
8. [El kit de UI (Tailwind + Headless UI)](#8-el-kit-de-ui-tailwind--headless-ui)
9. [Flujo completo de una petición](#9-flujo-completo-de-una-petición)
10. [Convenciones de la API que el front respeta](#10-convenciones-de-la-api-que-el-front-respeta)
11. [Cómo levantar el proyecto](#11-cómo-levantar-el-proyecto)
12. [Estado actual y pendientes conocidos](#12-estado-actual-y-pendientes-conocidos)

---

## 1. Stack tecnológico

Todo el frontend se construye con **Tailwind CSS v4**. El **kit de UI oficial es shadcn/ui**:
componentes React + Radix que se **copian al repo** (en `src/components/ui/`) y se estilan con los
tokens de marca navy definidos en `src/index.css`. Algunos primitivos accesibles todavía se apoyan
en **Headless UI** mientras se completa la migración gradual a shadcn. Ver la guía de uso en
[`./frontend-shadcn-guia.md`](./frontend-shadcn-guia.md).

| Capa | Tecnología | Por qué |
|---|---|---|
| Build / dev server | **Vite 6** | Arranque y HMR rápidos; proxy a la API sin CORS. |
| Lenguaje / UI | **React 19 + TypeScript 5.8** | Base del proyecto, tipado estricto. |
| Estilos | **Tailwind CSS 4** | Toda la UI; tokens de marca (navy) en `src/index.css` (config CSS-first, sin `tailwind.config.js`). |
| Kit de UI | **shadcn/ui** (Radix) | Primitivos en `src/components/ui/` (Button, Card, Input, Badge…). Ver [`./frontend-shadcn-guia.md`](./frontend-shadcn-guia.md). |
| Primitivas accesibles | **Headless UI 2** | Comportamiento (foco, teclado, click-fuera) de los primitivos aún no migrados a shadcn: Select, Drawer, Dropdown, Popover y Switch. |
| Íconos | **lucide-react** | Set de íconos ligero y consistente. |
| Datos del servidor | **TanStack Query 5** | Caché, estados `loading/error`, paginación e invalidación tras mutaciones. |
| Estado global de cliente | **Zustand 5** | Sesión y preferencias de UI; ligero, sin boilerplate. |
| Formularios | **react-hook-form 7** | Formularios controlados y performantes. |
| Validación | **Zod 3** vía `@caserita/validations` | **Las mismas reglas que el backend**, compartidas. |
| HTTP | **Axios** | Cliente único con `baseURL` e interceptable. |
| Routing | **react-router-dom 7** | Rutas declarativas con layouts anidados. |
| Gráficos | **Recharts 3** | Gráficos del dashboard. |
| Avisos (toasts) | **sonner** | `toast.success / toast.error`, montado una vez. |
| Utilidades de clases | **clsx + tailwind-merge** | `cn()` compone clases y resuelve conflictos. |

Comandos (`pnpm` como gestor):

```bash
pnpm --filter web dev       # servidor de desarrollo (Vite en http://localhost:5173)
pnpm --filter web lint      # type-check (tsc --noEmit) — lo que corre el CI
pnpm --filter web build     # build de producción
```

> **`lint` = `tsc --noEmit`**, no ESLint. El type-check es estricto: `noUnusedLocals`,
> `noUnusedParameters` y `strict` activos.

---

## 2. Estructura de carpetas

```
apps/web/
├── index.html                  # punto de entrada de Vite
├── vite.config.ts              # plugin @tailwindcss/vite, proxy /api → :3000, alias @ → src
├── tsconfig.json               # config TS de la app (alias @/* → src/*)
├── components.json             # config de shadcn (estilo, alias, iconos)
├── .env.example                # VITE_API_URL (opcional; en dev se usa el proxy)
└── src/
    ├── main.tsx                # monta <AppProviders><App/></AppProviders>
    ├── App.tsx                 # <RouterProvider router={router} />
    ├── index.css               # @import tailwindcss + tokens de marca (navy) + base
    │
    ├── components/ui/          # primitivos del design system (shadcn): button, card…
    ├── lib/utils.ts            # cn canónico (clsx + tailwind-merge)
    │
    ├── app/                    # bootstrap transversal
    │   ├── providers/AppProviders.tsx   # QueryClientProvider + Toaster (sonner)
    │   ├── queryClient.ts               # instancia de TanStack Query
    │   └── router/
    │       ├── routes.tsx               # árbol de rutas (createBrowserRouter)
    │       └── ProtectedRoute.tsx       # guard: exige sesión
    │
    ├── shared/                 # reutilizable entre features
    │   ├── ui/                    # primitivos AÚN no migrados a shadcn (Select, Drawer, Table...)
    │   ├── api/                   # client (axios) · types · errors
    │   ├── components/            # PageHeader · KpiCard · ConfirmDelete
    │   ├── hooks/                 # useTablePagination · useCatalogOptions
    │   ├── lib/                   # cn · format (CLP/fecha) · form (400 → setError)
    │   └── config/navigation.tsx  # items del menú (key = ruta)
    │
    ├── layouts/
    │   ├── AdminLayout.tsx        # shell del panel (aside + header + main + Outlet)
    │   └── AuthLayout.tsx         # split-screen del login
    │
    └── features/               # módulos de negocio autocontenidos
        ├── auth/                  # login (simulado) + authStore (Zustand)
        ├── dashboard/             # KPIs/gráfico (mock) + productos populares (real)
        ├── products/              # ★ CRUD de referencia (catálogo de la tienda)
        ├── stores/                # "Mi Tienda": perfil único editable
        ├── user/                  # "Mi cuenta": perfil del titular
        └── plans/                 # lista de solo lectura
```

---

## 3. Arquitectura por features

El código se organiza **por módulo de negocio** (`features/products`, `features/stores`...),
no por tipo de archivo. Cada feature es **autocontenido** y sigue siempre la misma forma:

```
features/products/
├── types.ts                          # interface Product (forma de la API)
├── api/productsApi.ts                # funciones axios puras (list/create/update/remove)
├── hooks/useProducts.ts              # hooks de TanStack Query (queries + mutaciones)
├── components/ProductFormDrawer.tsx  # formulario crear/editar (RHF + zod)
└── pages/ProductsListPage.tsx        # tabla + orquestación
```

`products` es la **implementación de referencia**: los demás features se construyen copiando ese
patrón. Esta uniformidad es el principal activo del proyecto: entender un feature nuevo toma
segundos porque todos tienen la misma anatomía.

---

## 4. Las tres capas de un feature

Dentro de un feature, la responsabilidad se separa en tres capas que nunca se mezclan:

```
pages/components  →  hooks (TanStack Query)  →  api (axios puro)  →  /api (backend)
```

1. **`api/*Api.ts` — funciones puras.** No saben de React: solo hacen la llamada HTTP y devuelven
   datos. Ejemplo ([`../apps/web/src/features/products/api/productsApi.ts`](../apps/web/src/features/products/api/productsApi.ts)):

   ```ts
   export const productsApi = {
     list: ({ page, limit }) =>
       api.get('/products', { params: { page, limit } }).then((r) => r.data),
     create: (data) => api.post('/products', data).then((r) => r.data),
     // ...
   };
   ```

2. **`hooks/*` — TanStack Query.** Envuelven las funciones `api` en `useQuery` / `useMutation`,
   añaden caché, paginación e invalidación. Ejemplo
   ([`../apps/web/src/features/products/hooks/useProducts.ts`](../apps/web/src/features/products/hooks/useProducts.ts)):

   ```ts
   export function useProducts(params) {
     return useQuery({
       queryKey: ['products', params],
       queryFn: () => productsApi.list(params),
       placeholderData: keepPreviousData,   // no parpadea al paginar
     });
   }
   export function useCreateProduct() {
     const qc = useQueryClient();
     return useMutation({
       mutationFn: productsApi.create,
       onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
     });
   }
   ```

3. **`pages/` y `components/` — la UI.** Consumen los hooks y orquestan la pantalla. No hacen
   llamadas HTTP directas ni manejan caché.

---

## 5. La capa compartida (`shared/`)

Todo lo reutilizable entre features vive aquí:

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Cliente HTTP | [`shared/api/client.ts`](../apps/web/src/shared/api/client.ts) | Instancia única de axios con `baseURL '/api'`. **Todos** los `api/*` la importan. |
| Tipos de la API | [`shared/api/types.ts`](../apps/web/src/shared/api/types.ts) | `Paginated<T>`, `PageParams`, `ApiErrorBody`, `Id` (string). |
| Lectura de errores | [`shared/api/errors.ts`](../apps/web/src/shared/api/errors.ts) | `getApiErrorMessage`, `getValidationIssues` (400), `isConflictError` (409). Agnóstico de React. |
| Errores → formulario | [`shared/lib/form.ts`](../apps/web/src/shared/lib/form.ts) | `applyApiValidationErrors(error, setError)`: mapea los issues 400 a cada campo de react-hook-form. |
| Composición de clases | [`shared/lib/cn.ts`](../apps/web/src/shared/lib/cn.ts) | `cn()` = `clsx` + `tailwind-merge` (la última clase gana). |
| Formato | [`shared/lib/format.ts`](../apps/web/src/shared/lib/format.ts) | `formatCLP` (pesos), `formatDate`. |
| Opciones de Select | [`shared/hooks/useCatalogOptions.ts`](../apps/web/src/shared/hooks/useCatalogOptions.ts) | Carga genérica `{value,label}` para claves foráneas (categorías, regiones...). |
| Paginación | [`shared/hooks/useTablePagination.ts`](../apps/web/src/shared/hooks/useTablePagination.ts) | Estado de paginación server-side (`page`/`limit`/`onChange`). |
| Navegación | [`shared/config/navigation.tsx`](../apps/web/src/shared/config/navigation.tsx) | Fuente única del menú; la `key` ES la ruta. |

**Validación compartida con el backend.** Los formularios importan los esquemas Zod de
`@caserita/validations` (paquete del monorepo) y los usan con `zodResolver`. Así el front rechaza
**exactamente** lo que el backend rechazaría, sin reimplementar reglas:

```ts
import { createProductSchema } from '@caserita/validations';
useForm({ resolver: zodResolver(createProductSchema) });
```

---

## 6. Estado: servidor vs cliente

La regla es simple y se respeta en todo el panel:

| Tipo de estado | Herramienta | Ejemplos |
|---|---|---|
| **Server-state** (vive en la base de datos) | **TanStack Query** | productos, tiendas, planes, usuario |
| **Client-state** (global, del navegador) | **Zustand** | la sesión (token + usuario) |

Los datos del servidor **nunca** se guardan en Zustand: TanStack Query ya los cachea, sabe cuándo
están obsoletos y los revalida. Zustand solo guarda lo verdaderamente global y de cliente — hoy,
únicamente la sesión ([`authStore.ts`](../apps/web/src/features/auth/stores/authStore.ts), con
persistencia en `localStorage`).

Configuración del cliente de Query ([`queryClient.ts`](../apps/web/src/app/queryClient.ts)):
`staleTime` 30 s, `retry` 1, `refetchOnWindowFocus` false. Tras una mutación se **invalida** la
query afectada para refrescar la lista desde el servidor.

---

## 7. Routing y sesión

El árbol de rutas ([`routes.tsx`](../apps/web/src/app/router/routes.tsx)) aplica los wrappers en
orden:

```
ProtectedRoute (exige sesión) → AdminLayout (shell con <Outlet/>) → página
```

- **[`ProtectedRoute.tsx`](../apps/web/src/app/router/ProtectedRoute.tsx)** — si no hay token en
  el `authStore`, redirige a `/login`.
- **[`AdminLayout.tsx`](../apps/web/src/layouts/AdminLayout.tsx)** — el shell (sidebar + header +
  contenido). El item activo del menú se deriva de la URL (`location.pathname.startsWith(key)`),
  por eso las rutas anidadas mantienen el resaltado. Incluye el menú del avatar (Mi cuenta /
  cerrar sesión).
- Las rutas (`/dashboard`, `/mi-tienda`, `/productos`, `/planes`, `/mi-cuenta`) coinciden con las
  `key` de [`navigation.tsx`](../apps/web/src/shared/config/navigation.tsx). "/mi-cuenta" existe
  pero no está en la barra lateral: se accede desde el avatar.

> **Sesión simulada (hoy):** la API aún no expone `/auth`. `login()` acepta cualquier credencial
> y guarda un token ficticio. Cuando exista el endpoint real, solo cambia el cuerpo de `login()`;
> el resto (ProtectedRoute, AdminLayout) no cambia. Ver
> [§12](#12-estado-actual-y-pendientes-conocidos).

---

## 8. El kit de UI (shadcn/ui + Tailwind)

El **kit oficial es shadcn/ui**: los primitivos del design system viven en
[`components/ui/`](../apps/web/src/components/ui/) (ya migrados: Button, Card, Input, Badge). Se
estilan con los **tokens de marca** definidos en `src/index.css`; cambiar la marca es tocar el bloque
`--brand-50..900` de ese archivo. La guía completa de uso está en
[`./frontend-shadcn-guia.md`](./frontend-shadcn-guia.md).

La migración es **gradual**: los primitivos que aún no se movieron siguen en
[`shared/ui/`](../apps/web/src/shared/ui/) (Alert, Field, Textarea, NumberInput, PasswordInput,
Checkbox, Select, Switch, Drawer, DropdownMenu, ConfirmPopover, Table, Pagination, feedback) y
funcionan con los mismos tokens.

**Reglas del kit:**

- Primitivo genérico → `components/ui/` (shadcn). Composición específica del panel →
  `shared/components/` (`PageHeader`, `KpiCard`, `ConfirmDelete`).
- Usar **tokens** (`bg-primary`, `border-border`…), no colores sueltos. `cn` desde `@/lib/utils`.
- **Headless UI** solo da comportamiento accesible a los primitivos aún no migrados: `Select`
  (Combobox), `Drawer` (Dialog), `DropdownMenu` (Menu), `ConfirmPopover` (Popover) y `Switch`. Los
  nuevos componentes shadcn usan Radix.
- Los controles de formulario pendientes comparten estilos base en
  [`shared/ui/_control.ts`](../apps/web/src/shared/ui/_control.ts).

---

## 9. Flujo completo de una petición

Ejemplo: **crear un producto**.

```
ProductsListPage  (click "Nuevo producto")
  └─ ProductFormDrawer
       └─ react-hook-form + zodResolver(createProductSchema)   ← valida con las reglas del backend
            └─ useCreateProduct()  (mutación de TanStack Query)
                 └─ productsApi.create(values)
                      └─ axios.post('/api/products')            ← Vite hace proxy a :3000
                           ├─ 201 → toast "creado" + invalidateQueries(['products']) → la tabla se refresca
                           ├─ 400 → applyApiValidationErrors → setError por campo
                           └─ 409 → toast.error (duplicado o FK inválida)
```

Puntos clave del flujo:

- La **validación ocurre dos veces con la misma regla**: en el cliente (zodResolver, antes de
  enviar) y en el servidor (la API revalida). El esquema es el mismo (`@caserita/validations`).
- Tras el éxito, la mutación **invalida** `['products']` y la tabla se vuelve a pedir al servidor;
  no se edita la caché a mano.
- Los errores se reparten: **400** se pinta campo por campo en el formulario; **409 / 404 / 500**
  se muestran como toast con `getApiErrorMessage`.

---

## 10. Convenciones de la API que el front respeta

La API (`apps/api`) define las reglas; el front se adapta a estos contratos:

- **Paginación.** Las listas devuelven `{ data, page, limit, total }`. La query es `?page=&limit=`
  (`limit` por defecto 20, máximo 100). La `Table` se alimenta de esa forma exacta: `total` viene
  del servidor, **nunca** de `data.length`.
- **IDs como string.** Los IDs son `BIGINT` y llegan como **string** en JSON. Se modelan como
  `string` (tipo `Id`), se usan tal cual como key de fila, y **nunca** se hace `parseInt`. Para
  los campos numéricos de los formularios (claves foráneas) se convierten con `Number(...)` solo
  al construir el body, porque los esquemas Zod usan `z.coerce.number()`.
- **Errores por código:**
  - `400` → `{ error, issues: { campo: ["mensaje"] } }` → se mapean a cada campo del formulario.
  - `409` → valor duplicado o referencia FK inválida → toast.
  - `404` / `500` → mensaje genérico.
- **Soft delete.** `products` y `users` se borran lógicamente en el backend. Por eso, tras
  eliminar, se **invalida la query** y la fila desaparece porque el backend deja de devolverla.
- **Una sola tienda.** "Mi Tienda" y "Mi cuenta" cargan el primer registro de `/stores` y `/users`
  como **placeholder** (hasta que `/auth` vincule la cuenta), y los productos nuevos se asignan
  automáticamente al `store_id` de esa tienda, sin selector.

---

## 11. Cómo levantar el proyecto

Requisitos: Node 22, **pnpm**, y la API corriendo (ver
[`./prisma-zod-flujo.md`](./prisma-zod-flujo.md) y el `README` para el backend + PostgreSQL).

```bash
# 1. Backend en una terminal (desde la raíz del repo)
pnpm --filter api dev          # API en http://localhost:3000

# 2. Frontend en otra terminal
pnpm --filter web dev          # Vite en http://localhost:5173
```

El proxy de Vite redirige `/api` → `http://localhost:3000`, así que no hay que configurar CORS ni
URLs. En producción se apunta el backend con `VITE_API_URL` (ver `.env.example`).

**Probar el flujo:** abrir `http://localhost:5173` → redirige a **/login** → entrar (login
simulado: cualquier correo + contraseña de 6+ caracteres) → editar **Mi Tienda**, crear/editar/
eliminar en **Productos**, ver **Planes** y **Dashboard**.

---

## 12. Estado actual y pendientes conocidos

El panel está **funcional**. `products` es la implementación CRUD de referencia, completamente
conectada a la API. Brechas que dependen del backend:

| Pantalla / dato | Estado backend | Qué hace el front hoy |
|---|---|---|
| Mi Tienda, Productos, Planes, Mi cuenta | ✅ CRUD real | Implementados contra la API |
| **Login / autenticación** | ❌ No hay `/auth` | Login **simulado**; la sesión se guarda en `authStore`. |
| **Dashboard (KPIs, gráfico, actividad)** | ❌ No hay analytics | Datos **mock** con aviso visible. "Productos populares" sí usa datos reales. |
| **Promociones** | ⚠️ Tabla sin rutas | Sin frontend aún; se hará copiando el patrón de `products`. |

**Contrato sugerido al backend:** `POST /api/auth/login` (devuelve JWT), `GET /api/me` (tienda/
usuario de la cuenta), endpoints de analytics y el CRUD de `promotions`. El front ya está
estructurado para conectarlos siguiendo el patrón de `products`.

**Deuda técnica conocida del front:**

- **Manejo de errores de carga.** Las páginas de lista/formulario manejan `isLoading` pero aún no
  `isError`: si la API falla al listar, la tabla muestra el texto de "sin datos" en vez de un
  error con opción de reintentar. Pendiente: añadir un `ErrorState` compartido y enchufarlo en las
  páginas.
- **Tests.** Existe el script `test` (Vitest) pero todavía no hay specs.

# Arquitectura del Panel Administrativo — CaseritApp Web

Documento de arquitectura del frontend `apps/web`: el **panel administrativo** que usa una
**tienda** para gestionar su catálogo de productos, que luego se muestra a los clientes en la app
mobile. **No es un sistema de pedidos.** Explica el diseño visual, las decisiones técnicas, la
estructura de carpetas, cómo cada pieza se relaciona con la API existente y cómo levantar el proyecto.

> **Modelo de negocio**: una cuenta = **una sola tienda**. Por eso "Mi Tienda" es un perfil único
> editable (no una lista de tiendas) y los productos se asignan automáticamente a esa tienda.
>
> **Estado**: scaffold funcional. La capa de productos es la implementación CRUD de referencia,
> completamente conectada a la API. Hay datos mock en el dashboard y un feature reservado sin
> backend (ver [§7](#7-brechas-con-el-backend)).

---

## Índice

1. [Análisis visual y filosofía de diseño](#1-análisis-visual-y-filosofía-de-diseño)
2. [Mapeo del mockup a componentes UI](#2-mapeo-del-mockup-a-componentes-ui)
3. [Stack y decisiones técnicas](#3-stack-y-decisiones-técnicas)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Responsabilidad de cada pieza](#5-responsabilidad-de-cada-pieza)
6. [La API y cómo la consume el front](#6-la-api-y-cómo-la-consume-el-front)
7. [Brechas con el backend](#7-brechas-con-el-backend)
8. [Cómo levantar el proyecto](#8-cómo-levantar-el-proyecto)

---

## 1. Análisis visual y filosofía de diseño

Los mockups de referencia (login y dashboard) marcan la dirección estética, pero **no se copiaron
al pie de la letra**: se reinterpretaron con identidad propia manteniendo un estilo limpio y
profesional, construido íntegramente con Tailwind.

**Lo que se tomó del mockup:**
- **Login split-screen**: panel de marca a la izquierda (navy con degradado) + formulario a la
  derecha sobre fondo claro.
- **Shell con sidebar oscuro**: barra lateral navy/oscura contra contenido claro, generando
  jerarquía visual inmediata.
- **Fila de KPI cards** en el dashboard, con valor grande, ícono y tendencia.
- **Tarjetas de contenido**: gráfico de visitas, lista de productos populares, actividad reciente.

**Lo que se reinterpretó:**
- Paleta unificada con un **color de marca navy `#1e3a5f`** (token `brand` en
  [tailwind.config.js](tailwind.config.js)), aplicada con clases de Tailwind.
- Radios, densidad y tipografía (**Inter**) consistentes vía el tema de Tailwind.
- Estructura de navegación adaptada a lo que la API realmente soporta hoy.

**Filosofía**: el diseño se controla desde `tailwind.config.js` (colores de marca, fuente) y un kit
de componentes reutilizable en [shared/ui/](src/shared/ui/); cambiar la marca es tocar unos pocos tokens.

---

## 2. Mapeo del mockup a componentes UI

Todos los componentes viven en el kit propio [shared/ui/](src/shared/ui/) (Tailwind para el estilo +
Headless UI para el comportamiento accesible). Los íconos son de `lucide-react`.

| Zona del mockup | Componentes (shared/ui) | Dónde vive |
|---|---|---|
| Shell del panel | `aside`/`header`/`main` con flex de Tailwind | [layouts/AdminLayout.tsx](src/layouts/AdminLayout.tsx) |
| Navegación lateral | lista de `<button>` (item activo por ruta) | [shared/config/navigation.tsx](src/shared/config/navigation.tsx) |
| Usuario (pie del sidebar) | `DropdownMenu` (Headless UI Menu) | [layouts/AdminLayout.tsx](src/layouts/AdminLayout.tsx) |
| Login split-screen | `Field` + `Input` + `PasswordInput` + `Checkbox` + `Button` | [layouts/AuthLayout.tsx](src/layouts/AuthLayout.tsx), [features/auth/pages/LoginPage.tsx](src/features/auth/pages/LoginPage.tsx) |
| KPI cards | `Card` + markup | [shared/components/KpiCard.tsx](src/shared/components/KpiCard.tsx) |
| Gráfico "Visitas por hora" | `recharts` `BarChart` dentro de `Card` | [features/dashboard/pages/DashboardPage.tsx](src/features/dashboard/pages/DashboardPage.tsx) |
| "Productos populares" / "Actividad reciente" | listas con markup dentro de `Card` | [features/dashboard/pages/DashboardPage.tsx](src/features/dashboard/pages/DashboardPage.tsx) |
| Tabla del catálogo | `Table` + `Pagination` (server-side) + `ConfirmPopover` | [features/products/pages/ProductsListPage.tsx](src/features/products/pages/ProductsListPage.tsx) |
| Formulario de producto (alta/edición) | `Drawer` (Headless UI Dialog) + `Field`/`Input`/`NumberInput`/`Switch` | [features/products/components/ProductFormDrawer.tsx](src/features/products/components/ProductFormDrawer.tsx) |
| Formularios de perfil (Mi Tienda / Mi cuenta) | `Card` + `Field` + `Select` (Headless UI Combobox) | [features/stores/pages/MyStorePage.tsx](src/features/stores/pages/MyStorePage.tsx), [features/user/pages/MyAccountPage.tsx](src/features/user/pages/MyAccountPage.tsx) |
| Feedback (toasts) | `toast` de `sonner` | en cada página |
| Estados vacíos | `EmptyState` | [features/stores/pages/MyStorePage.tsx](src/features/stores/pages/MyStorePage.tsx) |

---

## 3. Stack y decisiones técnicas

| Capa | Tecnología | Por qué |
|---|---|---|
| Build / dev server | **Vite 6** | Arranque y HMR rápidos; proxy a la API sin CORS. |
| UI | **React 19 + TypeScript** | Base del proyecto. |
| Estilos y componentes | **Tailwind CSS** | Toda la UI; kit propio reutilizable en `shared/ui`. |
| Primitivas accesibles | **Headless UI** | Comportamiento (sin estilo) de Select, Dropdown, Drawer, Popover y Switch. |
| Íconos | **lucide-react** | Set de íconos ligero y consistente. |
| Avisos (toasts) | **sonner** | `toast.success/error` (montado en AppProviders). |
| Datos del servidor | **TanStack Query v5** | Caché, estados `loading/error`, paginación e invalidación tras mutaciones. |
| Estado global de cliente | **Zustand** | Sesión y preferencias de UI; ligero, sin boilerplate. |
| Formularios | **react-hook-form** | Formularios controlados performantes. |
| Validación | **Zod** vía `@caserita/validations` | **Las mismas reglas del backend**, compartidas (no se reimplementan). |
| HTTP | **Axios** | Cliente único con `baseURL` e interceptables. |
| Routing | **react-router-dom v7** | Rutas declarativas con layouts anidados. |
| Gráficos | **Recharts** | Gráficos del dashboard. |

### Decisiones clave

- **UI 100% Tailwind.** Todos los componentes son propios ([shared/ui/](src/shared/ui/)) y se estilan
  con clases de Tailwind; para el comportamiento accesible (foco, teclado, click-fuera) de los
  interactivos se usa Headless UI (sin estilos). El `preflight` de Tailwind está **activo** (aporta el
  reset base). El tema (marca, fuente) vive en [tailwind.config.js](tailwind.config.js).
- **Server state ≠ client state.** Los datos que viven en la base (productos, tiendas...) los maneja
  TanStack Query, no Zustand. Zustand solo guarda lo verdaderamente global y de cliente (la sesión).
- **Validación compartida.** Los formularios importan `createXSchema` de `@caserita/validations` y
  los usan con `zodResolver`. Así el front rechaza exactamente lo que el backend rechazaría.
- **Arquitectura feature-driven.** El código se organiza por módulo de negocio
  (`features/products`, `features/stores`...), no por tipo de archivo. Cada feature es autocontenido
  (`api · hooks · pages · components · types`), lo que facilita que cada integrante trabaje en lo suyo.
- **Tipos de React, fix acotado a web.** `@tanstack/react-query` y `@headlessui/react` declaran
  `@types/react` como peer opcional y caían a la v18 que arrastra `mobile` (React Native 0.76),
  chocando con la v19 de web (`ReactNode` incluye `bigint` en 19 y no en 18). En
  [pnpm-workspace.yaml](../../pnpm-workspace.yaml) se usa `packageExtensions` para estrechar su peer a
  `^19`. Como son exclusivas de web, el arreglo **no toca a `mobile`**, que conserva sus tipos de React 18.

---

## 4. Estructura de carpetas

```
apps/web/
├── index.html                  # punto de entrada de Vite
├── vite.config.ts              # proxy /api → :3000, alias @ → src
├── tsconfig.json               # config TS para el código de la app
├── tsconfig.node.json          # config TS para archivos de build (vite.config)
├── tailwind.config.js          # tema de marca (brand, Inter) + preflight activo
├── postcss.config.js           # tailwind + autoprefixer
├── .env.example                # VITE_API_URL (opcional; en dev se usa el proxy)
└── src/
    ├── main.tsx                # monta <AppProviders><App/></AppProviders>
    ├── App.tsx                 # <RouterProvider router={router} />
    ├── index.css               # directivas Tailwind + base (fuente/fondo)
    │
    ├── app/                    # bootstrap transversal de la app
    │   ├── providers/
    │   │   └── AppProviders.tsx   # QueryClientProvider + Toaster (sonner)
    │   ├── queryClient.ts         # instancia de TanStack Query
    │   └── router/
    │       ├── routes.tsx         # árbol de rutas (createBrowserRouter)
    │       └── ProtectedRoute.tsx # guard: exige sesión
    │
    ├── shared/                 # reutilizable entre features
    │   ├── ui/                    # kit Tailwind + Headless UI (Button, Input, Select, Drawer, Table, Pagination...)
    │   ├── api/
    │   │   ├── client.ts          # instancia única de axios
    │   │   ├── types.ts           # Paginated<T>, PageParams, ApiErrorBody, Id
    │   │   └── errors.ts          # helpers para errores 400/409 de la API
    │   ├── components/            # PageHeader, KpiCard, ConfirmDelete
    │   ├── hooks/                 # useTablePagination, useCatalogOptions
    │   ├── lib/                   # cn (clsx+twMerge) · format (CLP/fecha) · form (issues 400 → setError)
    │   └── config/navigation.tsx  # items del menú (key = ruta)
    │
    ├── layouts/
    │   ├── AdminLayout.tsx        # shell del panel (aside + header + main + Outlet)
    │   └── AuthLayout.tsx         # split-screen del login
    │
    └── features/               # módulos de negocio autocontenidos
        ├── auth/                  # login (mock) + authStore (Zustand)
        ├── dashboard/             # KPIs/gráfico (mock) + productos populares (real)
        ├── products/              # ★ CRUD de referencia (catálogo de la tienda)
        ├── stores/                # "Mi Tienda": perfil único editable (no es una lista)
        ├── user/                  # "Mi cuenta": perfil del titular (acceso desde el avatar)
        └── plans/                 # lista de solo lectura
```

### Anatomía de un feature

Cada feature de negocio sigue la misma forma. Tomando `products`:

```
features/products/
├── types.ts                       # interface Product (forma de la API)
├── api/productsApi.ts             # funciones axios puras (list/create/update/remove)
├── hooks/useProducts.ts           # hooks de TanStack Query (queries + mutaciones)
├── components/ProductFormDrawer.tsx  # formulario crear/editar (RHF + zod)
└── pages/ProductsListPage.tsx     # tabla + orquestación
```

---

## 5. Responsabilidad de cada pieza

### Bootstrap (`app/`)

- **[AppProviders.tsx](src/app/providers/AppProviders.tsx)** — `QueryClientProvider` (TanStack Query)
  + el `<Toaster>` de `sonner` montado una vez (alimenta `toast.success/error`).
- **[queryClient.ts](src/app/queryClient.ts)** — configura TanStack Query (`staleTime`, reintentos).
- **El tema** (marca, fuente) vive en [tailwind.config.js](tailwind.config.js), no en un objeto JS.
- **[router/routes.tsx](src/app/router/routes.tsx)** — define la jerarquía
  `ProtectedRoute → AdminLayout → página`. Las rutas coinciden con `navigation.tsx`.
- **[router/ProtectedRoute.tsx](src/app/router/ProtectedRoute.tsx)** — si no hay token en el
  `authStore`, redirige a `/login`.

### Capa compartida (`shared/`)

- **[api/client.ts](src/shared/api/client.ts)** — instancia única de axios con `baseURL '/api'`.
  Todos los `api/*Api.ts` la importan; nunca se usa una URL absoluta suelta.
- **[api/types.ts](src/shared/api/types.ts)** — `Paginated<T>` (forma de los listados),
  `ApiErrorBody` (forma de los errores), `Id` (string, porque los IDs son BIGINT).
- **[api/errors.ts](src/shared/api/errors.ts)** — `getValidationIssues` (extrae los errores 400 por
  campo), `getApiErrorMessage` (mensaje legible), `isConflictError` (409). Agnóstico de React.
- **[lib/form.ts](src/shared/lib/form.ts)** — `applyApiValidationErrors(error, setError)`: mapea los
  issues 400 a los campos de react-hook-form. Centraliza el patrón que usan los tres formularios.
- **[hooks/useCatalogOptions.ts](src/shared/hooks/useCatalogOptions.ts)** — carga genérica de
  opciones `{value,label}` para los `<Select>` de claves foráneas (categorías, regiones, etc.).
- **[hooks/useTablePagination.ts](src/shared/hooks/useTablePagination.ts)** — estado de paginación
  server-side reutilizable, conectado al `onChange` de la `Table`.
- **[ui/](src/shared/ui/)** — kit de componentes Tailwind + Headless UI (Button, Card, Input, Select,
  Switch, Drawer, DropdownMenu, ConfirmPopover, Table, Pagination...). `cn()`
  ([lib/cn.ts](src/shared/lib/cn.ts)) compone clases con resolución de conflictos. Es la base visual
  de todo el panel.
- **[components/](src/shared/components/)** — `PageHeader`, `KpiCard`, `ConfirmDelete`: piezas
  específicas del panel construidas sobre el kit `ui`.

### Layouts

- **[AdminLayout.tsx](src/layouts/AdminLayout.tsx)** — el shell (sidebar + header + contenido). La
  navegación deriva el item activo de la URL (`location.pathname.startsWith(key)`), por eso las rutas
  anidadas mantienen el resaltado. Incluye el menú del avatar (Mi cuenta · cerrar sesión).
- **[AuthLayout.tsx](src/layouts/AuthLayout.tsx)** — el split-screen del login; el panel de marca se
  oculta en móvil con utilidades Tailwind (`hidden md:flex`).

### Features

- **[products](src/features/products/)** — la **implementación de referencia**. Lista paginada +
  crear/editar en Drawer + eliminar con confirmación, conectado a la API y con manejo de errores. En
  el modelo de una tienda, el producto se asigna automáticamente a la tienda de la cuenta (sin
  selector). Los demás features se construyen copiando este.
- **[stores](src/features/stores/)** — **"Mi Tienda"**: carga la única tienda de la cuenta y permite
  editar su perfil (nombre, descripción, categoría/región/comuna vía `<Select>`, teléfono, logo).
- **[user](src/features/user/)** — **"Mi cuenta"**: perfil del titular (nombre, teléfono; correo de
  solo lectura). Se accede desde el menú del avatar, no desde la barra lateral.
- **[plans](src/features/plans/)** — lista de solo lectura de los planes de suscripción.
- **[dashboard](src/features/dashboard/)** — KPIs y gráfico con datos **mock**; "productos
  populares" con datos **reales** del catálogo.
- **[auth](src/features/auth/)** — login **simulado** + `authStore` (Zustand con persistencia).

---

## 6. La API y cómo la consume el front

La API (`apps/api`) es REST y define las reglas de negocio. El front se adapta a estos contratos.

### Recursos disponibles (base `/api`)

`regions`, `communes`, `categories`, `plans`, `users`, `stores`, `products`. Cada uno expone:

```
GET    /api/<recurso>        # lista paginada
GET    /api/<recurso>/:id    # detalle
POST   /api/<recurso>        # crear
PUT    /api/<recurso>/:id    # actualizar
DELETE /api/<recurso>/:id    # eliminar
```

### Convenciones que el front respeta

- **Paginación**: las listas devuelven `{ data, page, limit, total }`. La query es `?page=&limit=`
  (`limit` por defecto 20, máximo 100). La `Table` se alimenta de esa forma exacta: `total` viene del
  servidor, **nunca** de `data.length`.
- **IDs como string**: los IDs son BIGINT y llegan como **string** en JSON. Se modelan como `string`
  (tipo `Id`), se usan tal cual como key de cada fila, y nunca se hace `parseInt`.
- **Errores**: el front los interpreta según el código:
  - `400` → `{ error, issues: { campo: ["mensaje"] } }` → se mapean a cada campo del formulario con
    `setError` (ver `getValidationIssues`).
  - `409` → valor duplicado o referencia FK inválida → se muestra como `message.error`.
  - `404` / `500` → mensaje genérico.
- **Soft delete**: `products` y `users` se borran lógicamente en el backend. Por eso, tras eliminar
  un producto, se **invalida la query** y se vuelve a pedir la lista (la fila desaparece porque el
  backend deja de devolverla). `stores` y los catálogos usan borrado real.
- **Una sola tienda**: el panel asume una única tienda por cuenta. "Mi Tienda" y "Mi cuenta" cargan
  el primer registro de `/stores` y `/users` como **placeholder** (hasta que `/auth` vincule la
  cuenta con su tienda/usuario), y los productos nuevos se asignan automáticamente al `store_id` de
  esa tienda, sin selector.

### Flujo completo de una petición (ejemplo: crear producto)

```
ProductsListPage  (click "Nuevo producto")
   └─ ProductFormDrawer
        └─ react-hook-form + zodResolver(createProductSchema)   ← valida con las reglas del backend
             └─ useCreateProduct() (TanStack Query mutation)
                  └─ productsApi.create(values)
                       └─ axios.post('/api/products')           ← Vite hace proxy a :3000
                            ├─ 201 → message "creado" + invalidateQueries(['products']) → la tabla se refresca
                            ├─ 400 → setError por campo (issues)
                            └─ 409 → message.error
```

---

## 7. Brechas con el backend

El mockup muestra más de lo que la API ofrece hoy. Estrategia: **construir a fondo lo que existe** y
dejar el resto preparado (placeholder/mock) sin bloquear el avance.

| Pantalla / dato | Estado backend | Qué se hizo en el front |
|---|---|---|
| Mi Tienda, Productos, Planes | ✅ Endpoints CRUD reales | Implementados contra la API |
| Mi cuenta | ✅ `/users` | Edita el perfil del titular (primer usuario como placeholder) |
| **Login / autenticación** | ❌ No hay `/auth` (sin login, contraseñas sin hashear) | Login **simulado**: cualquier credencial entra; la sesión se guarda en `authStore`. Cuando exista `/auth`, solo se cambia el cuerpo de `login()`. |
| **Dashboard (KPIs, gráfico, actividad)** | ❌ No hay endpoints de analytics | Datos **mock** con aviso visible. "Productos populares" sí usa datos reales. |
| **Promociones** | ⚠️ Existe la tabla `promotions` pero sin rutas | Sin frontend aún; se construirá copiando el patrón de `products` cuando el backend exponga el CRUD. |

**Contrato sugerido a futuro** (para el equipo de backend): exponer `POST /api/auth/login` (devuelve
JWT) y un `GET /api/me` que entregue la tienda/usuario de la cuenta, un endpoint de analytics para el
dashboard, y el CRUD de `promotions`. El front ya está estructurado para conectarlos siguiendo el
patrón de `products`.

---

## 8. Cómo levantar el proyecto

### Requisitos
- Node 22, **pnpm**, y **PostgreSQL** corriendo.

### Paso 1 — Backend (`apps/api`)

Desde la raíz del repo:

```bash
createdb caseritApp
psql -d caseritApp -f docs/caseritapp_schema.sql      # carga el esquema
cp apps/api/.env.example apps/api/.env                # edita DATABASE_URL con tu password
pnpm install                                          # instala todo el monorepo
pnpm --filter api exec prisma generate                # genera el cliente Prisma
pnpm --filter api prisma:seed                         # datos de ejemplo (productos, tiendas...)
pnpm --filter api dev                                 # API en http://localhost:3000
```

Verifica que responde: abrir `http://localhost:3000/health` debe devolver `{ "status": "ok" }`.

### Paso 2 — Frontend (`apps/web`)

En otra terminal:

```bash
pnpm --filter web dev                                 # Vite en http://localhost:5173
```

El proxy de Vite redirige `/api` → `http://localhost:3000`, así que no hay que configurar CORS ni URLs.

### Paso 3 — Probar el flujo

1. Abrir `http://localhost:5173` → redirige a **/login**.
2. Iniciar sesión (login simulado: cualquier correo + contraseña de 6+ caracteres).
3. **Mi Tienda**: editar los datos del comercio y guardar (se valida con zod, `PUT` a la API).
4. **Productos**: la tabla lista los productos del seed (paginados desde el servidor).
5. **Nuevo producto**: se valida con zod, se crea (201, asignado automáticamente a tu tienda) y la tabla se refresca sola.
6. Editar y eliminar un producto (desaparece por soft delete).
7. **Planes**: lista de solo lectura. **Dashboard**: KPIs/gráfico mock + productos populares reales.
8. **Mi cuenta** (menú del avatar): editar nombre/teléfono del titular.

### Comandos útiles

```bash
pnpm --filter web dev       # servidor de desarrollo
pnpm --filter web lint      # type-check (tsc --noEmit) — lo mismo que corre el CI
pnpm --filter web build     # build de producción
```

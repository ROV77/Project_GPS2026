# Stack y Librerías Recomendadas — CaseritaApp

## Arquitectura General

```
ProyetoGPS2026/
├── apps/
│   ├── api/        → REST API (Node.js + Express)
│   ├── web/        → Panel administrativo (Vite + React)
│   └── mobile/     → App de clientes (Expo)
└── packages/
    ├── shared-types/   → Tipos TypeScript compartidos (del MER)
    ├── validations/    → Esquemas Zod compartidos (frontend + backend)
    └── config/         → tsconfig base
```

**Package manager:** `pnpm` — más rápido que npm, store global de paquetes sin duplicados entre apps del monorepo. Workspaces configurados con `pnpm-workspace.yaml`.  
**Flujo de datos:** Mobile/Web → REST API (Express) → PostgreSQL  
**Imágenes:** App/Web sube archivo → Express (multer) → Cloudinary → URL guardada en PostgreSQL → App/Web muestra con esa URL.  
**Validación compartida:** Esquemas Zod de `packages/validations` usados en el backend y en formularios web (React Hook Form), sin duplicar lógica.  
**Estado compartido:** Zustand funciona igual en web y mobile — misma API, sin reaprender nada.

---

## Backend — `apps/api`

Stack: **Node.js 20 LTS + Express + Prisma + PostgreSQL**

| Librería | Qué es | Qué aporta al proyecto | Versión |
|---|---|---|---|
| **Node.js** | Runtime de JavaScript del lado del servidor | Base de todo el backend | `20 LTS` |
| **Express** | Framework HTTP minimalista para Node.js | Enrutamiento REST, middlewares de auth y CORS, amplia comunidad | `^5.1.0` |
| **cors** | Middleware CORS para Express | Permite que el panel web y la app Expo consuman la API desde distintos orígenes | `^2.8.5` |
| **Prisma** | ORM TypeScript-first | Mapea el MER a TypeScript, genera tipos automáticamente, maneja migraciones con un comando | `^6.8.0` |
| **@prisma/client** | Cliente generado por Prisma | Consultas a PostgreSQL tipadas, sin SQL manual en el día a día | `^6.8.0` |
| **PostgreSQL** | Base de datos relacional | Ideal para el MER complejo (negocios, productos, pedidos, suscripciones, horarios, repartidores) | `16` |
| **Zod** | Validación de esquemas TypeScript | Valida el body de los requests; los mismos esquemas viven en `packages/validations` y se reusan en el frontend | `^3.24.0` |
| **jsonwebtoken** | JWT para Node.js | Genera y verifica tokens de autenticación para usuarios y comercios | `^9.0.2` |
| **bcryptjs** | Hash de contraseñas en JavaScript puro | Almacena contraseñas de forma segura, sin dependencias nativas | `^3.0.2` |
| **dotenv** | Variables de entorno desde `.env` | Gestión de credenciales de DB, clave JWT, API keys de Cloudinary por entorno | `^16.5.0` |
| **cloudinary** | SDK oficial de Cloudinary para Node.js | Sube imágenes al CDN de Cloudinary y devuelve URLs optimizadas para guardar en la DB | `^2.6.0` |
| **multer** | Middleware de Express para archivos multipart | Recibe la imagen del request antes de enviarla a Cloudinary | `^1.4.5` |
| **expo-server-sdk** | SDK oficial de Expo para push notifications | Envía notificaciones push desde Express usando el servicio gratuito de Expo, sin Firebase | `^3.14.0` |

### Compatibilidad Backend

- Express v5 requiere **Node.js ≥ 18**; con Node 20 LTS funciona perfecto.
- Prisma v6 compatible con Node 20 y PostgreSQL 14+.
- `jsonwebtoken` v9 es la versión estable actual; v8.x tiene vulnerabilidades conocidas.
- `multer` v1.4.5 es la última versión estable con Express v4/v5.

### Estrategia de Auth (Access + Refresh Tokens)

- **Access token**: expiración corta (15 min – 1 h). Se envía en el header `Authorization: Bearer <token>` en cada request.
- **Refresh token**: expiración larga (7 – 30 días). Se guarda en `expo-secure-store` en mobile y en una cookie `httpOnly` en web.
- **Endpoint `/auth/refresh`**: recibe el refresh token, lo valida con `jsonwebtoken`, y emite un nuevo access token.
- Guardar el refresh token en la DB (tabla `sessions`) para poder invalidarlo al hacer logout.

---

## Frontend Web — `apps/web`

Stack: **Vite + React 19 + Tailwind v3 + shadcn/ui + React Bits**

| Librería | Qué es | Qué aporta al proyecto | Versión |
|---|---|---|---|
| **Vite** | Build tool y dev server ultrarrápido | HMR instantáneo, build de producción optimizado | `^6.3.0` |
| **React** | Librería de UI | Base del panel web; composición de vistas y estado local | `^19.1.0` |
| **TypeScript** | Superset tipado de JavaScript | Tipos compartidos con el backend vía `packages/shared-types` | `^5.8.0` |
| **@vitejs/plugin-react** | Plugin oficial React para Vite | Activa Fast Refresh y la compilación JSX | `^4.4.0` |
| **React Router** | Enrutador estándar de React — **Library Mode** | Navegación SPA entre Dashboard, Catálogo, Pedidos, Promociones, Horarios | `^7.6.0` |
| **Zustand** | Estado global minimalista | Sesión de usuario autenticado y estado de UI; misma API que en mobile | `^5.0.4` |
| **Axios** | Cliente HTTP | Llamadas a la REST API con interceptor que inyecta el JWT en cada request | `^1.9.0` |
| **Tailwind CSS** | Framework CSS utility-first | Estilado consistente con los mockups | `^3.4.17` |
| **autoprefixer** | PostCSS plugin requerido por Tailwind v3 | Agrega prefijos CSS automáticamente para compatibilidad de navegadores | `^10.4.20` |
| **postcss** | Procesador CSS requerido por Tailwind v3 | Transforma el CSS de Tailwind durante el build de Vite | `^8.5.3` |
| **shadcn/ui** | Componentes headless (Radix UI + Tailwind v3) | Tablas de pedidos, formularios de catálogo, dropdowns, modales, sidebar del panel | CLI: `pnpm dlx shadcn@latest init` |
| **React Bits** | Componentes animados (copy-paste) | Elementos decorativos del dashboard: cards animadas, contadores; **no usar para componentes funcionales** | Copy-paste: [reactbits.dev](https://reactbits.dev) |
| **motion** | Animaciones para React | Dependencia de componentes de React Bits que usan animaciones | `^12.12.0` |
| **Recharts** | Gráficos para React | Barras (visitas por hora), líneas (rendimiento semanal) para el dashboard de Juan Pablo | `^3.0.0` |
| **React Hook Form** | Gestión de formularios | Formularios de catálogo, promociones y registro con mínimo re-render | `^7.56.0` |
| **@hookform/resolvers** | Adaptador Zod para React Hook Form | Conecta los esquemas de `packages/validations` directamente a los formularios | `^5.0.1` |
| **Zod** | Validación de esquemas | Reutiliza los esquemas de `packages/validations` para validar formularios en el cliente | `^3.24.0` |
| **@cloudinary/react** | Componente React oficial de Cloudinary | Muestra imágenes del catálogo con resize/crop automático sin procesarlas manualmente | `^1.14.0` |
| **@cloudinary/url-gen** | Generador de URLs de Cloudinary | Construye URLs con transformaciones (tamaño, formato, calidad) de forma tipada | `^1.21.0` |
| **Lucide React** | Iconos SVG | Set de iconos consistente para sidebar, botones y cards del dashboard | `^0.511.0` |

### Compatibilidad Frontend Web

- **Tailwind v3 + Vite**: configurar via `postcss.config.js` (con `tailwindcss` y `autoprefixer`). Inicializar con `pnpm dlx tailwindcss init -p`.
- **shadcn/ui** requiere Tailwind v3. No inicializar shadcn/ui con Tailwind v4.
- **Recharts v3** es necesario para React 19. Recharts v2 usa `findDOMNode` que fue eliminado en React 19.
- **React Router v7 — Library Mode**: para SPA con Vite usar `<BrowserRouter>` de `react-router-dom`. **No** usar Framework Mode (ese es para SSR/Remix con loaders de servidor).
- **React Hook Form v7.53+** soporta React 19.
- **shadcn/ui** usa Radix UI que ya soporta React 19.

---

## Mobile — `apps/mobile`

Stack: **Expo SDK 52 + Expo Router + NativeWind**

| Librería | Qué es | Qué aporta al proyecto | Versión |
|---|---|---|---|
| **Expo** | Plataforma sobre React Native | Abstrae configuración nativa de iOS/Android, SDK con módulos nativos listos | SDK `52` |
| **React Native** | Framework de UI nativa multiplataforma | Renderiza componentes nativos reales (no WebView) | `0.76.x` (vía Expo SDK 52) |
| **Expo Router** | Navegación basada en archivos | Rutas por estructura de carpetas (como Next.js); tabs, stack y modales para las pantallas del mockup | `^4.0.0` (incluido en SDK 52) |
| **NativeWind** | Tailwind CSS para React Native | `className` en componentes nativos con la misma sintaxis que el panel web | `^4.1.0` |
| **Zustand** | Estado global | Usuario autenticado, favoritos y configuración; misma API que en web | `^5.0.4` |
| **Axios** | Cliente HTTP | Llamadas a la API REST con interceptor de JWT, igual que en web | `^1.9.0` |
| **react-native-maps** | Mapas nativos para React Native | Mapa con negocios cercanos (Google Maps en Android, Apple Maps en iOS) | `^1.20.0` |
| **expo-location** | Geolocalización de Expo | Ubica al usuario para mostrar negocios cercanos y calcular distancias | `~18.0.0` (SDK 52) |
| **expo-notifications** | Push notifications de Expo | Recibe notificaciones de promociones y actualizaciones usando el servicio de Expo | `~0.29.0` (SDK 52) |
| **expo-image** | Imagen optimizada de Expo | Carga logos de negocios y fotos de productos desde URLs de Cloudinary con caché y placeholder | `~2.0.0` (SDK 52) |
| **expo-secure-store** | Almacenamiento seguro del dispositivo | Guarda el JWT y el refresh token de forma segura (no en AsyncStorage plano) | `~14.0.0` (SDK 52) |
| **expo-image-picker** | Selector de imágenes del dispositivo | Permite al usuario elegir una foto de la galería para subir como imagen de producto o logo | `~16.0.0` (SDK 52) |

### Compatibilidad Mobile

- **NativeWind v4** requiere **Expo SDK 52+** y **React Native 0.74+**. No compatible con versiones anteriores.
- **expo-location**, **expo-notifications**, **expo-secure-store** y **expo-image-picker** tienen versiones fijadas al SDK 52; siempre instalar con `pnpm expo install <paquete>` para que Expo asigne la versión correcta automáticamente.
- **Expo Router v4** viene incluido en Expo SDK 52. No instalar por separado.

---

## Paquetes Compartidos — `packages/`

| Paquete | Qué instalar | Propósito |
|---|---|---|
| **packages/shared-types** | `typescript ^5.8.0` | Tipos TypeScript del MER: `User`, `Business`, `Product`, `Order`, `Subscription`, `Schedule`, `DeliveryDriver`, etc. Los consumen `apps/api`, `apps/web` y `apps/mobile`. |
| **packages/validations** | `zod ^3.24.0` + `typescript ^5.8.0` | Esquemas Zod del sistema. El backend los usa para validar requests; el frontend web los conecta a React Hook Form vía `@hookform/resolvers`. |
| **packages/config** | Ya tiene `tsconfig.json` | Config TypeScript base extendida por cada app. |

---

## Herramientas de Desarrollo (DevDependencies raíz)

| Herramienta | Versión | Para qué |
|---|---|---|
| **pnpm** | `^9.15.0` | Package manager del monorepo. Instalar globalmente: `npm install -g pnpm` (una sola vez por máquina). |
| **ESLint** | `^9.25.0` | Linting del monorepo (ya en el pipeline CI) |
| **@typescript-eslint/eslint-plugin** | `^8.32.0` | Reglas TypeScript para ESLint v9 |
| **eslint-plugin-react** | `^7.37.0` | Reglas React para web y mobile |
| **Prettier** | `^3.5.0` | Formateo consistente entre todos los integrantes |
| **Jest** | `^29.7.0` | Tests del backend (ya en el pipeline CI) |
| **Vitest** | `^3.2.0` | Tests del panel web (nativo de Vite) |

---

## Advertencias importantes

### 1. Tailwind v3 — configuración PostCSS
No usar `@tailwindcss/vite` (eso es solo para v4). Inicializar con:
```bash
pnpm dlx tailwindcss init -p
```
Esto genera `tailwind.config.js` y `postcss.config.js`. Vite los detecta automáticamente.

### 2. react-native-maps requiere Expo Dev Client — NO funciona en Expo Go
`react-native-maps` necesita código nativo compilado. Pasos:
1. Agregar el config plugin en `app.json`:
   ```json
   { "plugins": ["react-native-maps"] }
   ```
2. Correr `pnpm expo prebuild` para generar carpetas `android/` e `ios/`.
3. Desde ese momento usar `pnpm expo run:android` o `pnpm expo run:ios` — ya no Expo Go.

### 3. pnpm + Metro (Expo) — configurar metro.config.js
Metro (el bundler de Expo) tiene conflictos con los symlinks de pnpm. Crear `apps/mobile/metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
module.exports = config;
```
Sin esto, Metro puede no encontrar paquetes instalados con pnpm.

### 4. React Router v7 — usar Library Mode para SPA
React Router v7 tiene dos modos:
- **Library Mode** ← este es el que usamos. Entry point con `<BrowserRouter>` de `react-router-dom`.
- **Framework Mode** (Remix) — para SSR con loaders de servidor. **No usar.**

Al pedirle código a la AI, especificar siempre: *"React Router v7 library mode con Vite SPA"*.

### 5. Módulos de Expo — siempre instalar con `pnpm expo install`
```bash
# Correcto — Expo asigna la versión compatible con el SDK automáticamente
pnpm expo install expo-location expo-notifications

# Incorrecto — puede instalar una versión incompatible con SDK 52
pnpm add expo-location expo-notifications
```

---

## Resumen de Versiones Críticas

```
Node.js              20 LTS
TypeScript           5.8.x
Zod                  3.24.x
Axios                1.9.x
Zustand              5.0.x

Backend (apps/api)
  Express            5.1.x
  Prisma             6.8.x
  jsonwebtoken       9.0.x
  bcryptjs           3.0.x
  cloudinary         2.6.x
  multer             1.4.x
  expo-server-sdk    3.14.x
  PostgreSQL         16

Web (apps/web)
  Vite               6.3.x
  React              19.1.x
  Tailwind CSS       3.4.x      ← v3, no v4
  postcss            8.5.x
  autoprefixer       10.4.x
  React Router       7.6.x      ← Library Mode
  Recharts           3.0.x
  React Hook Form    7.56.x
  motion             12.12.x
  @cloudinary/react  1.14.x

Mobile (apps/mobile)
  Expo SDK           52
  React Native       0.76.x
  Expo Router        4.x
  NativeWind         4.1.x
  react-native-maps  1.20.x     ← requiere Expo Dev Client
```

---

## Equivalencia de comandos npm → pnpm

| npm | pnpm |
|---|---|
| `npm install` | `pnpm install` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |
| `npm install -g <pkg>` | `pnpm add -g <pkg>` |
| `npm run <script>` | `pnpm <script>` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npx <cmd>` | `pnpm dlx <cmd>` |
| `npm create vite@latest` | `pnpm create vite` |
| `npm init` | `pnpm init` |

### Actualizar el CI pipeline

El `ci.yml` actual usa `npm ci`. Reemplazar por:
```yaml
- name: Instalar pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Instalar dependencias
  run: pnpm install --frozen-lockfile
```

---

## Orden de Setup Recomendado

1. Instalar pnpm globalmente: `npm install -g pnpm`
2. Crear `pnpm-workspace.yaml` en la raíz:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```
3. `packages/shared-types`: `pnpm init` → definir tipos del MER.
4. `packages/validations`: `pnpm init` → `pnpm add zod typescript`.
5. `apps/api`: `pnpm init` → `pnpm add express cors prisma @prisma/client jsonwebtoken bcryptjs dotenv cloudinary multer expo-server-sdk`.
6. Configurar Prisma: `pnpm dlx prisma init` → escribir schema → `pnpm dlx prisma migrate dev`.
7. `apps/web`: `pnpm create vite . --template react-ts`.
8. Instalar Tailwind v3: `pnpm add -D tailwindcss@3 postcss autoprefixer` → `pnpm dlx tailwindcss init -p`.
9. Instalar shadcn/ui: `pnpm dlx shadcn@latest init`.
10. Copiar componentes de React Bits desde [reactbits.dev](https://reactbits.dev) según se necesiten.
11. `apps/mobile`: `pnpm dlx create-expo-app . --template` (elegir template con Expo Router).
12. Crear `apps/mobile/metro.config.js` con la config de pnpm (ver Advertencias #3).
13. Instalar módulos de Expo con `pnpm expo install` (ver Advertencias #5).
14. Actualizar `ci.yml` para usar pnpm (ver sección de equivalencias).

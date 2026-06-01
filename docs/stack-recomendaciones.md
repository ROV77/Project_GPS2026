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

**Package manager:** `pnpm` — más rápido que npm, usa un store global de paquetes (evita duplicados entre apps del monorepo) y gestiona workspaces con `pnpm-workspace.yaml`.  
**Flujo de datos:** Mobile/Web → REST API (Express) → PostgreSQL  
**Validación compartida:** Los esquemas Zod de `packages/validations` se usan en el backend (validar requests) y en el frontend web (validar formularios con React Hook Form), sin duplicar lógica.  
**Estado compartido:** Zustand se usa igual en web y en mobile — misma API, sin reaprender nada.

---

## Backend — `apps/api`

Stack: **Node.js 20 LTS + Express + Prisma + PostgreSQL**

| Librería | Qué es | Qué aporta al proyecto | Versión recomendada |
|---|---|---|---|
| **Node.js** | Runtime de JavaScript del lado del servidor | Base de todo el backend | `20 LTS` |
| **Express** | Framework HTTP minimalista para Node.js | Enrutamiento de la API REST, middlewares para auth y CORS, amplia comunidad y documentación | `^5.1.0` |
| **cors** | Middleware CORS para Express | Permite que el panel web y la app Expo consuman la API desde distintos orígenes | `^2.8.5` |
| **Prisma** | ORM TypeScript-first | Mapea el MER a código TypeScript, genera tipos automáticamente, maneja migraciones con un solo comando | `^6.8.0` |
| **@prisma/client** | Cliente generado por Prisma | Consultas a PostgreSQL completamente tipadas, sin SQL manual en el día a día | `^6.8.0` |
| **PostgreSQL** | Base de datos relacional | Ideal para el modelo relacional del MER (negocios, productos, pedidos, suscripciones, horarios) | `16` |
| **Zod** | Librería de validación de esquemas TypeScript | Valida el body de los requests en la API; los mismos esquemas viven en `packages/validations` y se reusan en el frontend | `^3.24.0` |
| **jsonwebtoken** | Implementación de JWT para Node.js | Genera y verifica tokens de autenticación para usuarios y comercios | `^9.0.2` |
| **bcryptjs** | Hash de contraseñas en JavaScript puro | Almacena contraseñas de forma segura, sin dependencias nativas (compatible en cualquier OS del equipo) | `^3.0.2` |
| **dotenv** | Variables de entorno desde archivo `.env` | Gestión de credenciales de DB, clave JWT y URLs por entorno (dev/prod) | `^16.5.0` |
| **expo-server-sdk** | SDK oficial de Expo para enviar push notifications | Envía notificaciones push desde el backend de Express usando el servicio gratuito de Expo, sin necesidad de Firebase | `^3.14.0` |

### Compatibilidad Backend

- Express v5 requiere **Node.js ≥ 18**; con Node 20 LTS funciona perfecto.
- Prisma v6 es compatible con Node 20 y PostgreSQL 14+.
- `jsonwebtoken` v9 es la versión actual estable; las versiones anteriores (v8.x) tienen vulnerabilidades conocidas.
- `expo-server-sdk` es el paquete oficial de Expo para enviar push notifications desde cualquier backend Node.js.

---

## Frontend Web — `apps/web`

Stack: **Vite + React 19 + Tailwind v4 + shadcn/ui + React Bits**

| Librería | Qué es | Qué aporta al proyecto | Versión recomendada |
|---|---|---|---|
| **Vite** | Build tool y dev server ultrarrápido | Reemplaza Create React App, HMR instantáneo, build de producción optimizado | `^6.3.0` |
| **React** | Librería de UI | Base del panel web; composición de vistas y manejo de estado local | `^19.1.0` |
| **TypeScript** | Superset tipado de JavaScript | Tipos compartidos con el backend vía `packages/shared-types`, detecta errores antes de ejecutar | `^5.8.0` |
| **@vitejs/plugin-react** | Plugin oficial React para Vite | Activa Fast Refresh y la compilación JSX dentro de Vite | `^4.4.0` |
| **React Router** | Enrutador estándar de React | Navegación entre secciones del panel: Dashboard, Catálogo, Pedidos, Promociones, Horarios | `^7.6.0` |
| **Zustand** | Gestión de estado global minimalista | Estado de sesión, usuario autenticado y configuración de UI; sin boilerplate, misma API que en mobile | `^5.0.4` |
| **Axios** | Cliente HTTP | Llamadas a la REST API; interceptores para inyectar el token JWT automáticamente en cada request | `^1.9.0` |
| **Tailwind CSS** | Framework CSS utility-first | Estilado rápido y consistente con el diseño de los mockups; sin escribir CSS personalizado | `^4.1.0` |
| **@tailwindcss/vite** | Plugin de Tailwind v4 para Vite | Integración directa de Tailwind v4 con el pipeline de Vite (reemplaza PostCSS en v4) | `^4.1.0` |
| **shadcn/ui** | Colección de componentes headless (Radix UI + Tailwind) | Componentes accesibles y sin estilos impuestos: tablas de pedidos, formularios de catálogo, dropdowns, modales, sidebar | CLI: `npx shadcn@latest init` |
| **React Bits** | Librería de componentes animados | Elementos visuales para el dashboard (cards animadas, contadores, fondos dinámicos); complementa shadcn/ui | Copy-paste desde [reactbits.dev](https://reactbits.dev) |
| **motion** | Librería de animaciones para React | Dependencia de muchos componentes de React Bits; animaciones fluidas en transiciones y microinteracciones | `^12.12.0` |
| **Recharts** | Librería de gráficos para React | Gráficos de barras (visitas por hora), líneas (rendimiento semanal) y listas para el dashboard — módulo de Juan Pablo | `^3.0.0` |
| **React Hook Form** | Gestión de formularios en React | Formularios de catálogo, promociones y registro con mínimo re-render y control total del estado | `^7.56.0` |
| **@hookform/resolvers** | Adaptador Zod para React Hook Form | Conecta los esquemas Zod de `packages/validations` directamente a los formularios, sin validar dos veces | `^5.0.1` |
| **Zod** | Validación de esquemas | Reutiliza los mismos esquemas de `packages/validations` para validar formularios del lado del cliente | `^3.24.0` |
| **Lucide React** | Set de iconos SVG | Iconos consistentes para toda la UI del panel (sidebar, botones, cards del dashboard) | `^0.511.0` |

### Nota sobre shadcn/ui y React Bits

- **shadcn/ui** no se instala como dependencia npm. Se inicializa con `npx shadcn@latest init` y luego se agregan componentes individuales con `npx shadcn@latest add <componente>`. El código queda en tu proyecto y puedes modificarlo libremente.
- **React Bits** tampoco es un paquete npm. Se navega a [reactbits.dev](https://reactbits.dev), se elige el componente deseado y se copia el código a `apps/web/src/components/bits/`. Algunos componentes requieren `motion` (ya incluido arriba).

### Compatibilidad Frontend Web

- **Tailwind v4 + Vite v6:** usar `@tailwindcss/vite` como plugin — NO usar la configuración PostCSS de Tailwind v3, son incompatibles.
- **Recharts v3** es necesario para React 19. Recharts v2 solo soporta React 18.
- **shadcn/ui** usa Radix UI que ya soporta React 19 completamente.
- **React Hook Form v7.53+** soporta React 19.
- **React Router v7** requiere React 18+, compatible con React 19.

---

## Mobile — `apps/mobile`

Stack: **Expo SDK 52 + Expo Router + NativeWind**

| Librería | Qué es | Qué aporta al proyecto | Versión recomendada |
|---|---|---|---|
| **Expo** | Plataforma sobre React Native | Abstrae la configuración nativa de iOS y Android, incluye SDK con módulos nativos listos para usar | SDK `52` |
| **React Native** | Framework de UI nativa multiplataforma | Renderiza componentes nativos reales (no WebView); incluido con Expo | `0.76.x` (via Expo SDK 52) |
| **Expo Router** | Navegación basada en archivos para Expo | Las rutas se definen por la estructura de carpetas (como Next.js); incluye tabs, stack y modales para las pantallas del mockup | `^4.0.0` (incluido en Expo SDK 52) |
| **NativeWind** | Tailwind CSS para React Native | Permite usar `className` en los componentes nativos con la misma sintaxis que el panel web, manteniendo consistencia de diseño | `^4.1.0` |
| **Zustand** | Gestión de estado global | Estado de usuario autenticado, favoritos y configuración de la app; misma API que en el panel web | `^5.0.4` |
| **Axios** | Cliente HTTP | Llamadas a la API REST desde la app; interceptores para el token JWT, igual que en web | `^1.9.0` |
| **react-native-maps** | Componente de mapas para React Native | Muestra el mapa con la ubicación de los negocios cercanos (Google Maps en Android, Apple Maps en iOS) | `^1.20.0` |
| **expo-location** | Módulo de geolocalización de Expo | Obtiene la ubicación del dispositivo para mostrar negocios cercanos y calcular distancias | `~18.0.0` (Expo SDK 52) |
| **expo-notifications** | Módulo de notificaciones push de Expo | Recibe notificaciones push del backend (promociones, actualizaciones de pedidos) usando el servicio de Expo | `~0.29.0` (Expo SDK 52) |
| **expo-image** | Componente de imagen optimizado de Expo | Carga de imágenes de productos y logos de negocios con caché y placeholders; más eficiente que `<Image>` de RN | `~2.0.0` (Expo SDK 52) |
| **expo-secure-store** | Almacenamiento seguro del dispositivo | Guarda el JWT del usuario de forma segura en el dispositivo (no en AsyncStorage plano) | `~14.0.0` (Expo SDK 52) |

### Compatibilidad Mobile

- **NativeWind v4** requiere **Expo SDK 52+** y **React Native 0.74+** (usa el nuevo JSX transform). No es compatible con versiones anteriores.
- **react-native-maps** con Expo requiere agregar el Config Plugin en `app.json` y correr `expo prebuild` para configuración nativa. En Expo Go no funciona — usar Expo Dev Client o builds de desarrollo.
- **expo-location**, **expo-notifications** y **expo-secure-store** tienen versiones fijadas al Expo SDK 52; siempre instalar con la versión que indica `expo install` para garantizar compatibilidad.
- **Expo Router v4** viene incluido en Expo SDK 52. No instalar versiones anteriores de forma independiente.

---

## Paquetes Compartidos — `packages/`

| Paquete | Qué instalar | Propósito |
|---|---|---|
| **packages/shared-types** | `typescript ^5.8.0` | Tipos TypeScript derivados del MER: `User`, `Business`, `Product`, `Order`, `Subscription`, `Schedule`, etc. Los consumen `apps/api`, `apps/web` y `apps/mobile`. |
| **packages/validations** | `zod ^3.24.0` + `typescript ^5.8.0` | Esquemas Zod para validar los datos del sistema. El backend los usa para validar request bodies; el frontend web los conecta a React Hook Form vía `@hookform/resolvers`. |
| **packages/config** | Ya tiene `tsconfig.json` | Configuración TypeScript base que extienden cada app con su propia configuración. |

---

## Herramientas de Desarrollo (DevDependencies raíz)

| Herramienta | Versión | Para qué |
|---|---|---|
| **pnpm** | `^9.15.0` | Package manager del monorepo; reemplaza npm. Instalar globalmente con `npm install -g pnpm` una sola vez. |
| **ESLint** | `^9.25.0` | Linting unificado del monorepo (ya configurado en el pipeline CI) |
| **@typescript-eslint/eslint-plugin** | `^8.32.0` | Reglas TypeScript para ESLint v9 |
| **eslint-plugin-react** | `^7.37.0` | Reglas específicas de React para web y mobile |
| **Prettier** | `^3.5.0` | Formateo de código consistente entre todos los integrantes del equipo |
| **Jest** | `^29.7.0` | Tests unitarios del backend (ya configurado en el pipeline CI) |
| **Vitest** | `^3.2.0` | Tests unitarios del panel web (nativo de Vite, mucho más rápido que Jest para código del browser) |

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
  expo-server-sdk    3.14.x
  PostgreSQL         16

Web (apps/web)
  Vite               6.3.x
  React              19.1.x
  Tailwind CSS       4.1.x
  React Router       7.6.x
  Recharts           3.0.x
  React Hook Form    7.56.x
  motion             12.12.x

Mobile (apps/mobile)
  Expo SDK           52
  React Native       0.76.x
  Expo Router        4.x
  NativeWind         4.1.x
  react-native-maps  1.20.x
```

---

## Equivalencia de comandos npm → pnpm

| npm | pnpm |
|---|---|
| `npm install` | `pnpm install` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |
| `npm install -g <pkg>` | `pnpm add -g <pkg>` |
| `npm run <script>` | `pnpm <script>` o `pnpm run <script>` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npx <cmd>` | `pnpm dlx <cmd>` |
| `npm create vite@latest` | `pnpm create vite` |
| `npm init` | `pnpm init` |

### Instalar en un workspace específico

```bash
# Instalar una dependencia solo en apps/api
pnpm add express --filter @caserita/api

# Instalar una dependencia en todos los workspaces
pnpm add -D typescript --workspace
```

### Actualizar el CI pipeline

El archivo `.github/workflows/ci.yml` usa actualmente `npm ci`. Debe actualizarse a:

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

1. Instalar pnpm globalmente (una sola vez por máquina): `npm install -g pnpm`
2. Crear `pnpm-workspace.yaml` en la raíz del monorepo:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```
3. Inicializar `packages/shared-types` con los tipos TypeScript del MER: `pnpm init` dentro de la carpeta.
4. Inicializar `packages/validations` con los esquemas Zod base: `pnpm init` + `pnpm add zod`.
5. Inicializar `apps/api`: `pnpm init` + `pnpm add express prisma @prisma/client jsonwebtoken bcryptjs dotenv cors expo-server-sdk`.
6. Configurar Prisma: `pnpm dlx prisma init` → escribir el schema desde el MER → `pnpm dlx prisma migrate dev`.
7. Inicializar `apps/web`: `pnpm create vite . --template react-ts`.
8. Instalar shadcn/ui en `apps/web`: `pnpm dlx shadcn@latest init`.
9. Copiar componentes de React Bits según se necesiten desde [reactbits.dev](https://reactbits.dev).
10. Inicializar `apps/mobile`: `pnpm dlx create-expo-app . --template` (Expo Router template).
11. Configurar NativeWind en `apps/mobile` siguiendo la guía oficial para Expo SDK 52.
12. Actualizar el pipeline CI para usar pnpm (ver sección de equivalencias arriba).

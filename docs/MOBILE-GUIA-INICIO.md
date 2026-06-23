# Caserita App — Guía de Inicio Técnico (Mobile)

> **Documento oficial de arranque** para el equipo de desarrollo mobile.
> Define la arquitectura base y la primera pantalla del **Prototipo Funcional**
> enfocado en la **experiencia del cliente** (explorar comercios y catálogos).
>
> **Meta inmediata:** dejar la app levantada con Expo de modo que se pueda
> **escanear un QR con Expo Go** y visualizarla en un teléfono real.

---

## 0. Contexto y principios

`apps/mobile` hoy es solo andamiaje (`package.json` + carpetas vacías). Esta guía
lo convierte en una app Expo navegable. Decisiones que la rigen:

- **Cliente primero, anónimo.** El prototipo se enfoca en *explorar tiendas y
  catálogos sin login*. El login solo se exige para el flujo de repartidor (más
  adelante). Cero fricción para ver el prototipo.
- **Calco del web, no reinvención.** Reutilizamos el patrón del panel web
  (axios con interceptor, `zustand`, organización por *features*) y la **misma
  identidad de marca** (navy `#1e3a5f` + neutros slate + Inter). Coherencia entre
  productos y curva de aprendizaje casi nula.
- **Solo lectura de imágenes.** Las fotos de productos llegan como `image_url`
  desde la API y se pintan con `expo-image` (caché + placeholder). El mobile nunca
  sube imágenes de catálogo.
- **Minimalismo profesional.** Espacio en blanco, jerarquía tipográfica clara,
  un único color de acento (el navy de marca), íconos lineales.

### Stack confirmado ([apps/mobile/package.json](apps/mobile/package.json))

| Capa | Herramienta |
|---|---|
| Runtime / build | **Expo SDK 54**, React Native 0.81, React 19.1 |
| Navegación | **expo-router 4** (file-based) |
| Estilos | **NativeWind 4** (TailwindCSS en RN) |
| Estado global | **zustand 5** |
| HTTP | **axios** |
| Sesión segura | **expo-secure-store** |
| Imágenes | **expo-image** (mostrar) / expo-image-picker (futuro) |
| Mapa / ubicación | **react-native-maps**, expo-location |
| Push | expo-notifications |

---

## 1. Diseño de Arquitectura Base (Frontend Mobile)

### 1.1 Estructura de carpetas

Organización **limpia y modular**: `app/` solo contiene rutas (capa fina);
toda la lógica vive por **dominio** en `features/`, y lo transversal en `shared/`
y `ui/`. Es el mismo espíritu *feature-based* del panel web.

```
apps/mobile/
├─ app.json                 # Config Expo: nombre, slug, scheme, icono, splash
├─ babel.config.js          # preset-expo + nativewind/babel
├─ metro.config.js          # withNativeWind + resolución del monorepo (pnpm)
├─ tailwind.config.js       # Paleta de marca (navy) + fuente Inter
├─ global.css               # Directivas @tailwind
├─ tsconfig.json            # paths "@/*" y "@caserita/*"
├─ .env                     # EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000
├─ assets/                  # icon.png, splash.png, logo_caseritapp.png, Inter/
└─ src/
   ├─ app/                          # ── RUTAS (expo-router) — capa fina ──
   │  ├─ _layout.tsx                # Root: carga fuentes + bootstrap sesión + <Stack>
   │  ├─ index.tsx                  # Redirección inicial → (public)
   │  ├─ (public)/                  # Experiencia del CLIENTE (anónima)
   │  │  ├─ _layout.tsx             # <Tabs>: Explorar · Mapa · Cuenta
   │  │  ├─ index.tsx               # ◀ PRIMERA PANTALLA — Descubrir tiendas
   │  │  ├─ store/[id].tsx          # Detalle de tienda + catálogo
   │  │  └─ account.tsx             # Cuenta / acceso "Soy repartidor"
   │  ├─ (auth)/                    # login.tsx · register-courier.tsx
   │  └─ (courier)/                 # Zona protegida del repartidor (futuro)
   │
   ├─ features/                     # ── LÓGICA POR DOMINIO ──
   │  ├─ stores/
   │  │  ├─ api.ts                  # searchStores(), getStore(), getCatalog()
   │  │  ├─ hooks.ts                # useStores(), useStoreCatalog()
   │  │  └─ types.ts                # Store, Product (alineados con la API)
   │  ├─ auth/
   │  │  ├─ session.store.ts        # zustand: token+user+roles+status
   │  │  └─ api.ts                  # login(), registerCourier(), me()
   │  └─ delivery/                  # vacantes + postulación (futuro)
   │
   ├─ shared/                       # ── TRANSVERSAL (no-UI) ──
   │  ├─ api/client.ts              # Instancia axios + interceptores (Bearer / 401)
   │  ├─ lib/secureToken.ts         # Wrapper de expo-secure-store
   │  └─ config/env.ts              # Lee EXPO_PUBLIC_API_URL
   │
   ├─ ui/                           # ── DESIGN SYSTEM (átomos) ──
   │  ├─ theme.ts                   # Tokens: colores de marca, spacing, radios
   │  ├─ Text.tsx · Button.tsx · Card.tsx · Screen.tsx
   │  └─ RemoteImage.tsx            # expo-image con placeholder/fallback
   │
   └─ components/                   # ── COMPUESTOS (de varios átomos) ──
      ├─ SearchBar.tsx
      ├─ CategoryChips.tsx
      └─ StoreCard.tsx
```

**Regla de dependencias (de afuera hacia adentro):**
`app/` → usa `features/` y `components/` → que usan `shared/` y `ui/`.
Nunca al revés. Así una pantalla no contiene lógica de red, y un componente de UI
no sabe de endpoints.

### 1.2 Cómo se integra con la API (ya existente)

La API de [apps/api](apps/api) ya expone lo que el cliente necesita, **sin login**:

| Necesidad del cliente | Endpoint existente | Capa que lo consume |
|---|---|---|
| Listar / buscar tiendas | `GET /api/stores/search` | `features/stores/api.ts` |
| Categorías / regiones / comunas (filtros) | `GET /api/categories`, `/regions`, `/communes` | `features/stores/api.ts` |
| Detalle de una tienda | `GET /api/stores/:id` | `features/stores/api.ts` |
| **Catálogo de una tienda** | ⚠️ **pendiente** `GET /api/stores/:id/products` | `features/stores/api.ts` |

> ⚠️ **Único bloqueo backend:** hoy `GET /api/products` exige login y solo
> devuelve la tienda del dueño ([products.routes.ts:144](apps/api/src/routes/products.routes.ts#L144)).
> Para que un cliente anónimo vea un catálogo falta un endpoint público. Mientras
> tanto, la pantalla de catálogo puede trabajar con datos del seed. **No bloquea
> la primera pantalla** (que usa `/stores/search`).

**Flujo de datos (una request):**

```
Pantalla (app/**)
   └─ hook (features/*/hooks.ts)
        └─ api (features/*/api.ts)
             └─ shared/api/client.ts  ── axios + Bearer ──▶  apps/api  ──▶  PostgreSQL
```

El `client.ts` es **idéntico en intención** al del web
([apps/web/src/shared/api/client.ts](apps/web/src/shared/api/client.ts)):
un interceptor adjunta el token (cuando exista sesión) y otro hace *logout* ante un
`401`. La única diferencia es que el token se lee de **expo-secure-store**, no de
`localStorage` (ver [docs/AUTH-WEB-VS-MOBILE.md](docs/AUTH-WEB-VS-MOBILE.md)).

> **Nota de red para el QR:** en el teléfono, `localhost` es el propio teléfono.
> Usa la **IP LAN de tu PC**: `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000`. La API
> ya escucha en toda la red y tiene CORS abierto ([app.ts:16](apps/api/src/app.ts#L16)).

---

## 2. Interfaz Visual — Primera Pantalla

### 2.1 Identidad corporativa (extraída del web, fuente de verdad)

Tomada de [apps/web/src/index.css](apps/web/src/index.css). **Misma marca, mismo
navy.** Se replica en `tailwind.config.js` y `ui/theme.ts`.

| Token | HEX | Uso en mobile |
|---|---|---|
| **brand-700** (primario) | `#1e3a5f` | Botón principal, acentos, ícono activo |
| brand-800 (pressed) | `#1a3050` | Estado presionado del botón |
| brand-900 (profundo) | `#0f1d2e` | Cabeceras/superficies oscuras, splash |
| brand-50 (acento suave) | `#eff4fb` | Fondo de chips/íconos (con texto brand-700) |
| background | `#f8fafc` | Fondo de la app |
| card | `#ffffff` | Tarjetas y barra de búsqueda |
| foreground | `#0f172a` | Texto principal |
| muted-foreground | `#64748b` | Texto secundario, subtítulos |
| border | `#e2e8f0` | Bordes y separadores |
| destructive | `#dc2626` | Errores |
| (acento cálido opcional) | `#f59e0b` | Estrellas de rating |

- **Tipografía:** **Inter** (vía `@expo-google-fonts/inter`). Pesos: 400 cuerpo,
  500 etiquetas, 600/700 títulos. Fallback `system-ui`.
- **Radios:** base 10px (`rounded-lg`); tarjetas 16px (`rounded-2xl`).
- **Sombras:** mínimas — preferir `border` slate-200 + sombra muy sutil.

### 2.2 Concepto: **Home "Descubre los comercios de tu barrio"**

La primera pantalla es el **corazón de la experiencia del cliente**: descubrir
tiendas cercanas. Reusa el mensaje de marca del landing web. Debe sentirse
**ligera, ordenada y confiable**.

**Wireframe (vista de teléfono):**

```
┌─────────────────────────────────────┐
│  Caserita        ◍ Concepción, BÍO  │  ← header: logo + ubicación (muted)
│                                       │
│  Descubre los comercios              │  ← título 28/700 foreground
│  de tu barrio                        │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ ⌕  Buscar tiendas o productos   │ │  ← SearchBar: card blanca, borde slate
│  └─────────────────────────────────┘ │
│                                       │
│  ( Todos )( Almacén )( Verdulería )… │  ← CategoryChips (scroll horizontal)
│                                       │
│  Cerca de ti                  Ver +  │  ← sección, label 16/600
│  ┌─────────────────────────────────┐ │
│  │ ▢  Panadería La Esquina         │ │  ← StoreCard
│  │ logo  Panadería · Providencia   │ │     logo (expo-image) + nombre
│  │       ★ 4.8 · Abierto           │ │     categoría·comuna + rating
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ ▢  Verdulería Doña Rosa         │ │
│  │ logo  Verdulería · Santiago     │ │
│  │       ★ 4.6 · Abierto           │ │
│  └─────────────────────────────────┘ │
│                  ⋮                    │  ← lista vertical (FlatList)
├─────────────────────────────────────┤
│   ◉ Explorar      ◌ Mapa     ◌ Cuenta │  ← TabBar: activo en navy
└─────────────────────────────────────┘
```

### 2.3 Anatomía y componentes

| Zona | Componente | Detalle minimalista |
|---|---|---|
| Encabezado | (en la pantalla) | Logo `logo_caseritapp.png` a la izquierda; ubicación con ícono `MapPin` en `muted-foreground`. Sin sombras. |
| Título | `ui/Text` | 28px / peso 700 / `foreground`. Una sola idea, mucho aire alrededor. |
| Búsqueda | `components/SearchBar` | `card` blanca, `border` slate-200, radio 10px, ícono `Search` lineal, placeholder en `muted-foreground`. |
| Categorías | `components/CategoryChips` | Chips `brand-50` + texto `brand-700`; chip activo en `brand-700` + texto blanco. Scroll horizontal, sin barra. |
| Tarjeta tienda | `components/StoreCard` | `card` + `border`, radio 16px, padding 16. Logo cuadrado 56px (`ui/RemoteImage`), nombre 16/600, meta en `muted-foreground`, rating con estrella ámbar. Toca → `store/[id]`. |
| Navegación | `(public)/_layout.tsx` Tabs | 3 ítems, íconos `lucide-react-native`; activo en `brand-700`, inactivo en `muted-foreground`. Fondo blanco, borde superior slate-200. |

**Estados de la pantalla (no olvidar en el prototipo):**
- **Cargando:** *skeletons* de tarjetas (rectángulos `muted`), no spinner a pantalla completa.
- **Vacío:** ilustración/ícono + "Aún no hay tiendas en tu zona".
- **Error:** mensaje breve + botón "Reintentar" (color `destructive` solo en el texto de error).

### 2.4 Por qué este diseño es "minimalista y profesional"

- **Un solo acento** (navy de marca) sobre una base neutra slate → sobrio, no
  infantil. Igual que el panel web.
- **Tarjetas con borde fino** en vez de sombras pesadas → look limpio y plano.
- **Jerarquía por tipografía y espacio**, no por colores chillones.
- **Íconos lineales** (lucide) coherentes con el web.

---

## 3. Puesta en marcha — ver el prototipo por QR

### 3.1 Archivos de configuración (ya creados)

1. **`tailwind.config.js`** — `content: ['./src/**/*.{ts,tsx}']`, `presets:
   [require('nativewind/preset')]`, la escala `brand` (los 10 HEX de §2.1) y
   `fontFamily` por peso de Inter (`sans/medium/semibold/bold`).
2. **`global.css`** — `@tailwind base; @tailwind components; @tailwind utilities;`
3. **`babel.config.js`** — `presets: [['babel-preset-expo', { jsxImportSource:
   'nativewind' }], 'nativewind/babel']`. **No** añadir `react-native-reanimated/plugin`
   a mano: babel-preset-expo (SDK 50+) ya lo inyecta.
4. **`metro.config.js`** — `withNativeWind(config, { input: './global.css' })` +
   `watchFolders = [workspaceRoot]`. En **monorepo pnpm**, NO sobrescribir
   `nodeModulesPaths` (rompe la resolución por symlinks); en su lugar mapear
   `nativewind` y `react-native-css-interop` con `extraNodeModules` (el JSX
   transform de NativeWind los inyecta en todos los módulos).
5. **`app.json`** — `name`, `slug`, `scheme: "caserita"`, `splash` en navy `#0f1d2e`.
6. **`.env`** — `EXPO_PUBLIC_API_URL=http://<IP-LAN-de-tu-PC>:3000` (ver `.env.example`).

> ⚠️ **Compatibilidad de versiones (SDK 54 / Reanimated 4):** `nativewind` en
> **`^4.2.1`** (trae `react-native-css-interop@0.2.x`, que usa `react-native-worklets/plugin`
> — correcto porque Reanimated 4 incluye worklets). Además, en pnpm hay que declarar
> como deps directas de `apps/mobile` los paquetes que el toolchain inyecta y que pnpm
> no expone: **`@babel/runtime`**, **`@expo/metro-runtime`** y **`react-native-worklets`**.
> Todo esto ya está aplicado en el `package.json`. **El proyecto está en SDK 54** para que
> el Expo Go estándar de la tienda (iPhone y Android) sea compatible.

### 3.2 Comandos

```bash
# 1) Instalar dependencias del monorepo
pnpm install

# 2) (opcional pero recomendado) API arriba para datos reales
pnpm --filter api dev          # http://localhost:3000/health → { status: "ok" }

# 3) Levantar Expo (muestra el QR)
pnpm --filter mobile start
```

- **Android:** abrir **Expo Go** → *Scan QR code*.
- **iOS:** abrir la **Cámara** → tocar el banner de Expo.
- **Teléfono y PC deben estar en la misma red Wi-Fi.** Si la red bloquea
  conexiones locales: `pnpm --filter mobile start --tunnel`.

### 3.3 Definición de "listo" del prototipo (Fase 1)

- [ ] La app abre en Expo Go y muestra la Home sin errores.
- [ ] La Home lista tiendas reales desde `GET /api/stores/search`.
- [ ] Buscar y filtrar por categoría actualiza la lista.
- [ ] Tocar una tienda navega a `store/[id]` (catálogo con datos del seed).
- [ ] La identidad visual (navy + Inter + tarjetas limpias) es coherente con el web.

---

## 4. Próximos pasos (fuera de la Fase 1)

1. Backend: endpoint público `GET /api/stores/:id/products` para el catálogo real.
2. Capa de sesión (`secureToken` + `session.store` + interceptor 401) — ver
   [docs/AUTH-WEB-VS-MOBILE.md](docs/AUTH-WEB-VS-MOBILE.md).
3. Pantalla de Mapa (`react-native-maps` + `expo-location`).
4. Flujo del repartidor: login/registro `(auth)` → zona `(courier)` → postulación.

---
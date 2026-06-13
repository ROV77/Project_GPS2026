# Guía de recursos para estilizar el panel web

Recursos y workflow para darle estilo al panel admin de **CaseritApp**.

**Contexto:**

- **Stack:** React 19 + Tailwind CSS 4 + shadcn/ui + `lucide-react` (iconos). Algunos primitivos aún usan Headless UI (migración gradual a shadcn). Ver [`./frontend-shadcn-guia.md`](./frontend-shadcn-guia.md).
- **Dirección visual elegida:** verde esmeralda, cálido y cercano, estilo Shopify / Squarespace.
- **Presupuesto:** todo gratis / open source.
- **Imágenes necesarias:** ilustraciones de estados vacíos, logos y avatares, e imágenes hero/marketing.

> Todas las herramientas listadas tienen una capa de uso gratuito real (no solo "prueba de 7 días"). Cuando una herramienta es freemium, se aclara qué entra en el plan gratis.

---

## 1. De dónde sacar ideas (inspiración UI)

No empieces a diseñar en blanco. Junta primero 5–10 referencias de paneles admin que te gusten y tenlas a la vista.

| Recurso | Para qué sirve | Gratis |
|---|---|---|
| **[Mobbin](https://mobbin.com)** | Capturas reales de apps y paneles web, navegables por flujo. Lo mejor para ver patrones reales. | Capa gratis con login |
| **[Dribbble](https://dribbble.com/search/dashboard)** | Conceptos de dashboards. Inspiración visual (a veces poco realista, pero útil para color y layout). | Sí |
| **[SaaS Landing / Land-book](https://land-book.com)** | Para la parte marketing/login. | Sí |
| **[Page Flows](https://pageflows.com)** | Flujos de producto grabados (onboarding, settings…). | Capa gratis |
| **[UI Sources](https://www.uisources.com)** | Patrones de UX por categoría. | Capa gratis |
| **[Refactoring UI (artículos)](https://www.refactoringui.com/)** | No es galería: son principios de diseño. Lectura obligada para que tu panel se vea "pro" sin ser diseñador. | Blog gratis |

**Cómo usarlo:** crea una carpeta `docs/inspiracion/` o un tablero en Mobbin y guarda capturas. Cuando vayas a estilizar una pantalla (ej. el Dashboard), abre 2–3 referencias de dashboards similares y róbales el layout y el espaciado, no el color.

---

## 2. Paleta de color verde esmeralda

Tu proyecto ya tiene la arquitectura de color correcta: una escala `brand-*` (navy) definida en `apps/web/src/index.css`, que alimenta los tokens semánticos de shadcn (`--primary`, `--ring`, `--sidebar`…). Los componentes la consumen con clases como `bg-primary`, `bg-brand-700`, `bg-sidebar`.

**Esto significa que para cambiar TODO el panel a verde, solo cambias los valores de esa escala.** No tienes que tocar componente por componente.

### Opción rápida: usar la escala `emerald` oficial de Tailwind

Reemplaza el bloque `--brand-*` en `apps/web/src/index.css` (dentro de `:root`) por los valores de `emerald`:

```css
:root {
  --brand-50:  #ecfdf5;
  --brand-100: #d1fae5;
  --brand-200: #a7f3d0;
  --brand-300: #6ee7b7;
  --brand-400: #34d399;
  --brand-500: #10b981;
  --brand-600: #059669;
  --brand-700: #047857; /* primario (botones, item activo) */
  --brand-800: #065f46; /* hover */
  --brand-900: #064e3b; /* sidebar oscuro */
}
```

Con solo eso, el sidebar, los botones primarios y los estados activos pasan a verde, porque los tokens (`--primary`, `--sidebar`…) apuntan a `--brand-*`.

> Hay un valor hardcodeado a revisar: el color de las barras del gráfico en `DashboardPage.tsx` (`fill="#1e3a5f"`, el navy viejo). Cámbialo a `#047857` para que el gráfico también quede verde.

### Herramientas gratis para generar/ajustar la paleta

| Herramienta | Para qué |
|---|---|
| **[UIColors.app](https://uicolors.app/create)** | Pega un color base (ej. `#047857`) y genera la escala 50–950 lista para pegar en Tailwind. Ideal si quieres un verde un poco distinto al `emerald` oficial. |
| **[Tailwind Color Generator (Shadcn)](https://ui.shadcn.com/colors)** | Ver todas las escalas de Tailwind con sus hex, para copiar valores. |
| **[Coolors](https://coolors.co)** | Generar una paleta completa (primario + acentos + neutros) si quieres sumar un color secundario (ej. un dorado/ámbar para "destacado"). |
| **[Realtime Colors](https://realtimecolors.com)** | Previsualizar una paleta sobre una UI de ejemplo antes de comprometerte. |

**Recomendación de acentos para tu caso:** verde esmeralda como primario + un **ámbar/dorado** (`amber-400 #fbbf24`) para destacados (ya usas `tone="gold"` en los Badge de productos destacados). Verde + dorado transmite "comercio cálido y confiable".

---

## 3. Iconos y componentes

### Lo que ya tienes (exprímelo antes de sumar nada)

- **`lucide-react`** — más de 1000 iconos limpios y consistentes. [Buscador](https://lucide.dev/icons/). Ya lo usas en el sidebar y formularios. Para casi todo el panel, alcanza.
- **Headless UI** — componentes accesibles sin estilo (menús, drawers, switches). Ya lo usas en `DropdownMenu`, `Drawer`, `Select`. Tú pones el Tailwind encima.

### Librerías de componentes gratis y compatibles con tu stack

| Librería | Qué es | Cómo encaja |
|---|---|---|
| **[shadcn/ui](https://ui.shadcn.com)** | No es una dependencia: copias el código del componente a tu proyecto. React + Tailwind + Radix. | Perfecto para tu stack. Copia componentes (Dialog, Tabs, Toast…) y adáptalos a tu escala `brand`. |
| **[HyperUI](https://www.hyperui.dev)** | Snippets de Tailwind puro (cards, tablas, formularios, badges) para copiar/pegar. | Cero instalación. Ideal para inspiración de markup. |
| **[Tailwind UI (componentes gratis)](https://tailwindcss.com/plus/ui-blocks/preview)** | De los creadores de Tailwind. Hay bloques gratis. | Referencia de calidad alta. Los de pago no los necesitas. |
| **[Flowbite](https://flowbite.com)** | Componentes Tailwind, varios gratis. | Útil para patrones puntuales. |
| **[Tremor](https://tremor.so)** | Componentes de **dashboards/charts** en React + Tailwind. | Si quieres mejorar los gráficos del Dashboard más allá de `recharts`. |

**Regla:** no instales una librería de componentes completa que pelee con tu Tailwind. Prefiere **copiar/pegar** (shadcn, HyperUI) y adaptar a tus tokens `brand`.

---

## 4. Ilustraciones para estados vacíos

Tu panel ya tiene un componente `EmptyState` (lo usa "Mi Tienda" cuando no hay tienda). Una ilustración lo hace mucho más cálido que solo texto.

| Recurso | Estilo | Gratis |
|---|---|---|
| **[unDraw](https://undraw.co/illustrations)** | Ilustraciones planas, **color personalizable**: pones tu verde `#047857` y todas salen en ese tono. **La mejor opción para ti.** | 100% gratis, sin atribución |
| **[Storyset](https://storyset.com)** | Ilustraciones editables y hasta animables. Personalizas color. | Gratis con atribución |
| **[Open Doodles](https://www.opendoodles.com)** | Estilo dibujado a mano, cálido e informal. | 100% gratis |
| **[Humaaans](https://www.humaaans.com)** | Personas combinables (mezclas poses/ropa). | 100% gratis |
| **[DrawKit](https://www.drawkit.com)** | Packs de ilustraciones, varios gratis. | Mixto (filtra "free") |

**Workflow recomendado:**

1. Entra a **unDraw**, pon tu color de marca (`#047857`) arriba.
2. Busca por concepto: "empty", "no data", "store", "shopping".
3. Descarga el **SVG**.
4. Guárdalo en `apps/web/src/assets/illustrations/` e impórtalo en tu componente `EmptyState`.

Empareja cada estado vacío con su ilustración: sin productos → ilustración de caja vacía; sin tienda → ilustración de tienda; sin resultados → ilustración de búsqueda.

---

## 5. Logos y avatares

Para placeholders de logo de tienda y avatares de usuario cuando no hay imagen subida.

| Recurso | Qué genera | Cómo se usa |
|---|---|---|
| **[DiceBear](https://www.dicebear.com)** | Avatares generados por una semilla (el nombre o id del usuario). Muchos estilos. | API por URL, sin backend. Ver ejemplo abajo. |
| **[Boring Avatars](https://boringavatars.com)** | Avatares geométricos de colores (estilo gradient/beam). Hay paquete React. | `npm i boring-avatars` o por URL. |
| **[UI Avatars](https://ui-avatars.com)** | Iniciales sobre fondo de color. Lo más simple y clásico. | Solo una URL con el nombre. |
| **[Logo placeholder con iniciales]** | Hazlo tú con un `div` Tailwind (ya lo haces en el sidebar: el círculo `bg-brand-700` con el ícono `User`). | Cero dependencias. |

**Ejemplo — avatar con fallback a iniciales (encaja con tu `AdminLayout`):**

```tsx
// El sidebar ya muestra un círculo con ícono cuando no hay avatar.
// Para mejorarlo con DiceBear basado en el nombre del usuario:
const avatarUrl = user?.avatar_url
  ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.name ?? 'U')}&backgroundColor=047857`;

<img src={avatarUrl} alt={user?.name ?? 'Usuario'} className="size-8 rounded-full" />
```

Para **logos de tienda**, mientras el comercio no suba uno, muestra las iniciales del nombre de la tienda sobre un fondo `brand` — consistente y cero peticiones externas.

---

## 6. Imágenes hero / marketing

Para el `AuthLayout` (pantalla de login) o si más adelante haces una landing.

### Stock gratis (fotos reales)

| Banco | Notas |
|---|---|
| **[Unsplash](https://unsplash.com)** | El mejor banco gratis. Busca "small business", "local store", "market", "food market". Sin atribución obligatoria. |
| **[Pexels](https://www.pexels.com)** | Fotos y videos gratis. Buen catálogo de comercio local y comida. |
| **[Burst (Shopify)](https://burst.shopify.com)** | De Shopify, **orientado a e-commerce y pequeños negocios**. Muy alineado con CaseritApp. |
| **[Pixabay](https://pixabay.com)** | Gran volumen, calidad variable. |

### IA de imágenes gratis (para cosas a medida)

| Herramienta | Capa gratis |
|---|---|
| **[Microsoft Designer / Bing Image Creator](https://designer.microsoft.com)** | Gratis con cuenta Microsoft (usa DALL·E). Bueno para ilustraciones e imágenes conceptuales. |
| **[Leonardo.ai](https://leonardo.ai)** | Créditos diarios gratis. Buena calidad. |
| **[Ideogram](https://ideogram.ai)** | Capa gratis. El mejor para imágenes **con texto** dentro. |
| **[Google Gemini / Imagen](https://gemini.google.com)** | Generación de imágenes gratis con cuenta Google. |

> **Tip de prompt para tu marca:** "warm minimal illustration of a small local store, emerald green palette, flat style, soft lighting" — mantén "emerald green" en el prompt para que combine con el panel.

### Optimización (importante para que la web no pese)

| Herramienta | Para qué |
|---|---|
| **[Squoosh](https://squoosh.app)** | Comprime imágenes en el navegador. Exporta a **WebP** (mucho más liviano que JPG/PNG). |
| **[SVGOMG](https://jakearchibald.github.io/svgomg/)** | Optimiza los SVG de unDraw antes de meterlos al repo. |
| **[TinyPNG](https://tinypng.com)** | Compresión rápida de PNG/JPG. |

**Regla:** toda imagen que entre al repo pásala por Squoosh y guárdala en WebP. Las ilustraciones, en SVG optimizado.

---

## 7. Skills y herramientas de IA para diseñar

### Skills de Claude Code que aplican aquí

- **`/brainstorming`** (esta sesión) — para explorar diseño antes de programar.
- **`react-native-best-practices`** — aplica a la app móvil, no al panel web, pero útil si tocas performance en RN.
- Para **implementar** el restyle: pídeme directamente "aplica la paleta verde al panel" y lo programamos juntos siguiendo esta guía.

### Herramientas de IA para generar UI / código de componentes (gratis)

| Herramienta | Qué hace | Capa gratis |
|---|---|---|
| **[v0.dev](https://v0.dev)** (Vercel) | Describes un componente y genera código React + Tailwind + shadcn. **Encaja con tu stack.** | Créditos gratis mensuales |
| **[Lovable](https://lovable.dev)** | Genera apps/UI completas con IA. | Capa gratis limitada |
| **[shadcn/ui Themes](https://ui.shadcn.com/themes)** | Generador visual de temas (color, radius) que exporta variables CSS. | Gratis |

**Cómo usar v0 con tu proyecto:** pídele un componente (ej. "card de KPI con icono, verde esmeralda"), copia el código, y adáptalo a tu escala `brand` y a tus componentes `shared/ui` existentes. No pegues el código tal cual: alinéalo con tus patrones (`Card`, `cn`, etc.).

---

## 8. Workflow recomendado (cómo encadenar todo)

Para cada pantalla que quieras estilizar, sigue este flujo:

```
1. INSPIRACIÓN   → Abre 2–3 referencias en Mobbin/Dribbble de una pantalla similar.
                   Roba layout y espaciado, no el color.

2. COLOR         → Ya tienes los tokens de marca en src/index.css (sección 2).
                   Usa siempre las clases brand-* y los neutros slate-*.

3. ESTRUCTURA    → Reusa tus componentes de shared/ui (Card, Button, Table…).
                   Si falta uno, cópialo de shadcn/HyperUI y adáptalo a brand-*.

4. IMÁGENES      → Estados vacíos: SVG de unDraw en tu verde.
                   Avatares/logos: DiceBear o iniciales.
                   Hero/login: Unsplash/Burst → Squoosh → WebP.

5. PULIDO        → Aplica los principios de Refactoring UI:
                   - Espaciado generoso y consistente (la escala de Tailwind).
                   - Jerarquía con peso y color, no solo tamaño.
                   - Sombras suaves, bordes sutiles (slate-200).
                   - Estados hover/focus en todo lo clickeable.

6. OPTIMIZA      → Imágenes a WebP, SVG por SVGOMG.

7. IMPLEMENTA    → Pídeme aplicar los cambios al código siguiendo esta guía.
```

### Prioridad sugerida (qué tocar primero)

1. **Cambiar la paleta a verde** en `src/index.css` (bloque `--brand-*`) + el `fill` del gráfico → impacto inmediato en todo el panel, 5 minutos.
2. **Estados vacíos con ilustraciones** de unDraw → calidez instantánea.
3. **Avatares/logos** con fallback a iniciales/DiceBear.
4. **Pulido de spacing y sombras** pantalla por pantalla con los principios de Refactoring UI.
5. **Login (`AuthLayout`)** con una imagen hero de Unsplash/Burst.

---

## Resumen de enlaces (todo gratis)

- **Inspiración:** Mobbin · Dribbble · Refactoring UI
- **Color:** UIColors.app · Realtime Colors · escala `emerald` de Tailwind
- **Componentes:** lucide-react · Headless UI · shadcn/ui · HyperUI · Tremor
- **Ilustraciones:** unDraw · Storyset · Open Doodles
- **Avatares/logos:** DiceBear · Boring Avatars · UI Avatars
- **Fotos:** Unsplash · Pexels · Burst
- **IA imágenes:** Bing Image Creator · Leonardo.ai · Ideogram
- **IA componentes:** v0.dev · shadcn Themes
- **Optimización:** Squoosh · SVGOMG · TinyPNG

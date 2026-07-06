# Sistema de Diseño de CaseritApp — Brief de contexto para el Capítulo 4

> **Propósito de este documento.** Este archivo NO es el capítulo final: es un **brief de contexto** para traspasar a otro proyecto (el repositorio LaTeX que contiene el `main` del informe). El objetivo es que Claude, en ese otro proyecto, disponga de **datos verificados contra el código real** de CaseritApp para redactar un Capítulo 4 («Documentos Adicionales a la Ingeniería de Software») completo, preciso y sin inventar valores.
>
> Todo lo que aparece aquí fue extraído del código fuente del repositorio `Project_GPS2026` (rutas citadas entre paréntesis). Las secciones 1–3 son el **contenido factual** (paleta, tipografía, composición). La sección 4 da el **contexto técnico** de apoyo. La sección 5 entrega las **reglas e instrucciones** de cómo usar todo esto al escribir el capítulo en LaTeX.
>
> ⚠️ **Advertencia de fidelidad.** Una versión previa de este capítulo contenía una paleta **inventada** (color primario naranjo `#F26522`, secundario verde, 4 pestañas en el móvil). **Todo eso es falso.** La marca real es **navy `#1e3a5f`**, los neutros son *slate*, y el móvil tiene **3 pestañas**. No reintroducir los datos ficticios.

---

## 1. Paleta de Colores

La identidad cromática de CaseritApp se construye sobre una **escala de marca *navy* (azul profundo)**, que transmite confianza, seriedad y profesionalismo. La marca se define como una escala de diez pasos (`brand-50` … `brand-900`), lo que permite derivar estados (reposo, *hover*, presionado, superficies oscuras) de forma consistente. Sobre esta base se apoya un conjunto de neutros de la familia *slate* para texto, fondos y bordes, y una paleta funcional derivada del **semáforo de disponibilidad**, uno de los elementos diferenciadores del producto.

**Fuente única de verdad:** la escala se define en `apps/web/src/index.css` (variables CSS) y se replica de forma espejada en `apps/mobile/tailwind.config.js` y en los tokens JS de `apps/mobile/src/ui/theme.ts`. Cambiar la marca = editar un único conjunto de valores; web y móvil quedan sincronizados.

### Escala de marca (navy)

| Token | Hex | Uso principal |
| :--- | :---: | :--- |
| `brand-50` | `#eff4fb` | Fondos suaves y estados sutiles. |
| `brand-100` | `#dbe6f4` | Superficies destacadas claras. |
| `brand-200` | `#bccfe9` | Bordes y acentos claros. |
| `brand-300` | `#92aed8` | Elementos secundarios. |
| `brand-400` | `#6286c2` | Íconos y detalles. |
| `brand-500` | `#3f66a8` | Anillo de foco (*ring*), *badge* de tienda verificada. |
| `brand-600` | `#2f4f86` | Transición hacia tonos oscuros. |
| **`brand-700`** | `#1e3a5f` | **Primario:** botones, ítem de navegación activo, llamados a la acción. |
| `brand-800` | `#1a3050` | Estado *hover* / presionado. |
| `brand-900` | `#0f1d2e` | Superficies oscuras: *sidebar* del panel web, *splash*. |

### Neutros y tokens semánticos (slate)

Los neutros estructuran la jerarquía visual del contenido y los fondos. Se exponen como tokens semánticos (convención de shadcn/ui) para desacoplar el color de su intención de uso.

| Token | Hex | Uso principal |
| :--- | :---: | :--- |
| `background` | `#f8fafc` | Fondo de pantallas y superficies base. |
| `foreground` | `#0f172a` | Titulares y cuerpo de texto. |
| `card` | `#ffffff` | Fondo de tarjetas y superficies elevadas. |
| `muted` | `#f1f5f9` | Fondos secundarios y separadores. |
| `muted-foreground` | `#64748b` | Descripciones, metadatos y textos de apoyo. |
| `border` | `#e2e8f0` | Bordes de tarjetas, *inputs* y divisores. |
| `input` | `#cbd5e1` | Bordes de campos de formulario. |
| `destructive` | `#dc2626` | Acciones destructivas (eliminar, cancelar). |
| `amber` | `#f59e0b` | Estrellas de valoración (*rating*) y avisos puntuales. |

### Colores funcionales: semáforo de disponibilidad

El indicador de estado de tres colores comunica de inmediato la operación de cada emprendimiento. **El estado se calcula en el backend** (`apps/api/src/services/store-status.service.ts`) a partir de la hora del servidor en zona horaria de Chile (`America/Santiago`) y los horarios configurados por la tienda, con soporte para jornadas que cruzan la medianoche. El umbral de «cierre próximo» es de **30 minutos**.

| Estado (código) | *color* | Etiqueta en UI | Significado |
| :--- | :---: | :--- | :--- |
| `open` | `green` | «Abierto» | Operativo; faltan más de 30 min para cerrar. |
| `closing_soon` | `yellow` | «Cierra pronto» | Abierto, pero a 30 min o menos del cierre. |
| `closed` | `red` | «Cerrado» | Fuera de horario, día marcado como cerrado o sin horario configurado. |

En el *frontend* estos estados se materializan con las familias de color estándar de Tailwind (`green`, `amber`/`yellow`, `red`), reutilizándose como tono semántico en *badges* y mensajes de sistema (éxito, advertencia, error).

### Colores por categoría (marcadores del mapa)

En la vista de mapa del móvil, cada emprendimiento se representa con un ícono y color según su rubro (`apps/mobile/src/features/stores/categoryStyle.ts`). El match es por palabra clave sobre el nombre de la categoría; un rubro desconocido recae en un ícono genérico de tienda en *navy* (`brand-500`).

| Rubro | Color | Rubro | Color |
| :--- | :---: | :--- | :---: |
| Comida / restaurantes | `#ea580c` | Almacén / minimarket | `#2563eb` |
| Panadería / pastelería | `#b45309` | Ropa / vestuario | `#9333ea` |
| Verdulería / feria | `#16a34a` | Ferretería / construcción | `#475569` |
| Belleza / peluquería | `#db2777` | *(fallback)* Tienda genérica | `#3f66a8` |

**Accesibilidad:** la combinación texto principal (`#0f172a`) sobre fondo (`#f8fafc`) satisface con holgura el contraste **AA** de las pautas **WCAG 2.1**, favoreciendo a usuarios con baja visión.

---

## 2. Tipografía

CaseritApp adopta una única familia sans-serif, **Inter**, para todas sus interfaces: diseñada para pantallas, con excelente legibilidad en tamaños pequeños y amplia disponibilidad de pesos. En el móvil cada peso se carga como fuente independiente (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`; paquete `@expo-google-fonts/inter`). En la web se define una pila de respaldo del sistema: `Inter, system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif`.

La jerarquía se centraliza en un componente `Text` con variantes (`apps/mobile/src/ui/Text.tsx`), garantizando una escala coherente. Tamaño e interlineado en puntos escalables.

| Variante | Peso | Tamaño / Interlineado | Uso |
| :--- | :---: | :---: | :--- |
| `title` | Bold (700) | 28 / 34 | Encabezados de pantalla. |
| `heading` | SemiBold (600) | 18 / 24 | Secciones y agrupaciones. |
| `subtitle` | SemiBold (600) | 16 / 22 | Nombre de tiendas y productos (títulos de tarjeta). |
| `body` | Regular (400) | 15 / 21 | Texto general y descripciones. |
| `label` | Medium (500) | 13 / 18 | Etiquetas y metadatos (color atenuado). |
| `caption` | Regular (400) | 12 / 16 | Notas, valoraciones y ayudas (color atenuado). |

Se limita a cuatro pesos activos (Regular, Medium, SemiBold, Bold) para mantener consistencia y optimizar recursos. `label` y `caption` usan por defecto `muted-foreground`, reforzando la jerarquía sin reglas extra.

---

## 3. Composición de las Interfaces

El sistema distingue dos experiencias complementarias: la **aplicación móvil**, orientada al descubrimiento y consumo por parte de clientes, y el **panel web**, orientado a la gestión por parte de emprendedores y repartidores.

### Principios de composición

- **Tokens compartidos entre plataformas:** color, tipografía y radios se definen una sola vez (en la web) y se replican en el móvil; ambos *frontends* comparten literalmente la misma identidad.
- **Diseño basado en tarjetas:** tiendas y productos se presentan en tarjetas (*cards*) autocontenidas que agrupan imagen, título, metadatos (categoría · comuna) y valoración, facilitando el escaneo visual.
- **Radio de esquinas consistente:** radio base de **10 px** (`rounded-lg`), aplicado a botones, tarjetas, campos e íconos.
- **Un único acento de color:** el *navy* de marca (`brand-700`) es el único acento; guía la atención hacia la acción principal y evita la sobrecarga cognitiva. El resto se apoya en neutros.
- **Componentes reutilizables:** botones, campos, *badges* de estado y tarjetas son componentes atómicos compartidos —kit propio de UI en el móvil (`src/ui/`) y kit propio Tailwind + Headless UI en la web—, coherentes con la arquitectura *monorepo*.
- **Sin modo oscuro activo:** los tokens de tema oscuro están preparados en el código, pero la interfaz opera solo en tema claro.

### Estructura de navegación

**Aplicación móvil** — barra de pestañas inferior (*bottom tab bar*) de **tres destinos**, siempre accesibles con el pulgar (uso con una mano). Ítem activo en *navy* (`brand-700`), inactivos en gris atenuado (`apps/mobile/src/app/(public)/_layout.tsx`):

- **Explorar** (ícono *Compass*) — listado de emprendimientos.
- **Mapa** (ícono *Map*) — descubrimiento geográfico con marcadores por categoría.
- **Cuenta** (ícono *User*) — perfil; muestra un aviso «!» cuando no hay sesión.

**Panel web** — barra lateral (*sidebar*) colapsable sobre fondo *navy* oscuro (`brand-900`), con barra superior (*header*) que lleva título de sección, notificaciones y menú de usuario. El ítem activo se deriva de la URL (`apps/web/src/layouts/AdminLayout.tsx`, `apps/web/src/shared/config/navigation.tsx`).

| Plataforma | Pantalla | Elementos de composición |
| :--- | :--- | :--- |
| Móvil | Explorar | Buscador superior, *chips* de categoría y listado de tarjetas de tienda con valoración. |
| Móvil | Mapa | Marcadores por categoría con *clustering* y hoja de detalle (*bottom sheet*) con estado de semáforo. |
| Móvil | Detalle de tienda | Cabecera con logo, estado y categoría; ubicación, contacto y listado de productos. |
| Móvil | Cuenta | Perfil, avatar e ingreso/registro (*login*, *onboarding*). |
| Web | Dashboard | Tarjetas de métricas (KPI) y gráficos analíticos (datos mock por ahora). |
| Web | Mi Tienda | Perfil único del comercio: datos, editor de horarios y selección de ubicación en mapa. |
| Web | Productos | Tabla de catálogo con creación, edición y baja lógica mediante *drawer* lateral. |
| Web | Repartidores | Pestañas de vacantes, bandeja de postulaciones y valoraciones. |
| Web | Planes | Gestión de suscripción del comercio (integración de pagos con Mercado Pago). |

---

## 4. Contexto técnico de apoyo (para enmarcar el capítulo)

Datos verificados en `apps/*/package.json` y `apps/web/ARCHITECTURE.md`. Útiles si el capítulo necesita justificar decisiones o citar el stack.

- **Monorepo** con tres apps: `apps/api` (backend REST), `apps/web` (panel admin), `apps/mobile` (app cliente). Paquetes compartidos en `packages/` (destaca `@caserita/validations` con reglas Zod que **usan tanto backend como frontend**, sin reimplementar).
- **Móvil:** React Native `0.81.5` + Expo `~54` + expo-router (navegación por archivos) + **NativeWind** (Tailwind en RN) + `react-native-maps` con *clustering* + `@gorhom/bottom-sheet` + Zustand (estado) + `expo-secure-store` (token). Íconos: `lucide-react-native`.
- **Web:** React `19` + Vite `6` + **Tailwind CSS** + Headless UI (primitivas accesibles) + TanStack Query v5 (server state) + Zustand (sesión) + react-hook-form + Zod + Recharts (gráficos) + react-router-dom v7 + Leaflet (mapa). Íconos: `lucide-react`.
- **Modelo de negocio:** una cuenta = **una sola tienda** (por eso «Mi Tienda» es un perfil único, no una lista). El panel web NO es un sistema de pedidos: gestiona catálogo, tienda, repartidores y planes.
- **Estado de madurez:** hay features 100% reales conectadas a la API (productos, tiendas, planes, horarios, repartidores) y otras con datos *mock* o pendientes de backend (autenticación real, analytics del dashboard, promociones). Conviene ser honesto sobre esto si el capítulo lo menciona.
- **Marca / logo:** navy con degradado en el *login split-screen*; logo `logo-caseritapp_navy.png`. El nombre nace del concepto chileno **«el caserito»** (cercanía del comercio de barrio).

---

## 5. Puntos clave y reglas para desarrollar el Capítulo 4

Instrucciones para Claude (o quien redacte) en el proyecto LaTeX. El capítulo se titula **«Documentos Adicionales a la Ingeniería de Software»** y su núcleo es el **sistema de diseño** (secciones 1–3 de este brief).

### 5.1 Reglas de fidelidad (no negociables)

1. **Usar SOLO los valores de este brief.** Todos los hex, tamaños y nombres provienen del código real. No inventar colores, tipografías ni pantallas.
2. **La marca es navy `#1e3a5f`, no naranjo.** No existe un «secundario verde de emprendimiento». El verde solo aparece en el semáforo (`open`).
3. **El móvil tiene 3 pestañas** (Explorar, Mapa, Cuenta), no 4. No inventar «Notificaciones» ni «Búsqueda» como pestañas.
4. **El semáforo se calcula en el backend**, con umbral de 30 min y zona horaria de Chile. No presentarlo como simples hex estáticos.
5. **Ser honesto sobre el estado**: si se mencionan dashboard o autenticación, notar que hoy usan datos mock / login simulado (ver sección 4).

### 5.2 Qué incluir para que el capítulo quede completo

- **Introducción** que conecte el sistema de diseño con la ingeniería de software: por qué un *design system* reduce fricción, refuerza marca y facilita escalabilidad en un equipo que trabaja en paralelo (monorepo).
- **Sección de Paleta** (marca + neutros + semáforo + categorías) — es el material más sólido; conviene apoyarlo con **muestras de color reales** (ver 5.3).
- **Sección de Tipografía** con la escala Inter y la justificación de limitar a 4 pesos.
- **Sección de Composición** con principios + tablas de navegación y pantallas por plataforma.
- **Fuente única de verdad** como hilo conductor: es el argumento de ingeniería más fuerte (un solo lugar define la marca; web y móvil se sincronizan).
- **Accesibilidad (WCAG 2.1 AA)** como criterio de diseño, no como adorno.
- **Cierre** que resuma el valor del sistema de diseño para el proyecto.

### 5.3 Convenciones LaTeX sugeridas

- Definir los colores con `\definecolor{caseritobrand}{HTML}{1E3A5F}` (etc.) en el preámbulo, y usar `\cellcolor{...}` en la columna «Muestra» de cada tabla para mostrar el color real (el `.md` usa emojis como sustituto; en LaTeX SÍ se pueden pintar celdas).
- Tablas con `booktabs` (`\toprule`/`\midrule`/`\bottomrule`) y `\renewcommand{\arraystretch}{1.4}` para aire vertical.
- Para las muestras de color, una columna estrecha centrada (`C{2cm}`) con la celda pintada; los hex en `\texttt{}`.
- Usar `\ref{}`/`\label{}` para enlazar cada tabla desde el texto, y `Sección~\ref{sec:analisis-diseno}` para cruzar con el capítulo de análisis y diseño ya existente en el `main`.
- Términos en inglés (*design system*, *card*, *bottom tab bar*, *sidebar*) en `\textit{}`.
- Mantener el registro formal y académico del resto del informe.

### 5.4 Ganchos de ampliación (opcionales, si se quiere un capítulo más rico)

Estos temas también son «documentos adicionales a la ingeniería de software» y podrían sumar secciones si el capítulo lo requiere. Verificar en el repo antes de desarrollarlos a fondo:

- **Iconografía:** set Lucide en ambas plataformas (`lucide-react` / `lucide-react-native`) — consistencia visual del sistema de íconos.
- **Componentes atómicos / *design tokens*:** documentar el radio (10 px), el espaciado basado en la escala de Tailwind y el catálogo de componentes reutilizables (Button, Card, Input, Badge, Drawer, Table…).
- **Guía de contenido / *tono de voz*:** etiquetas en español de Chile («Cierra pronto», «Nuevo», estados vacíos amables).
- **Validaciones compartidas** (`@caserita/validations`): un mismo esquema Zod valida en cliente y servidor — buen ejemplo de coherencia entre capas.
- **Estándares de accesibilidad** más allá del contraste: roles y estados accesibles (`accessibilityRole`, `accessibilityState`) ya presentes en el `Button` del móvil.

> **Nota:** la `CLAUDE.md` de la raíz del repo está **desactualizada** (afirma que solo `/src` tiene código real). En realidad `apps/api`, `apps/web` y `apps/mobile` están ampliamente desarrollados; este brief refleja el estado actual del código.

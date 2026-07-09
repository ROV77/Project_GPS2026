# Migración a Tailwind v4 + adopción de shadcn/ui — Diseño

**Fecha:** 2026-06-13
**App afectada:** `apps/web` (panel administrativo CaseritApp)
**Estado:** Diseño aprobado, pendiente de plan de implementación

---

## 1. Problema y contexto

`apps/web` se construyó con **Tailwind CSS v3** y un **kit de UI propio** en `src/shared/ui/`
(18 primitivos: Button, Card, Input, Select, Drawer, Table, etc.), estilado 100% con Tailwind y
themado mediante una escala `brand-*` (navy) en `tailwind.config.js`. Está documentado en
`docs/frontend-web-arquitectura.md` (§1, §8) y `docs/frontend-recursos-estilo.md`.

Recientemente se ejecutó `pnpm dlx shadcn@latest init` (preset Radix / Nova / Lucide), que dejó
el proyecto en un **estado intermedio inconsistente**:

- Un mundo paralelo de UI en `src/components/ui/` (`button.tsx`) junto al kit existente en
  `src/shared/ui/`.
- Un segundo helper `cn` en `@/lib/utils` (el kit usaba `@/shared/lib/cn`, importado en 19 archivos).
- Un sistema de theming distinto: variables CSS de shadcn (`--primary`, `--foreground`… en oklch
  **neutral**) que no conocen la paleta `brand-*` navy.
- shadcn v4 usa un enfoque CSS-first pensado para **Tailwind v4**, incompatible "out of the box" con
  v3. Hubo que parchear `tailwind.config.js` a mano para mapear las variables y que el dev server
  arrancara.

Este diseño resuelve el estado intermedio: migra el build a **Tailwind v4**, deja shadcn
**correctamente configurado**, unifica los sistemas duplicados (UI, `cn`, theming) y arranca la
adopción gradual de shadcn como kit oficial.

## 2. Objetivos

1. Migrar el build de `apps/web` de Tailwind v3 a **Tailwind v4** (config CSS-first, plugin de Vite).
2. Dejar **shadcn v4 correctamente soportado** (eliminar el parche manual de `tailwind.config.js`).
3. **Una sola fuente de verdad** para color: la marca navy alimenta los tokens semánticos de shadcn.
4. **Un solo** helper `cn` y **un solo** hogar para los primitivos visuales.
5. Convertir un primer lote de componentes (Button, Card, Input, Badge) a shadcn **sin romper** a sus
   consumidores.
6. Documentar para el equipo cómo usar shadcn en el desarrollo del frontend.

### No-objetivos (YAGNI)

- **No** convertir los 18 primitivos de una vez: solo el primer lote; el resto es migración gradual.
- **No** implementar dark mode real (toggle + estilos): se conservan los tokens `.dark` sin activarlos.
- **No** cambiar el color de marca: el navy actual se conserva (solo se reubica en el sistema de tokens).
- **No** mover `shared/components` ni reorganizar `features/`.

## 3. Decisiones de diseño (acordadas)

| # | Decisión | Elección |
|---|---|---|
| 1 | Convivencia kit propio ↔ shadcn | **shadcn pasa a ser el kit oficial**; `shared/ui` se migra gradualmente a `components/ui` |
| 2 | Theming | La escala **`brand-*` navy alimenta los tokens shadcn** (`--primary`, `--ring`, `--sidebar`…); un solo sistema semántico |
| 3 | Color de marca | **Navy actual** (`brand-700 = #1e3a5f`); solo se reubica, sin cambio visual |
| 4 | Alcance de la primera implementación | Fundación **+ convertir Button, Card, Input, Badge** |
| 5 | Dark mode | **Conservar los tokens `.dark`** generados por shadcn, **sin activarlo** |
| 6 | Hogar de los primitivos | **`src/components/ui/`** (convención shadcn; `components.json` ya apunta ahí) |
| 7 | Composiciones del panel | **Quedan en `src/shared/components/`** (PageHeader, KpiCard, ConfirmDelete) |

## 4. Estructura de carpetas objetivo

```
apps/web/src/
├── components/ui/      ← ÚNICO hogar de primitivos (shadcn). El "design system".
├── shared/
│   ├── components/      ← composiciones del panel (PageHeader, KpiCard, ConfirmDelete)
│   ├── api/ hooks/ lib/ config/   ← lógica reutilizable NO visual
│   └── ui/             ← se vacía durante la migración gradual; se elimina al terminar
├── lib/utils.ts        ← cn canónico (estándar shadcn)
├── layouts/  features/
```

Límite conceptual: `components/ui` = primitivos genéricos del design system; `shared/components` =
composiciones específicas del negocio; `shared/` (resto) = lógica compartida no visual.

## 5. Diseño técnico

### 5.1 Build: Tailwind v3 → v4

| Archivo | Cambio |
|---|---|
| `package.json` | `tailwindcss@^4`; agregar `@tailwindcss/vite`; quitar `autoprefixer` y `postcss` (v4 los incluye) |
| `vite.config.ts` | Agregar el plugin `@tailwindcss/vite` al array `plugins` (junto a `react()`) |
| `postcss.config.js` | **Eliminar** |
| `tailwind.config.js` | **Eliminar** (en v4 el tema vive en CSS; el parche manual desaparece con él) |

El alias `@ → src` (en `vite.config.ts` y `tsconfig.json`) **no cambia**.

### 5.2 Theming CSS-first (`src/index.css`)

`index.css` se reescribe al patrón v4. La escala `brand-*` navy se conserva como **valores reales** y
alimenta los tokens semánticos de shadcn:

```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

:root {
  /* Escala brand navy — fuente real del color de marca */
  --brand-50: #eff4fb;
  /* … 100..800 … */
  --brand-700: #1e3a5f;
  --brand-900: #0f1d2e;

  /* Tokens semánticos shadcn apuntando a la marca / neutros slate */
  --primary: var(--brand-700);
  --primary-foreground: #ffffff;
  --ring: var(--brand-500);
  --sidebar: var(--brand-900);
  /* background, foreground, card, popover, secondary, muted, accent,
     destructive, border, input, radius… (neutros) */
}

.dark {
  /* Bloque generado por shadcn. Se CONSERVA pero NO se activa (sin toggle). */
}

@theme inline {
  /* Expone la escala brand-* como utilidades (bg-brand-700, etc.) */
  --color-brand-50: var(--brand-50);
  /* … */
  --color-brand-900: var(--brand-900);
  /* Expone los tokens semánticos (bg-primary, text-foreground, border-border…) */
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-sidebar: var(--sidebar);
  /* … resto de tokens … */
}
```

Resultado: `bg-primary` = navy de marca; `bg-brand-700` sigue funcionando; cambiar la marca (p. ej. a
verde esmeralda en el futuro) es editar **un solo bloque** de variables.

### 5.3 Consolidación del helper `cn`

- `@/lib/utils` queda como **canónico** (estándar shadcn; es a donde apuntan los componentes generados).
- `@/shared/lib/cn` se convierte en **re-export** de `@/lib/utils` (shim temporal) para no tocar los
  19 imports de golpe.
- Los imports se migran de forma oportunista; al completar la migración del kit, se elimina el shim.

### 5.4 Auditoría de clases renombradas en v4

Barrido mecánico de los call-sites afectados (~2 docenas, 17 archivos). Renombres relevantes:

- `shadow` → `shadow-sm`; `shadow-sm` → `shadow-xs`
- `rounded` → `rounded-sm`; `rounded-sm` → `rounded-xs`
- `blur-sm` → `blur-xs`
- `outline-none` → `outline-hidden`
- revisar `ring-offset-*` y el color de borde por defecto (v4 usa `currentColor`; el `* { border-border }`
  de la capa base de shadcn lo cubre).

Validación: `pnpm --filter web lint` (`tsc --noEmit`) y `pnpm --filter web build` deben pasar.

### 5.5 Conversión del primer lote (Button, Card, Input, Badge)

Para cada componente: traer/ajustar la versión shadcn en `src/components/ui/`, **adaptar sus variantes a
la API actual** para no romper a los 11 consumidores (`import … from '@/shared/ui'`), y repuntar imports.

- **Button** (`components/ui/button.tsx`, ya presente): mapear las variantes actuales
  (`primary | default | danger | ghost`), tamaños (`sm | md`) y la prop `loading` (spinner `Loader2`).
- **Card**: preservar la prop `title` que usan las páginas.
- **Input**: preservar `invalid` y `prefix` (adorno izquierdo).
- **Badge**: mapear los `tone` (`gray | green | gold | red | blue`) a variantes shadcn.

Los otros 14 primitivos de `shared/ui` quedan **intactos y funcionando** (consumen los mismos tokens) y
se migran después. Cada conversión actualiza el `export` correspondiente para que los consumidores no
cambien su forma de importar, o se repuntan los imports en el mismo paso.

### 5.6 Documentación

- **Nuevo** `docs/frontend-shadcn-guia.md` (entregable de la implementación): qué es shadcn (se copia
  código, no es dependencia), cómo agregar componentes (`pnpm dlx shadcn@latest add …`), dónde viven
  (`components/ui`), relación con los tokens navy, convención de `cn`, patrón para adaptar variantes sin
  romper consumidores, y el estado de la migración gradual `shared/ui → components/ui`.
- **Actualizar** `docs/frontend-web-arquitectura.md` (§1 y §8) y las menciones en
  `docs/frontend-recursos-estilo.md` que dicen "Tailwind 3" / "todos los componentes son propios", para
  que no contradigan el nuevo enfoque.

## 6. Plan de validación

No hay tests automatizados aún (el script `test` de Vitest existe pero sin specs). La validación es:

1. `pnpm --filter web lint` (type-check estricto) sin errores.
2. `pnpm --filter web build` exitoso.
3. `pnpm --filter web dev` y revisión visual: login, sidebar (navy), dashboard, tabla de productos,
   drawer de producto, botones/cards/inputs/badges del primer lote se ven igual o mejor que antes.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper consumidores al convertir componentes | Adaptar variantes a la API actual; validar con `tsc` (detecta props faltantes) |
| Clases v4 renombradas que pasan desapercibidas | Barrido explícito (§5.4) + revisión visual |
| Monorepo de equipo: cambia el build de `apps/web` | Comunicar el cambio; PR enfocado y revisable |
| Dos `cn` conviviendo confunden | Shim de re-export + nota en la guía; eliminar al final de la migración |

## 8. Trabajo futuro (fuera de alcance)

- Migrar los 14 primitivos restantes de `shared/ui` a `components/ui` y eliminar `shared/ui` + el shim `cn`.
- Eventual cambio de marca a verde esmeralda (editar el bloque de variables en `index.css`).
- Dark mode real (toggle + auditoría visual en oscuro).
- Tests de componentes con Vitest.

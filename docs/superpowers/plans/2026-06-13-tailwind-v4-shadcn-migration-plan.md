# Plan de implementación — Migración a Tailwind v4 + shadcn/ui

**Diseño base:** [`../specs/2026-06-13-tailwind-v4-shadcn-migration-design.md`](../specs/2026-06-13-tailwind-v4-shadcn-migration-design.md)
**App:** `apps/web`
**Fecha:** 2026-06-13

> Ejecutar las fases en orden. Cada fase termina con una **verificación** que debe pasar antes de
> seguir. Comandos desde la raíz del repo salvo que se indique otra cosa.

---

## Fase 0 — Preparación

1. Crear rama de trabajo desde `jotape-Develop`:
   ```bash
   git checkout -b feat/tailwind-v4-shadcn
   ```
2. Confirmar estado limpio y que el dev server arranca hoy (con el parche actual):
   ```bash
   pnpm --filter web dev   # Ctrl+C tras verificar que levanta
   ```

**Verificación:** rama creada, working tree limpio.

---

## Fase 1 — Migrar el build a Tailwind v4

**Objetivo:** dejar el build en v4 con el plugin de Vite; eliminar config v3.

1. Actualizar dependencias en `apps/web/package.json`:
   - `devDependencies`: `tailwindcss` → `^4`, agregar `@tailwindcss/vite@^4`.
   - Quitar `autoprefixer` y `postcss` de `devDependencies` (v4 los incluye).
   ```bash
   pnpm --filter web add -D tailwindcss@latest @tailwindcss/vite@latest
   pnpm --filter web remove autoprefixer postcss
   ```
2. Editar `apps/web/vite.config.ts`: importar y agregar el plugin.
   ```ts
   import tailwindcss from '@tailwindcss/vite';
   // ...
   plugins: [react(), tailwindcss()],
   ```
3. Eliminar `apps/web/postcss.config.js`.
4. Eliminar `apps/web/tailwind.config.js` (incluido el parche manual de tokens).

**Verificación:** `pnpm --filter web dev` levanta. La app **se verá rota de color** todavía
(falta el §2 del CSS) — eso es esperado; lo importante es que Vite compile sin error de PostCSS.

---

## Fase 2 — Theming CSS-first (navy → tokens shadcn)

**Objetivo:** una sola fuente de verdad de color en `src/index.css`.

1. Reescribir `apps/web/src/index.css` siguiendo §5.2 del spec:
   - `@import "tailwindcss";` + `@import "tw-animate-css";` + `@custom-variant dark (&:is(.dark *));`
   - Bloque `:root` con la escala `--brand-50..900` (valores navy actuales) y los tokens semánticos
     (`--primary: var(--brand-700)`, `--primary-foreground`, `--ring: var(--brand-500)`,
     `--sidebar: var(--brand-900)`, más `background/foreground/card/popover/secondary/muted/accent/
     destructive/border/input/radius`).
   - Conservar el bloque `.dark` que generó shadcn (sin activarlo).
   - `@theme inline { ... }` exponiendo `--color-brand-*` y los `--color-*` semánticos.
   - Mantener la capa base existente (`html, body, #root { height: 100% }`, fuente/antialias) y
     `* { @apply border-border outline-ring/50 }`.
2. Mantener `Inter` como fuente sans (no Geist): en `@theme` definir `--font-sans` con la pila Inter
   actual, o quitar el `@import "@fontsource-variable/geist"` si se decide no usar Geist.

**Verificación:**
- `pnpm --filter web dev` y revisar visualmente: sidebar navy, botones primarios navy, fondos slate.
- `bg-primary`, `bg-brand-700`, `text-foreground`, `border-border` resuelven correctamente.

---

## Fase 3 — Consolidar el helper `cn`

**Objetivo:** un solo `cn` canónico, sin romper los 19 imports actuales.

1. Confirmar que `apps/web/src/lib/utils.ts` exporta `cn` (lo dejó shadcn). Es el canónico.
2. Convertir `apps/web/src/shared/lib/cn.ts` en re-export:
   ```ts
   export { cn } from '@/lib/utils';
   ```

**Verificación:** `pnpm --filter web lint` (tsc) sin errores.

---

## Fase 4 — Auditoría de clases renombradas en v4

**Objetivo:** corregir utilidades cuyo significado cambió en v4.

1. Buscar y corregir en `apps/web/src` (revisar caso por caso, no reemplazo ciego):
   - `shadow` → `shadow-sm`; `shadow-sm` → `shadow-xs`
   - `rounded` → `rounded-sm`; `rounded-sm` → `rounded-xs`
   - `blur-sm` → `blur-xs`
   - `outline-none` → `outline-hidden`
   - revisar `ring-offset-*` y bordes sin color explícito.
2. Foco en los 17 archivos detectados: `layouts/AuthLayout.tsx`, `layouts/AdminLayout.tsx`,
   `shared/components/ConfirmDelete.tsx`, y los primitivos en `shared/ui/*` + `components/ui/button.tsx`.

**Verificación:** `pnpm --filter web lint` y `pnpm --filter web build` pasan; revisión visual de
sombras/bordes/foco en login, cards y tabla.

---

## Fase 5 — Convertir el primer lote (Button → Card → Input → Badge)

**Objetivo:** primitivos en `components/ui/` con la API actual preservada, sin romper consumidores.
Convertir **uno por uno**, validando entre cada uno.

Para cada componente, el patrón es: (a) crear/ajustar en `src/components/ui/`, (b) adaptar variantes a
la API actual, (c) repuntar imports de los consumidores, (d) `tsc` + revisión visual.

### 5.1 Button
- `components/ui/button.tsx` ya existe. Mapear sobre `buttonVariants` las variantes actuales
  (`primary | default | danger | ghost`), tamaños (`sm | md`) y la prop `loading` (spinner `Loader2`)
  e `icon`.
- Repuntar `import { Button } from '@/shared/ui'` → `@/components/ui/button` en los consumidores, o
  exponer `Button` desde `shared/ui/index.ts` re-exportando desde `components/ui/button` (transición).
- Borrar `shared/ui/Button.tsx` cuando nadie lo importe directamente.

### 5.2 Card
- Crear `components/ui/card.tsx` preservando la prop `title` (header opcional) usada por las páginas.

### 5.3 Input
- Crear `components/ui/input.tsx` preservando `invalid` y `prefix` (adorno izquierdo).
- Revisar `shared/ui/_control.ts`: los estilos base de control pueden quedar como tokens compartidos
  o migrarse al componente.

### 5.4 Badge
- Crear `components/ui/badge.tsx` mapeando los `tone` (`gray | green | gold | red | blue`) a variantes.

**Verificación tras cada componente:** `pnpm --filter web lint` sin errores y la pantalla que lo usa
se ve igual o mejor. Al final de la fase, `pnpm --filter web build` pasa.

---

## Fase 6 — Documentación

1. Crear `docs/frontend-shadcn-guia.md` (guía para el equipo):
   - Qué es shadcn (se copia código, no es dependencia).
   - Cómo agregar componentes: `pnpm dlx shadcn@latest add <componente>` (desde `apps/web`).
   - Dónde viven: `src/components/ui/` (primitivos) vs `src/shared/components/` (composiciones del panel).
   - Relación con los tokens navy (`bg-primary` = marca; cómo cambiar la marca en `index.css`).
   - Convención de `cn` (`@/lib/utils`) y el shim temporal en `@/shared/lib/cn`.
   - Patrón para adaptar variantes shadcn sin romper consumidores (ejemplo Button).
   - Estado de la migración gradual `shared/ui → components/ui` (qué falta).
2. Actualizar menciones obsoletas:
   - `docs/frontend-web-arquitectura.md` §1 (tabla stack: "Tailwind 3.4" → v4; quitar Headless UI como
     base única si corresponde) y §8 ("todos los componentes son propios" → shadcn como kit oficial +
     migración gradual).
   - `docs/frontend-recursos-estilo.md`: ajustar la sección que asume Tailwind v3 y "copiar/adaptar a
     brand-*" para alinearla con el flujo shadcn + tokens.

**Verificación:** los docs no se contradicen con el código; un dev nuevo puede agregar un componente
shadcn siguiendo solo la guía.

---

## Fase 7 — Cierre

1. `pnpm --filter web lint` + `pnpm --filter web build` en verde.
2. Revisión visual completa: login, sidebar, dashboard (incluido el gráfico Recharts), tabla de
   productos, drawer de producto, mi-tienda, mi-cuenta, planes.
3. Commit(s) enfocados y PR hacia `develop` describiendo el cambio de build (avisar al equipo: cambia
   el toolchain de `apps/web`).

**Verificación final:** CI (que corre `tsc --noEmit`) pasa; PR abierto.

---

## Checklist de archivos tocados

- `apps/web/package.json` — deps (tailwind v4, plugin vite; sin postcss/autoprefixer)
- `apps/web/vite.config.ts` — plugin `@tailwindcss/vite`
- `apps/web/postcss.config.js` — **eliminado**
- `apps/web/tailwind.config.js` — **eliminado**
- `apps/web/src/index.css` — theming CSS-first (navy → tokens)
- `apps/web/src/shared/lib/cn.ts` — re-export (shim)
- `apps/web/src/components/ui/{button,card,input,badge}.tsx` — primer lote
- `apps/web/src/shared/ui/{Button,Card,Input,Badge}.tsx` — eliminados al migrar; `index.ts` actualizado
- Consumidores con clases v4 renombradas (~17 archivos) — auditados
- `docs/frontend-shadcn-guia.md` — **nuevo**
- `docs/frontend-web-arquitectura.md`, `docs/frontend-recursos-estilo.md` — actualizados

## Orden de dependencias entre fases

```
Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
```

Las fases 1–4 son la **fundación** (build + theming + cn + clases). La fase 5 depende de toda la
fundación. La 6 puede empezar en paralelo a la 5 pero se cierra al final con el estado real.

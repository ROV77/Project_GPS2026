# Guía de shadcn/ui para el frontend (`apps/web`)

Cómo trabajar con **shadcn/ui** en el panel administrativo de CaseritApp. shadcn es el **kit de UI
oficial** del proyecto: los primitivos visuales (Button, Card, Input…) viven en
`apps/web/src/components/ui/` y se estilan con los tokens de marca navy.

> Contexto: el panel migró de Tailwind v3 + kit propio a **Tailwind v4 + shadcn/ui**. 

---

## 1. Qué es shadcn (y qué no)

shadcn **no es una dependencia** que se importa de `node_modules`. Es un catálogo de componentes
React + Tailwind + Radix cuyo **código se copia a tu repo**. Una vez copiado, el componente es
tuyo: lo editás, lo versionás y lo adaptás. No hay una librería que actualizar ni estilos que pelear.

Esto significa:

- **Tenés control total** del markup y los estilos de cada componente.
- **Adaptamos** los componentes a la API y los tokens del proyecto (no los usamos "tal cual").
- Las primitivas accesibles vienen de [Radix UI](https://www.radix-ui.com/) (foco, teclado, ARIA).

## 2. Dónde vive cada cosa

```
apps/web/src/
├── components/ui/      ← primitivos del design system (shadcn). ÚNICO hogar.
│   ├── button.tsx  card.tsx  input.tsx  badge.tsx   (ya migrados)
│   └── …
├── shared/
│   ├── components/      ← composiciones DEL PANEL (PageHeader, KpiCard, ConfirmDelete)
│   ├── ui/             ← primitivos aún NO migrados (Select, Drawer, Table…); se vacía con el tiempo
│   ├── api/ hooks/ lib/ config/   ← lógica reutilizable no visual
│   └── lib/cn.ts       ← shim temporal: re-exporta cn desde @/lib/utils
├── lib/utils.ts        ← cn canónico (clsx + tailwind-merge)
└── features/           ← módulos de negocio
```

Regla de límites:

- **`components/ui/`** = primitivo genérico (serviría en cualquier app): Button, Card, Input…
- **`shared/components/`** = composición específica del negocio: un `KpiCard` para tu dashboard.
- Si dudás: ¿lo usarías igual en otro proyecto? → `components/ui`. ¿Es propio de CaseritApp? →
  `shared/components`.

## 3. Agregar un componente nuevo

Desde `apps/web`:

```bash
cd apps/web
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add tabs tooltip table
```

El componente cae en `src/components/ui/`. La configuración vive en `apps/web/components.json`
(estilo `radix-nova`, alias `@/components/ui`, `cn` en `@/lib/utils`, iconos `lucide`).

Después de agregarlo, **revisá y adaptá** (ver §5): que use los tokens de marca y la convención de
`cn`, y que su API encaje con cómo lo vas a usar.

## 4. Tokens de color (la marca navy)

El color **no se hardcodea**. Se usa a través de tokens semánticos definidos en
`apps/web/src/index.css`. La escala de marca navy (`--brand-50..900`) alimenta esos tokens:

| Token / utilidad | Para qué | Valor (hoy) |
|---|---|---|
| `bg-primary` / `text-primary-foreground` | Acción principal (botones, item activo) | navy `--brand-700` |
| `bg-card` / `text-card-foreground` | Superficie de tarjetas | blanco |
| `bg-background` / `text-foreground` | Fondo y texto de página | slate-50 / slate-900 |
| `bg-muted` / `text-muted-foreground` | Fondos suaves, texto secundario | slate-100 / slate-500 |
| `border-border` / `border-input` | Bordes y bordes de controles | slate-200 / slate-300 |
| `ring-ring` | Anillo de foco | `--brand-500` |
| `bg-destructive` | Acciones peligrosas | red-600 |
| `bg-sidebar` … | El sidebar oscuro | `--brand-900` |
| `bg-brand-700`, `text-brand-500`… | Escala de marca directa (uso puntual) | navy |

**Cambiar la marca** (p. ej. de navy a verde): editar **solo** el bloque `--brand-50..900` en
`index.css`. Todo lo que usa tokens cambia con eso.

> No uses `bg-blue-700` ni hex sueltos para acciones de marca. Usá `bg-primary` / `bg-brand-*`.

## 5. Adaptar un componente sin romper consumidores

Cuando migramos un primitivo del kit viejo, **preservamos su API** para no tocar las pantallas que
lo usan. Ejemplo real: `components/ui/button.tsx` mantiene la API del proyecto
(`variant: primary | default | danger | ghost`, `size: sm | md`, `loading`, `icon`) pero por dentro
usa `cva` + tokens:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex items-center justify-center rounded-lg …', {
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-brand-800',
      default: 'border border-input bg-card text-foreground hover:bg-muted',
      danger: 'bg-destructive text-white hover:bg-red-700',
      ghost: 'text-muted-foreground hover:bg-muted',
    },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});
```

Patrón a seguir:

1. Traé el componente shadcn a `components/ui/`.
2. Reescribí sus `variants` para usar **los tokens** y, si reemplaza a un primitivo existente,
   **la misma API** (mismos nombres de props/variantes que ya consumen las pantallas).
3. Repuntá los imports (o el barrel `shared/ui/index.ts`) y borrá el archivo viejo.
4. Verificá: `pnpm --filter web lint` + revisión visual.

## 6. La convención `cn`

`cn` (clsx + tailwind-merge) compone clases y resuelve conflictos (la última gana). El canónico es
**`@/lib/utils`**:

```tsx
import { cn } from '@/lib/utils';
cn('px-3 py-2', isActive && 'bg-primary', className);
```

> Durante la transición, `@/shared/lib/cn` sigue funcionando (re-exporta de `@/lib/utils`). En
> código nuevo importá siempre desde `@/lib/utils`. El shim se eliminará al terminar la migración.

## 7. Estado de la migración gradual

shadcn es el kit oficial; los primitivos se migran `shared/ui → components/ui` de a poco.

- **Migrados** (`components/ui/`): Button, Card, Input, Badge.
- **Pendientes** (`shared/ui/`): Alert, Checkbox, ConfirmPopover, Drawer, DropdownMenu, Field,
  feedback (Skeleton/Spinner/EmptyState), NumberInput, Pagination, PasswordInput, Select, Switch,
  Table, Textarea. Siguen funcionando con los mismos tokens.
- Los controles de formulario pendientes comparten estilos base en `shared/ui/_control.ts`.

Cuando se migre el último primitivo: eliminar `shared/ui/`, el shim `shared/lib/cn.ts`, y mover los
imports al barrel/ubicación final.

## 8. Checklist al crear/migrar UI

- [ ] ¿El primitivo va en `components/ui/` y la composición de negocio en `shared/components/`?
- [ ] ¿Usa tokens (`bg-primary`, `border-border`…) en vez de hex/colores sueltos?
- [ ] ¿Importa `cn` desde `@/lib/utils`?
- [ ] Si reemplaza un componente viejo, ¿preserva su API y repunta los imports?
- [ ] ¿`pnpm --filter web lint` y `pnpm --filter web build` en verde?
- [ ] ¿Revisión visual en `pnpm --filter web dev`?

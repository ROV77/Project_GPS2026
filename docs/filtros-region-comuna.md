# Filtros por Región y Comuna — CaseritApp

## Diagnóstico del esquema actual

El esquema ya tiene lo correcto: `stores` guarda `region_id` y `commune_id` directamente (desnormalización intencional). Esto evita joins innecesarios y es la estrategia correcta para un listado con filtros frecuentes.

**Índices ya existentes (del schema.sql):**
```
idx_stores_region     ON stores (region_id)
idx_stores_commune    ON stores (commune_id)
idx_communes_region   ON communes (region_id)
```

---

## 1. Índices adicionales recomendados

Agregar al final de la sección `6) Recommended indexes` del schema:

```sql
-- Filtro combinado región + comuna (caso más común en la app)
CREATE INDEX idx_stores_region_commune
    ON stores (region_id, commune_id);

-- Filtro región + comuna + categoría (pantalla de exploración)
CREATE INDEX idx_stores_region_commune_category
    ON stores (region_id, commune_id, category_id);

-- Tiendas verificadas por región (panel admin + listado público)
CREATE INDEX idx_stores_region_verified
    ON stores (region_id, verified)
    WHERE verified = true;

-- Tiendas verificadas por comuna
CREATE INDEX idx_stores_commune_verified
    ON stores (commune_id, verified)
    WHERE verified = true;

-- Comunas por región + nombre (para el dropdown en cascada del frontend)
CREATE INDEX idx_communes_region_name
    ON communes (region_id, name);
```

> **Por qué el índice compuesto va primero por `region_id`:**  
> La región tiene menor cardinalidad (16 regiones en Chile) y suele filtrarse primero. PostgreSQL puede usar el primer campo del índice compuesto solo o combinado, lo que permite reutilizar `idx_stores_region_commune` tanto para filtro solo por región como para región + comuna.

---

## 2. Consultas Prisma (ORM principal)

### `apps/api/src/repositories/store.repository.ts`

```typescript
import { prisma } from '../lib/prisma';
import type { StoreFilters, PaginationParams } from '@caseritapp/shared-types';

export async function findStoresByLocation(
  filters: StoreFilters,
  pagination: PaginationParams
) {
  const { regionId, communeId, categoryId, verifiedOnly = false } = filters;
  const { page = 1, limit = 20 } = pagination;

  // Construir el where dinámicamente — solo incluye lo que llega
  const where: Parameters<typeof prisma.stores.findMany>[0]['where'] = {
    ...(regionId   && { region_id:   BigInt(regionId) }),
    ...(communeId  && { commune_id:  BigInt(communeId) }),
    ...(categoryId && { category_id: BigInt(categoryId) }),
    ...(verifiedOnly && { verified: true }),
  };

  // Una sola transacción: datos + total para paginación
  const [stores, total] = await prisma.$transaction([
    prisma.stores.findMany({
      where,
      select: {
        id:           true,
        name:         true,
        description:  true,
        logo_url:     true,
        verified:     true,
        latitude:     true,
        longitude:    true,
        opening_time: true,
        closing_time: true,
        // Relaciones necesarias para la tarjeta de tienda
        regions:    { select: { name: true } },
        communes:   { select: { name: true, city: true } },
        categories: { select: { name: true } },
        // Promedio de reviews (Prisma no agrega directamente → usar _count)
        _count: { select: { reviews: true } },
      },
      orderBy: { id: 'asc' },
      take:  limit,
      skip:  (page - 1) * limit,
    }),
    prisma.stores.count({ where }),
  ]);

  return {
    data:       stores,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/** Para el dropdown en cascada: comunas de una región */
export async function findCommunesByRegion(regionId: number) {
  return prisma.communes.findMany({
    where:   { region_id: BigInt(regionId) },
    select:  { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  });
}

/** Todas las regiones (lista estática, ideal para cachear en el cliente) */
export async function findAllRegions() {
  return prisma.regions.findMany({
    select:  { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
```

### ¿Por qué `$transaction` para datos + count?

Garantiza consistencia: ambas queries leen el mismo snapshot de la DB. Sin transacción, una inserción entre las dos queries podría dar un total que no coincide con los datos devueltos.

---

## 3. SQL raw para el listado con rating promedio

Prisma no soporta `AVG` como parte del `select` estándar sin una vista o `$queryRaw`. Usar cuando se necesita el rating en el mismo query:

```typescript
// apps/api/src/repositories/store.repository.ts

import { Prisma } from '@prisma/client';

export async function findStoresWithRating(
  filters: StoreFilters,
  pagination: PaginationParams
) {
  const { regionId, communeId, categoryId, verifiedOnly = false } = filters;
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  // Prisma.sql construye la query de forma segura contra SQL injection
  const conditions: Prisma.Sql[] = [];
  if (regionId)    conditions.push(Prisma.sql`s.region_id   = ${BigInt(regionId)}`);
  if (communeId)   conditions.push(Prisma.sql`s.commune_id  = ${BigInt(communeId)}`);
  if (categoryId)  conditions.push(Prisma.sql`s.category_id = ${BigInt(categoryId)}`);
  if (verifiedOnly) conditions.push(Prisma.sql`s.verified   = true`);

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.sql``;

  const stores = await prisma.$queryRaw<StoreWithRatingRow[]>`
    SELECT
      s.id,
      s.name,
      s.description,
      s.logo_url,
      s.verified,
      s.latitude,
      s.longitude,
      s.opening_time,
      s.closing_time,
      r.name  AS region_name,
      c.name  AS commune_name,
      c.city  AS commune_city,
      cat.name AS category_name,
      COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating,
      COUNT(rv.id)::INT                               AS review_count
    FROM   stores s
    LEFT JOIN regions    r   ON r.id   = s.region_id
    LEFT JOIN communes   c   ON c.id   = s.commune_id
    LEFT JOIN categories cat ON cat.id = s.category_id
    LEFT JOIN reviews    rv  ON rv.store_id = s.id
    ${whereClause}
    GROUP BY s.id, r.name, c.name, c.city, cat.name
    ORDER BY s.id
    LIMIT  ${limit}
    OFFSET ${offset}
  `;

  const [{ total }] = await prisma.$queryRaw<[{ total: bigint }]>`
    SELECT COUNT(*) AS total
    FROM   stores s
    ${whereClause}
  `;

  return {
    data:       stores,
    total:      Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  };
}

// Tipo para las filas del raw query
interface StoreWithRatingRow {
  id:            bigint;
  name:          string;
  description:   string | null;
  logo_url:      string | null;
  verified:      boolean;
  latitude:      number | null;
  longitude:     number | null;
  opening_time:  string | null;
  closing_time:  string | null;
  region_name:   string | null;
  commune_name:  string | null;
  commune_city:  string | null;
  category_name: string | null;
  avg_rating:    number;
  review_count:  number;
}
```

---

## 4. Validación Zod de los query params

### `packages/validations/src/store-filters.schema.ts`

```typescript
import { z } from 'zod';

const positiveId = z
  .string()
  .regex(/^\d+$/, 'Debe ser un número entero positivo')
  .transform(Number)
  .optional();

export const StoreFiltersSchema = z.object({
  region_id:    positiveId,
  commune_id:   positiveId,
  category_id:  positiveId,
  verified_only: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional()
    .default('false'),
  page:  z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(100)   // nunca más de 100 por request
  ).optional().default('20'),
});

export type StoreFiltersInput = z.input<typeof StoreFiltersSchema>;
export type StoreFilters      = z.output<typeof StoreFiltersSchema>;
```

---

## 5. Endpoint Express con middleware de validación

### `apps/api/src/routes/stores.routes.ts`

```typescript
import { Router }         from 'express';
import { StoreFiltersSchema } from '@caseritapp/validations';
import {
  findStoresWithRating,
  findCommunesByRegion,
  findAllRegions,
} from '../repositories/store.repository';

const router = Router();

/**
 * GET /stores
 * Query params: region_id, commune_id, category_id, verified_only, page, limit
 */
router.get('/', async (req, res, next) => {
  try {
    const parsed = StoreFiltersSchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error:   'Parámetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { region_id, commune_id, category_id, verified_only, page, limit } = parsed.data;

    const result = await findStoresWithRating(
      {
        regionId:    region_id,
        communeId:   commune_id,
        categoryId:  category_id,
        verifiedOnly: verified_only,
      },
      { page, limit }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/regions
 * Lista todas las regiones (para el primer dropdown del filtro)
 */
router.get('/regions', async (_req, res, next) => {
  try {
    const regions = await findAllRegions();
    res.json(regions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/regions/:regionId/communes
 * Comunas de una región (para el dropdown en cascada)
 */
router.get('/regions/:regionId/communes', async (req, res, next) => {
  try {
    const regionId = Number(req.params.regionId);

    if (!Number.isInteger(regionId) || regionId <= 0) {
      return res.status(400).json({ error: 'regionId inválido' });
    }

    const communes = await findCommunesByRegion(regionId);
    res.json(communes);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Registrar en `apps/api/src/routes/index.ts`

```typescript
import storesRouter from './stores.routes';
// ...
app.use('/stores', storesRouter);
```

---

## 6. Tipos compartidos

### `packages/shared-types/src/store.types.ts`

```typescript
export interface StoreFilters {
  regionId?:    number;
  communeId?:   number;
  categoryId?:  number;
  verifiedOnly?: boolean;
}

export interface PaginationParams {
  page?:  number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}
```

---

## 7. EXPLAIN ANALYZE — verificar que los índices se usan

Correr estos queries en psql o DBeaver para confirmar el plan de ejecución:

```sql
-- Filtro por región sola
EXPLAIN ANALYZE
SELECT s.id, s.name
FROM stores s
WHERE s.region_id = 13;   -- Región Metropolitana

-- Filtro combinado región + comuna
EXPLAIN ANALYZE
SELECT s.id, s.name
FROM stores s
WHERE s.region_id = 13
  AND s.commune_id = 101;

-- Filtro completo con rating
EXPLAIN ANALYZE
SELECT s.id, s.name, AVG(rv.rating) AS avg_rating
FROM   stores s
LEFT JOIN reviews rv ON rv.store_id = s.id
WHERE  s.region_id = 13
  AND  s.verified  = true
GROUP  BY s.id
LIMIT 20;
```

**Lo que querés ver en el output:** `Index Scan` o `Bitmap Index Scan` usando alguno de los índices definidos. Si ves `Seq Scan` con un costo alto, la tabla aún es muy pequeña (normal en desarrollo); el optimizador empezará a preferir el índice cuando haya más de ~1.000 filas.

---

## Resumen de decisiones

| Decisión | Razón |
|---|---|
| `region_id` / `commune_id` directo en `stores` | Evita JOIN a `addresses` en cada listado |
| Índice compuesto `(region_id, commune_id)` | Cubre el 90% de los filtros con un solo índice |
| Índice parcial `WHERE verified = true` | Reduce el tamaño del índice; las tiendas no verificadas no aparecen en el listado público |
| `$transaction([findMany, count])` en Prisma | Consistencia de snapshot + un solo roundtrip a la DB |
| `Prisma.sql` + `Prisma.join` en raw query | Evita concatenación de strings → sin riesgo de SQL injection |
| Validación Zod en `packages/validations` | Reutilizable en el frontend (React Hook Form) sin duplicar lógica |

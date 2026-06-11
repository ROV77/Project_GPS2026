# Documento Explicativo de Avance 1, Filtros de Región y Comuna Optimizados

## ¿Qué se implementó y por qué?

Este documento explica cada decisión técnica tomada al implementar las consultas SQL optimizadas para filtros por región y comuna en CaseritApp.

---

## 1. Índices compuestos y parciales

### ¿Qué se creó?

Se agregaron 5 índices nuevos a la base de datos

| Índice                               | Columnas                                       | Tipo      |
| ------------------------------------ | ---------------------------------------------- | --------- |
| `idx_stores_region_commune`          | `(region_id, commune_id)`                      | Compuesto |
| `idx_stores_region_commune_category` | `(region_id, commune_id, category_id)`         | Compuesto |
| `idx_stores_region_verified`         | `(region_id, verified) WHERE verified = true`  | Parcial   |
| `idx_stores_commune_verified`        | `(commune_id, verified) WHERE verified = true` | Parcial   |
| `idx_communes_region_name`           | `(region_id, name)`                            | Compuesto |

### ¿Por qué?

**Índices compuestos**: PostgreSQL puede usar un índice compuesto para resolver queries que filtran por un prefijo de sus columnas. Esto significa que `idx_stores_region_commune` sirve tanto para:

- Filtro solo por `region_id` (usa la primera columna del índice)
- Filtro por `region_id` + `commune_id` (usa ambas columnas)

El orden importa: `region_id` va primero porque tiene **menor cardinalidad** (Chile tiene solo 16 regiones, pero cientos de comunas). Esto permite que el optimizador reduzca el dataset rápidamente.

**Índices parciales** (`WHERE verified = true`): En el listado público de tiendas, solo se muestran las verificadas. Un índice parcial **excluye las filas no verificadas del índice**, lo que:

- Reduce el tamaño del índice en disco
- Hace los escaneos más rápidos porque hay menos entradas
- Es especialmente útil cuando la mayoría de las tiendas aún no están verificadas

**Índice `idx_communes_region_name`**: Optimiza el dropdown en cascada del frontend. Cuando el usuario selecciona una región, se cargan sus comunas ordenadas alfabéticamente. Sin este índice, PostgreSQL tendría que hacer un Seq Scan + Sort; con él, obtiene los resultados directamente del índice ya ordenado.

### ¿Por qué también se actualizó `schema.prisma`?

Los índices compuestos se declararon también en el modelo Prisma (`@@index`) para que:

1. Prisma conozca la estructura real de la base de datos
2. Futuras migraciones generadas por `prisma migrate dev` no intenten crear índices que ya existen
3. El esquema sirva como documentación viviente

Los índices parciales (`WHERE verified = true`) **no** se pueden declarar en `schema.prisma` porque Prisma no soporta la sintaxis `WHERE` en `@@index`. Por eso viven solo en la migración SQL.

---

## 2. Repositorio dedicado (`store.repository.ts`)

### ¿Qué se creó?

Un nuevo directorio [`repositories/`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/apps/api/src/repositories) con [`store.repository.ts`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/apps/api/src/repositories/store.repository.ts) que contiene 3 funciones:

| Función                | Para qué                             | Método      |
| ---------------------- | ------------------------------------ | ----------- |
| `findStoresWithRating` | Listado filtrado con rating promedio | `$queryRaw` |
| `findCommunesByRegion` | Comunas de una región (dropdown)     | Prisma ORM  |
| `findAllRegions`       | Todas las regiones (dropdown)        | Prisma ORM  |

### ¿Por qué se separó del CRUD genérico?

El CRUD genérico de [`makeCrud`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/apps/api/src/lib/crud.ts) está diseñado para operaciones CRUD simples (listar todo, obtener por ID, crear, actualizar, eliminar). **No soporta**:

- Filtros dinámicos por query params
- JOINs con tablas relacionadas
- Funciones de agregación como `AVG`

Al crear un repositorio separado, mantenemos el CRUD limpio para lo que fue diseñado y agregamos la lógica compleja en su propio módulo.

### ¿Por qué raw SQL y no Prisma ORM?

Prisma ORM no soporta `AVG()` en el `select` estándar sin crear una vista en la base de datos. Para obtener el rating promedio de cada tienda en el mismo query (sin un N+1), necesitamos:

```sql
COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating
```

Esto solo es posible con `$queryRaw`. Sin embargo, **no concatenamos strings para construir el SQL**. Usamos `Prisma.sql` y `Prisma.join` para construir el `WHERE` dinámico, lo que previene SQL injection:

```typescript
// Seguro — Prisma parametriza los valores
conditions.push(Prisma.sql`s.region_id = ${BigInt(regionId)}`);
const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

// Inseguro — nunca hacer esto
const whereClause = `WHERE region_id = ${regionId}`;
```

### ¿Por qué `LEFT JOIN` y no `INNER JOIN`?

Porque una tienda puede no tener reviews, ni categoría, ni región asignada. Con `INNER JOIN` esas tiendas desaparecerían del resultado. Con `LEFT JOIN` siempre aparecen, pero con `null` en los campos opcionales y `0` en `avg_rating` / `review_count` (gracias a `COALESCE`).

---

## 3. Esquema Zod de filtros (`store-filters.schema.ts`)

### ¿Qué se creó?

[`store-filters.schema.ts`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/packages/validations/src/store-filters.schema.ts) en `packages/validations` — un esquema Zod que valida y transforma los query params del endpoint `GET /api/stores/search`.

### ¿Por qué los query params se validan como strings?

En HTTP, **todos los query params llegan como strings**. Si la URL es `/stores/search?region_id=13&page=2`, Express parsea `req.query` como:

```typescript
{ region_id: "13", page: "2" }  // strings, no números
```

El esquema Zod aplica `.transform(Number)` para convertirlos a números después de validar que el string contiene solo dígitos (`/^\d+$/`). Esto es más seguro que `z.coerce.number()` porque rechaza valores como `"abc"` en lugar de convertirlos a `NaN`.

### ¿Por qué vive en `packages/validations` y no en la API?

Porque el esquema es **reutilizable en el frontend web**. En el panel admin con React Hook Form, se puede conectar directamente via `@hookform/resolvers`:

```typescript
import { StoreFiltersSchema } from "@caserita/validations";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({ resolver: zodResolver(StoreFiltersSchema) });
```

Esto evita duplicar la lógica de validación entre frontend y backend.

### ¿Por qué `max(100)` en el límite?

Para prevenir que un cliente malicioso pida `?limit=999999` y fuerce un full table scan que sobrecargue la base de datos. 100 es un máximo razonable para un listado con tarjetas de tienda.

---

## 4. Rutas Express extendidas

### ¿Qué se modificó?

[`stores.routes.ts`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/apps/api/src/routes/stores.routes.ts) ahora tiene 3 endpoints nuevos **antes** de las rutas CRUD genéricas:

| Endpoint                                     | Descripción                   |
| -------------------------------------------- | ----------------------------- |
| `GET /api/stores/search`                     | Listado filtrado con rating   |
| `GET /api/stores/regions`                    | Todas las regiones (dropdown) |
| `GET /api/stores/regions/:regionId/communes` | Comunas de una región         |

### ¿Por qué las rutas específicas van antes del CRUD?

Express evalúa las rutas en orden de registro. Si el CRUD genérico se monta primero, la ruta `GET /:id` captura cualquier cosa como `/search` o `/regions` (tratando `"search"` como un ID). Al montar las rutas específicas primero, Express las evalúa antes que la ruta genérica.

```typescript
// Correcto — /search se evalúa antes que /:id
storesRouter.get('/search', ...);
storesRouter.get('/regions', ...);
storesRouter.use('/', crudRoutes);  // ← esto incluye GET /:id

// Incorrecto — /:id captura "search" como ID
storesRouter.use('/', crudRoutes);  // ← GET /:id intercepta todo
storesRouter.get('/search', ...);   // ← nunca se ejecuta
```

### ¿Por qué `safeParse` y no `parse`?

En los endpoints de filtros, usamos `safeParse` para manejar errores de validación explícitamente con un 400 y detalles de los campos inválidos. El CRUD genérico usa `parse` (que lanza `ZodError`) y deja que el `errorHandler` middleware lo capture — ambos enfoques son válidos, pero `safeParse` da más control sobre el formato de la respuesta de error.

---

## 5. Tipos compartidos (`@caserita/shared-types`)

### ¿Qué se creó?

El paquete [`packages/shared-types`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/packages/shared-types) con interfaces TypeScript usadas por la API, el panel web y la app mobile:

- `StoreFilters` — parámetros de filtro
- `PaginationParams` — parámetros de paginación
- `PaginatedResponse<T>` — respuesta paginada genérica
- `StoreWithRating` — fila del listado con rating

### ¿Por qué un paquete separado?

Porque estos tipos los necesitan tanto el backend (para tipar las funciones del repositorio) como los frontends (para tipar las respuestas del API). Con el monorepo de pnpm, ambas apps pueden importar desde `@caserita/shared-types` sin duplicar definiciones.

### ¿Por qué no se puso junto con validations?

`shared-types` es **solo tipos** (sin dependencias runtime). `validations` depende de `zod` (dependencia runtime). Mantenerlos separados permite que una app importe solo los tipos sin arrastrar `zod` como dependencia.

---

## 6. Script EXPLAIN ANALYZE

### ¿Para qué sirve?

[`explain_analyze_filters.sql`](file:///c:/Users/cfernandr.ap/Documents/ProyectoGPS/Project_GPS2026/apps/api/prisma/migrations/explain_analyze_filters.sql) contiene queries para ejecutar en psql o DBeaver que muestran el **plan de ejecución** de PostgreSQL. Esto permite verificar que los índices creados realmente se usan.

### ¿Qué buscar en el output?

- **`Index Scan`** o **`Bitmap Index Scan`** usando alguno de los índices → los índices funcionan
- **`Seq Scan`** → PostgreSQL no usó ningún índice. Normal en desarrollo con pocas filas (<1.000), porque el optimizador decide que es más rápido leer toda la tabla secuencialmente

---

## Resumen de decisiones de diseño

| Decisión                                   | Alternativa descartada        | Razón                                                                    |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| `region_id` directo en `stores`            | JOIN a `addresses`            | Evita JOIN en cada listado; desnormalización intencional                 |
| Índice compuesto `(region_id, commune_id)` | Dos índices simples separados | Un índice compuesto cubre ambos casos (solo región, o región+comuna)     |
| Índice parcial `WHERE verified = true`     | Índice completo               | Reduce tamaño; solo las verificadas aparecen en el listado público       |
| `$queryRaw` con `Prisma.sql`               | Prisma ORM puro               | ORM no soporta `AVG` sin vistas; `Prisma.sql` es seguro contra injection |
| `safeParse` en endpoint de filtros         | `parse` (lanza error)         | Control explícito del formato de error 400                               |
| Tipos en `shared-types` separado           | Tipos dentro de `validations` | Evita que las apps arrastren `zod` solo por los tipos                    |
| `LEFT JOIN` en el query                    | `INNER JOIN`                  | Tiendas sin reviews/categoría no desaparecen del resultado               |
| `LIMIT 100` máximo                         | Sin límite                    | Previene queries abusivos que sobrecargan la DB                          |

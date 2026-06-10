-- Índices optimizados para filtros por región y comuna
-- Migración creada vía prisma migrate
-- Índice compuesto para filtro combinado región + comuna (caso más común en la app).
-- region_id va primero porque tiene menor cardinalidad (16 regiones en Chile)
-- y suele filtrarse primero. PostgreSQL puede reusar el prefijo para filtros
-- solo por región, lo que evita duplicar el índice simple idx_stores_region.
CREATE INDEX IF NOT EXISTS idx_stores_region_commune ON stores (region_id, commune_id);

-- Índice compuesto para exploración: región + comuna + categoría.
-- Cubre el caso del listado con los tres filtros activos simultáneamente.
CREATE INDEX IF NOT EXISTS idx_stores_region_commune_category ON stores (region_id, commune_id, category_id);

-- Índice parcial para tiendas verificadas por región (panel admin + listado público).
-- El filtro WHERE verified = true reduce el tamaño del índice significativamente
-- porque excluye tiendas no verificadas que no aparecen en el listado público.
CREATE INDEX IF NOT EXISTS idx_stores_region_verified ON stores (region_id, verified)
WHERE
    verified = true;

-- Índice parcial para tiendas verificadas por comuna.
CREATE INDEX IF NOT EXISTS idx_stores_commune_verified ON stores (commune_id, verified)
WHERE
    verified = true;

-- Comunas por región + nombre (para el dropdown en cascada del frontend).
-- Optimiza SELECT ... FROM communes WHERE region_id = ? ORDER BY name.
CREATE INDEX IF NOT EXISTS idx_communes_region_name ON communes (region_id, name);
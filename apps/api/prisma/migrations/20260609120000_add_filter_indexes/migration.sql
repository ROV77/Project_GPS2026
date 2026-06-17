-- Índices parciales para tiendas verificadas (no representables en schema.prisma)
-- El filtro WHERE verified = true reduce el tamaño del índice porque excluye
-- tiendas no verificadas que no aparecen en el listado público.
CREATE INDEX IF NOT EXISTS idx_stores_region_verified ON stores (region_id, verified)
WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_stores_commune_verified ON stores (commune_id, verified)
WHERE verified = true;

-- =====================================================================
-- Queries EXPLAIN ANALYZE para verificar uso de índices
-- Ejecutar en psql después de crear los índices.
-- =====================================================================

-- 1) Filtro por región sola
--    Esperado: idx_stores_region o idx_stores_region_commune (prefijo)
EXPLAIN ANALYZE
SELECT s.id, s.name
FROM stores s
WHERE s.region_id = 1;

-- 2) Filtro combinado región + comuna
--    Esperado: idx_stores_region_commune
EXPLAIN ANALYZE
SELECT s.id, s.name
FROM stores s
WHERE s.region_id = 1
  AND s.commune_id = 1;

-- 3) Filtro completo: región + comuna + categoría
--    Esperado: idx_stores_region_commune_category
EXPLAIN ANALYZE
SELECT s.id, s.name
FROM stores s
WHERE s.region_id = 1
  AND s.commune_id = 1
  AND s.category_id = 1;

-- 4) Tiendas verificadas por región (índice parcial)
--    Esperado: idx_stores_region_verified
EXPLAIN ANALYZE
SELECT s.id, s.name
FROM stores s
WHERE s.region_id = 1
  AND s.verified = true;

-- 5) Query completo con rating (el que usa la app)
EXPLAIN ANALYZE
SELECT
  s.id, s.name,
  COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating,
  COUNT(rv.id)::INT AS review_count
FROM   stores s
LEFT JOIN reviews rv ON rv.store_id = s.id
WHERE  s.region_id = 1
  AND  s.verified  = true
GROUP  BY s.id
LIMIT 20;

-- 6) Comunas por región (dropdown en cascada)
--    Esperado: idx_communes_region_name
EXPLAIN ANALYZE
SELECT c.id, c.name, c.city
FROM communes c
WHERE c.region_id = 1
ORDER BY c.name;

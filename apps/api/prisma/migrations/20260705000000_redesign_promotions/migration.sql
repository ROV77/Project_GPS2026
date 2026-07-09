-- Rediseño de `promotions`: pasa de "banner suelto de la tienda" a una promoción
-- sobre UN producto concreto. Se eliminan columnas que no aportan (title,
-- description, image_url: los provee el producto) y se agregan product_id
-- (relación al producto), is_active (pausar sin borrar) y discount_type pasa a
-- obligatorio ('percentage' | '2x1' | '3x2').

-- Limpia filas con la forma antigua (incompatibles con product_id NOT NULL).
DELETE FROM "promotions";

-- Quita columnas que ya no se usan.
ALTER TABLE "promotions" DROP COLUMN "title";
ALTER TABLE "promotions" DROP COLUMN "description";
ALTER TABLE "promotions" DROP COLUMN "image_url";

-- Nuevas columnas.
ALTER TABLE "promotions" ADD COLUMN "product_id" BIGINT NOT NULL;
ALTER TABLE "promotions" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- discount_type ahora es obligatorio.
ALTER TABLE "promotions" ALTER COLUMN "discount_type" SET NOT NULL;

-- Índice y llave foránea al producto.
CREATE INDEX "idx_promotions_product" ON "promotions"("product_id");
ALTER TABLE "promotions"
  ADD CONSTRAINT "fk_promotions_product"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

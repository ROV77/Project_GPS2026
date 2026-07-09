-- Tabla `favorites`: relación N:M entre usuarios y tiendas (un usuario marca una
-- tienda como favorita). El UNIQUE(user_id, store_id) impide duplicados y permite
-- que el alta sea idempotente. Ambas FK en CASCADE: si se borra el usuario o la
-- tienda, sus favoritos se limpian solos.

CREATE TABLE "favorites" (
  "id"         BIGSERIAL   NOT NULL,
  "user_id"    BIGINT      NOT NULL,
  "store_id"   BIGINT      NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorites_user_id_store_id_key" ON "favorites"("user_id", "store_id");
CREATE INDEX "idx_favorites_user" ON "favorites"("user_id");
CREATE INDEX "idx_favorites_store" ON "favorites"("store_id");

ALTER TABLE "favorites"
  ADD CONSTRAINT "fk_favorites_user"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "favorites"
  ADD CONSTRAINT "fk_favorites_store"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

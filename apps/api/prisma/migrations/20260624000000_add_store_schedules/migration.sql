CREATE TABLE "store_schedules" (
    "id"           BIGSERIAL    PRIMARY KEY,
    "store_id"     BIGINT       NOT NULL,
    "day_of_week"  SMALLINT     NOT NULL,
    "is_closed"    BOOLEAN      NOT NULL DEFAULT false,
    "opening_time" TIME(6),
    "closing_time" TIME(6),
    CONSTRAINT "fk_schedules_store" FOREIGN KEY ("store_id")
        REFERENCES "stores" ("id") ON DELETE CASCADE,
    CONSTRAINT "store_schedules_store_id_day_of_week_key" UNIQUE ("store_id", "day_of_week")
);

CREATE INDEX "idx_schedules_store" ON "store_schedules" ("store_id");
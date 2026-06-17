-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "addresses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "region_id" BIGINT,
    "commune_id" BIGINT,
    "street" TEXT,
    "number" VARCHAR(20),
    "apartment" TEXT,
    "reference" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "metadata" JSONB,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communes" (
    "id" BIGSERIAL NOT NULL,
    "region_id" BIGINT,
    "name" TEXT NOT NULL,
    "city" TEXT,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_ratings" (
    "id" BIGSERIAL NOT NULL,
    "courier_id" BIGINT NOT NULL,
    "store_id" BIGINT NOT NULL,
    "stars" SMALLINT,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_applications" (
    "id" BIGSERIAL NOT NULL,
    "vacancy_id" BIGINT NOT NULL,
    "courier_id" BIGINT NOT NULL,
    "state_id" BIGINT,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_applications_states" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "delivery_applications_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_vacancies" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "description" TEXT,
    "state_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_vacancies_states" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "delivery_vacancies_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "subscription_id" BIGINT NOT NULL,
    "amount" DECIMAL(12,2),
    "currency" VARCHAR(3) DEFAULT 'CLP',
    "state_id" BIGINT,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments_states" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "payments_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "billing_period" TEXT NOT NULL DEFAULT 'monthly',
    "description" TEXT,
    "max_products" INTEGER,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_analytics" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "date" DATE,
    "store_visits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "profile_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "discount_type" TEXT,
    "discount_value" DECIMAL(12,2),
    "image_url" TEXT,
    "valid_from" DATE,
    "valid_until" DATE,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_payment_methods" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "method" TEXT NOT NULL,

    CONSTRAINT "store_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_verifications" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "state_id" BIGINT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_notes" TEXT,

    CONSTRAINT "store_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_verifications_states" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "store_verifications_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "category_id" BIGINT,
    "region_id" BIGINT,
    "commune_id" BIGINT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "store_phone" VARCHAR(20),
    "opening_time" TIME(6),
    "closing_time" TIME(6),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "store_id" BIGINT NOT NULL,
    "plan_id" BIGINT,
    "state_id" BIGINT,
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions_states" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subscriptions_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "name" TEXT,
    "avatar_url" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_addresses_commune" ON "addresses"("commune_id");

-- CreateIndex
CREATE INDEX "idx_addresses_region" ON "addresses"("region_id");

-- CreateIndex
CREATE INDEX "idx_addresses_user" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "idx_communes_region" ON "communes"("region_id");

-- CreateIndex
CREATE INDEX "idx_communes_region_name" ON "communes"("region_id", "name");

-- CreateIndex
CREATE INDEX "idx_courierratings_courier" ON "courier_ratings"("courier_id");

-- CreateIndex
CREATE INDEX "idx_courierratings_store" ON "courier_ratings"("store_id");

-- CreateIndex
CREATE INDEX "idx_applications_courier" ON "delivery_applications"("courier_id");

-- CreateIndex
CREATE INDEX "idx_applications_state" ON "delivery_applications"("state_id");

-- CreateIndex
CREATE INDEX "idx_applications_vacancy" ON "delivery_applications"("vacancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_applications_states_name_key" ON "delivery_applications_states"("name");

-- CreateIndex
CREATE INDEX "idx_vacancies_state" ON "delivery_vacancies"("state_id");

-- CreateIndex
CREATE INDEX "idx_vacancies_store" ON "delivery_vacancies"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_vacancies_states_name_key" ON "delivery_vacancies_states"("name");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_payments_state" ON "payments"("state_id");

-- CreateIndex
CREATE INDEX "idx_payments_subscription" ON "payments"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_states_name_key" ON "payments_states"("name");

-- CreateIndex
CREATE INDEX "idx_products_store" ON "products"("store_id");

-- CreateIndex
CREATE INDEX "idx_analytics_store" ON "profile_analytics"("store_id");

-- CreateIndex
CREATE INDEX "idx_promotions_store" ON "promotions"("store_id");

-- CreateIndex
CREATE INDEX "idx_pushtokens_user" ON "push_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_user_id_token_key" ON "push_tokens"("user_id", "token");

-- CreateIndex
CREATE INDEX "idx_reviews_customer" ON "reviews"("customer_id");

-- CreateIndex
CREATE INDEX "idx_reviews_store" ON "reviews"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_store_id_customer_id_key" ON "reviews"("store_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "idx_storepayments_store" ON "store_payment_methods"("store_id");

-- CreateIndex
CREATE INDEX "idx_verifications_reviewer" ON "store_verifications"("reviewed_by");

-- CreateIndex
CREATE INDEX "idx_verifications_state" ON "store_verifications"("state_id");

-- CreateIndex
CREATE INDEX "idx_verifications_store" ON "store_verifications"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_verifications_states_name_key" ON "store_verifications_states"("name");

-- CreateIndex
CREATE INDEX "idx_stores_category" ON "stores"("category_id");

-- CreateIndex
CREATE INDEX "idx_stores_commune" ON "stores"("commune_id");

-- CreateIndex
CREATE INDEX "idx_stores_owner" ON "stores"("owner_id");

-- CreateIndex
CREATE INDEX "idx_stores_region" ON "stores"("region_id");

-- CreateIndex
CREATE INDEX "idx_stores_region_commune" ON "stores"("region_id", "commune_id");

-- CreateIndex
CREATE INDEX "idx_stores_region_commune_category" ON "stores"("region_id", "commune_id", "category_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_plan" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_state" ON "subscriptions"("state_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_store" ON "subscriptions"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_states_name_key" ON "subscriptions_states"("name");

-- CreateIndex
CREATE INDEX "idx_userroles_role" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_userroles_user" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "fk_addresses_commune" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "fk_addresses_region" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "fk_addresses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communes" ADD CONSTRAINT "fk_communes_region" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courier_ratings" ADD CONSTRAINT "fk_courierratings_courier" FOREIGN KEY ("courier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courier_ratings" ADD CONSTRAINT "fk_courierratings_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_applications" ADD CONSTRAINT "fk_applications_courier" FOREIGN KEY ("courier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_applications" ADD CONSTRAINT "fk_applications_state" FOREIGN KEY ("state_id") REFERENCES "delivery_applications_states"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_applications" ADD CONSTRAINT "fk_applications_vacancy" FOREIGN KEY ("vacancy_id") REFERENCES "delivery_vacancies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_vacancies" ADD CONSTRAINT "fk_vacancies_state" FOREIGN KEY ("state_id") REFERENCES "delivery_vacancies_states"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_vacancies" ADD CONSTRAINT "fk_vacancies_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_state" FOREIGN KEY ("state_id") REFERENCES "payments_states"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "fk_products_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profile_analytics" ADD CONSTRAINT "fk_analytics_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "fk_promotions_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "fk_pushtokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "store_payment_methods" ADD CONSTRAINT "fk_storepayments_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "store_verifications" ADD CONSTRAINT "fk_verifications_reviewer" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "store_verifications" ADD CONSTRAINT "fk_verifications_state" FOREIGN KEY ("state_id") REFERENCES "store_verifications_states"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "store_verifications" ADD CONSTRAINT "fk_verifications_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "fk_stores_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "fk_stores_commune" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "fk_stores_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "fk_stores_region" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "fk_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "fk_subscriptions_state" FOREIGN KEY ("state_id") REFERENCES "subscriptions_states"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "fk_subscriptions_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_userroles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_userroles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- =====================================================================
--  CaseritApp - Relational schema for PostgreSQL (English)
--
--  Original changes:
--   - Translated all table and column names to English.
--   - Removed redundant `rol` column on users (kept N:M via user_roles).
--   - Couriers are users: removed the `couriers` table; courier_id now
--     references users(id) directly. Role is determined by user_roles.
--   - Added missing fields to reviews: rating, comment, created_at.
--   - Renamed `pagos_ojo` -> `payments`.
--   - Removed the ambiguous `status` column from addresses.
--   - Inverted regions/communes relationship: communes.region_id -> regions
--     (the natural Chilean model: a region contains many communes).
--
--  v2 changes:
--   - Added push_tokens table for Expo push notification token storage.
--   - Added profile fields to users: name, avatar_url, email_verified,
--     is_active, updated_at, deleted_at.
--   - Added commune_id, latitude, longitude, apartment, reference to addresses.
--   - Added commune_id, latitude, longitude to stores.
--   - Added is_read, read_at, type, metadata to notifications.
--   - Added UNIQUE(store_id, customer_id) to reviews.
--   - Replaced free-text status columns with FK to *_states catalog tables
--     for: delivery_vacancies, delivery_applications, subscriptions,
--     payments, store_verifications.
--   - Added discount_type, discount_value, description, image_url to promotions.
--   - Added created_at to courier_ratings.
--   - Added applied_at to delivery_applications.
--   - Added description, updated_at, deleted_at to products.
--   - Added price, billing_period, description, max_products, features,
--     is_active to plans.
--   - Added CHECK constraint on store_payment_methods.method.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Cleanup (idempotent re-runs)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS payments                       CASCADE;
DROP TABLE IF EXISTS subscriptions                  CASCADE;
DROP TABLE IF EXISTS plans                          CASCADE;
DROP TABLE IF EXISTS store_verifications            CASCADE;
DROP TABLE IF EXISTS courier_ratings                CASCADE;
DROP TABLE IF EXISTS delivery_applications          CASCADE;
DROP TABLE IF EXISTS delivery_vacancies             CASCADE;
DROP TABLE IF EXISTS reviews                        CASCADE;
DROP TABLE IF EXISTS profile_analytics              CASCADE;
DROP TABLE IF EXISTS promotions                     CASCADE;
DROP TABLE IF EXISTS store_payment_methods          CASCADE;
DROP TABLE IF EXISTS products                       CASCADE;
DROP TABLE IF EXISTS stores                         CASCADE;
DROP TABLE IF EXISTS categories                     CASCADE;
DROP TABLE IF EXISTS notifications                  CASCADE;
DROP TABLE IF EXISTS push_tokens                    CASCADE;
DROP TABLE IF EXISTS addresses                      CASCADE;
DROP TABLE IF EXISTS user_roles                     CASCADE;
DROP TABLE IF EXISTS roles                          CASCADE;
DROP TABLE IF EXISTS users                          CASCADE;
DROP TABLE IF EXISTS communes                       CASCADE;
DROP TABLE IF EXISTS regions                        CASCADE;
DROP TABLE IF EXISTS payments_states                CASCADE;
DROP TABLE IF EXISTS subscriptions_states           CASCADE;
DROP TABLE IF EXISTS store_verifications_states     CASCADE;
DROP TABLE IF EXISTS delivery_applications_states   CASCADE;
DROP TABLE IF EXISTS delivery_vacancies_states      CASCADE;

-- ---------------------------------------------------------------------
-- 1) Base catalogs
-- ---------------------------------------------------------------------

CREATE TABLE regions (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL
);

-- Natural Chilean model: a region contains many communes.
CREATE TABLE communes (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    region_id  BIGINT,
    name       TEXT NOT NULL,
    city       TEXT
);

CREATE TABLE roles (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    phone           VARCHAR(20),
    name            TEXT,
    avatar_url      TEXT,
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE categories (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL
);

CREATE TABLE plans (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            TEXT NOT NULL,
    price           NUMERIC(12,2) NOT NULL DEFAULT 0,
    billing_period  TEXT NOT NULL DEFAULT 'monthly',
    description     TEXT,
    max_products    INTEGER,
    features        JSONB,
    is_active       BOOLEAN NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------
-- 1b) State catalog tables (*_states pattern)
--     Each table with more than one possible state gets its own catalog.
--     The referencing table uses state_id (BIGINT FK) instead of status TEXT.
-- ---------------------------------------------------------------------

CREATE TABLE delivery_vacancies_states (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);
INSERT INTO delivery_vacancies_states (name) VALUES
    ('open'),
    ('filled'),
    ('closed');

CREATE TABLE delivery_applications_states (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);
INSERT INTO delivery_applications_states (name) VALUES
    ('pending'),
    ('accepted'),
    ('rejected');

CREATE TABLE subscriptions_states (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);
INSERT INTO subscriptions_states (name) VALUES
    ('trial'),
    ('active'),
    ('expired'),
    ('cancelled'),
    ('suspended');

CREATE TABLE payments_states (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);
INSERT INTO payments_states (name) VALUES
    ('pending'),
    ('paid'),
    ('failed'),
    ('refunded');

CREATE TABLE store_verifications_states (
    id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);
INSERT INTO store_verifications_states (name) VALUES
    ('pending'),
    ('approved'),
    ('rejected'),
    ('requires_info');

-- ---------------------------------------------------------------------
-- 2) Tables that depend on base catalogs
-- ---------------------------------------------------------------------

CREATE TABLE user_roles (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id   BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    UNIQUE (user_id, role_id)
);

-- Stores Expo push tokens per user device.
CREATE TABLE push_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       TEXT NOT NULL,
    platform    TEXT NOT NULL,            -- 'ios' | 'android' | 'web'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, token)
);

CREATE TABLE addresses (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    region_id    BIGINT,
    commune_id   BIGINT,
    street       TEXT,
    number       VARCHAR(20),             -- supports "1234 B", "s/n"
    apartment    TEXT,
    reference    TEXT,
    latitude     NUMERIC(9,6),
    longitude    NUMERIC(9,6),
    metadata     JSONB
);

CREATE TABLE notifications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       TEXT,
    body        TEXT,
    type        TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    read_at     TIMESTAMPTZ,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stores (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id      BIGINT NOT NULL,        -- FK -> users
    category_id   BIGINT,                 -- FK -> categories
    region_id     BIGINT,                 -- FK -> regions
    commune_id    BIGINT,                 -- FK -> communes
    name          TEXT NOT NULL,
    description   TEXT,
    logo_url      TEXT,
    verified      BOOLEAN NOT NULL DEFAULT false,
    metadata      JSONB,
    store_phone   VARCHAR(20),
    opening_time  TIME,
    closing_time  TIME,
    latitude      NUMERIC(9,6),
    longitude     NUMERIC(9,6)
);

-- ---------------------------------------------------------------------
-- 3) Tables that depend on stores
-- ---------------------------------------------------------------------

CREATE TABLE products (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id     BIGINT NOT NULL,
    name         TEXT NOT NULL,
    description  TEXT,
    price        NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock        INTEGER NOT NULL DEFAULT 0,
    image_url    TEXT,
    featured     BOOLEAN NOT NULL DEFAULT false,
    updated_at   TIMESTAMPTZ,
    deleted_at   TIMESTAMPTZ
);

CREATE TABLE store_payment_methods (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id  BIGINT NOT NULL,
    method    TEXT NOT NULL CHECK (method IN ('cash','card','transfer','webpay','mercado_pago','flow'))
);

CREATE TABLE promotions (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id        BIGINT NOT NULL,
    title           TEXT,
    description     TEXT,
    discount_type   TEXT CHECK (discount_type IN ('percentage','fixed')),
    discount_value  NUMERIC(12,2),
    image_url       TEXT,
    valid_from      DATE,
    valid_until     DATE
);

CREATE TABLE profile_analytics (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id      BIGINT NOT NULL,
    date          DATE,
    store_visits  INTEGER NOT NULL DEFAULT 0
);

-- One review per customer per store (UNIQUE enforced).
CREATE TABLE reviews (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id     BIGINT NOT NULL,
    customer_id  BIGINT NOT NULL,          -- FK -> users
    rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (store_id, customer_id)
);

CREATE TABLE delivery_vacancies (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id     BIGINT NOT NULL,
    description  TEXT,
    state_id     BIGINT,                   -- FK -> delivery_vacancies_states
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A courier is a user; courier_id references users(id).
CREATE TABLE delivery_applications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vacancy_id  BIGINT NOT NULL,           -- FK -> delivery_vacancies
    courier_id  BIGINT NOT NULL,           -- FK -> users
    state_id    BIGINT,                    -- FK -> delivery_applications_states
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE courier_ratings (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    courier_id  BIGINT NOT NULL,           -- FK -> users
    store_id    BIGINT NOT NULL,
    stars       SMALLINT CHECK (stars BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_verifications (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id      BIGINT NOT NULL,
    state_id      BIGINT,                  -- FK -> store_verifications_states
    requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by   BIGINT,                  -- FK -> users (reviewer)
    reviewed_at   TIMESTAMPTZ,
    review_notes  TEXT
);

-- ---------------------------------------------------------------------
-- 4) Subscriptions and payments
-- ---------------------------------------------------------------------

CREATE TABLE subscriptions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id    BIGINT NOT NULL,
    plan_id     BIGINT,                    -- FK -> plans
    state_id    BIGINT,                    -- FK -> subscriptions_states
    starts_at   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ
);

CREATE TABLE payments (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subscription_id  BIGINT NOT NULL,
    amount           NUMERIC(12,2),
    currency         VARCHAR(3) DEFAULT 'CLP',
    state_id         BIGINT,               -- FK -> payments_states
    paid_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 5) Foreign keys
-- =====================================================================

ALTER TABLE communes
    ADD CONSTRAINT fk_communes_region
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE SET NULL;

ALTER TABLE user_roles
    ADD CONSTRAINT fk_userroles_role
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_userroles_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE push_tokens
    ADD CONSTRAINT fk_pushtokens_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE addresses
    ADD CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_addresses_region
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_addresses_commune
    FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE SET NULL;

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE stores
    ADD CONSTRAINT fk_stores_owner
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_stores_category
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_stores_region
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_stores_commune
    FOREIGN KEY (commune_id) REFERENCES communes (id) ON DELETE SET NULL;

ALTER TABLE products
    ADD CONSTRAINT fk_products_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE;

ALTER TABLE store_payment_methods
    ADD CONSTRAINT fk_storepayments_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE;

ALTER TABLE promotions
    ADD CONSTRAINT fk_promotions_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE;

ALTER TABLE profile_analytics
    ADD CONSTRAINT fk_analytics_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE;

ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_reviews_customer
    FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE delivery_vacancies
    ADD CONSTRAINT fk_vacancies_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_vacancies_state
    FOREIGN KEY (state_id) REFERENCES delivery_vacancies_states (id) ON DELETE SET NULL;

ALTER TABLE delivery_applications
    ADD CONSTRAINT fk_applications_vacancy
    FOREIGN KEY (vacancy_id) REFERENCES delivery_vacancies (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_applications_courier
    FOREIGN KEY (courier_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_applications_state
    FOREIGN KEY (state_id) REFERENCES delivery_applications_states (id) ON DELETE SET NULL;

ALTER TABLE courier_ratings
    ADD CONSTRAINT fk_courierratings_courier
    FOREIGN KEY (courier_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_courierratings_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE;

ALTER TABLE store_verifications
    ADD CONSTRAINT fk_verifications_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_verifications_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_verifications_state
    FOREIGN KEY (state_id) REFERENCES store_verifications_states (id) ON DELETE SET NULL;

ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_store
    FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_subscriptions_state
    FOREIGN KEY (state_id) REFERENCES subscriptions_states (id) ON DELETE SET NULL;

ALTER TABLE payments
    ADD CONSTRAINT fk_payments_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_payments_state
    FOREIGN KEY (state_id) REFERENCES payments_states (id) ON DELETE SET NULL;

-- =====================================================================
-- 6) Recommended indexes on foreign keys
-- =====================================================================
CREATE INDEX idx_communes_region            ON communes (region_id);
CREATE INDEX idx_userroles_role             ON user_roles (role_id);
CREATE INDEX idx_userroles_user             ON user_roles (user_id);
CREATE INDEX idx_pushtokens_user            ON push_tokens (user_id);
CREATE INDEX idx_addresses_user             ON addresses (user_id);
CREATE INDEX idx_addresses_region           ON addresses (region_id);
CREATE INDEX idx_addresses_commune          ON addresses (commune_id);
CREATE INDEX idx_notifications_user         ON notifications (user_id);
CREATE INDEX idx_stores_owner               ON stores (owner_id);
CREATE INDEX idx_stores_category            ON stores (category_id);
CREATE INDEX idx_stores_region              ON stores (region_id);
CREATE INDEX idx_stores_commune             ON stores (commune_id);
CREATE INDEX idx_products_store             ON products (store_id);
CREATE INDEX idx_storepayments_store        ON store_payment_methods (store_id);
CREATE INDEX idx_promotions_store           ON promotions (store_id);
CREATE INDEX idx_analytics_store            ON profile_analytics (store_id);
CREATE INDEX idx_reviews_store              ON reviews (store_id);
CREATE INDEX idx_reviews_customer           ON reviews (customer_id);
CREATE INDEX idx_vacancies_store            ON delivery_vacancies (store_id);
CREATE INDEX idx_vacancies_state            ON delivery_vacancies (state_id);
CREATE INDEX idx_applications_vacancy       ON delivery_applications (vacancy_id);
CREATE INDEX idx_applications_courier       ON delivery_applications (courier_id);
CREATE INDEX idx_applications_state         ON delivery_applications (state_id);
CREATE INDEX idx_courierratings_courier     ON courier_ratings (courier_id);
CREATE INDEX idx_courierratings_store       ON courier_ratings (store_id);
CREATE INDEX idx_verifications_store        ON store_verifications (store_id);
CREATE INDEX idx_verifications_reviewer     ON store_verifications (reviewed_by);
CREATE INDEX idx_verifications_state        ON store_verifications (state_id);
CREATE INDEX idx_subscriptions_store        ON subscriptions (store_id);
CREATE INDEX idx_subscriptions_plan         ON subscriptions (plan_id);
CREATE INDEX idx_subscriptions_state        ON subscriptions (state_id);
CREATE INDEX idx_payments_subscription      ON payments (subscription_id);
CREATE INDEX idx_payments_state             ON payments (state_id);

# Build context: raíz del repo (monorepo pnpm) — ver docker-compose.yml.
FROM node:22-bookworm-slim AS builder
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# Runtime: sin pnpm/corepack — node_modules ya viene instalado desde el builder,
# se ejecuta con los binarios locales (prisma, tsx) directo.
FROM node:22-bookworm-slim AS runtime
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /repo /repo
WORKDIR /repo/apps/api

ENV NODE_ENV=production
EXPOSE 3000

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

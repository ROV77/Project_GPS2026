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

# Sin curl/wget en la imagen slim: usa el http nativo de Node para pegarle a
# /health. `start_period` da margen a `prisma migrate deploy` + el seed antes
# de contar la primera corrida como fallo.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

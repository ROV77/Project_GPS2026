# Build context: raíz del repo (monorepo pnpm) — ver docker-compose.yml.
FROM node:22-bookworm-slim AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

COPY . .
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

FROM nginx:1.27-bookworm AS runtime
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

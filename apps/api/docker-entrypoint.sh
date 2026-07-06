#!/bin/sh
set -e

# `prisma db seed` invoca "tsx prisma/seed.ts" como comando de shell, buscando
# el binario por PATH (no relativo a cwd) — hay que exponerle node_modules/.bin.
export PATH="$PWD/node_modules/.bin:$PATH"

prisma migrate deploy
prisma db seed

exec node dist/server.js

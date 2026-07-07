#!/bin/sh
set -e

# `prisma db seed` invoca "tsx prisma/seed.ts" como comando de shell, buscando
# el binario por PATH (no relativo a cwd) — hay que exponerle node_modules/.bin.
export PATH="$PWD/node_modules/.bin:$PATH"

prisma migrate deploy
prisma db seed

# No "node dist/server.js": el soporte nativo de TypeScript de Node 22 resuelve
# los .ts vía el algoritmo de módulos ESM, que exige extensión explícita en los
# imports relativos. Los paquetes del workspace (@caserita/validations, etc.)
# se consumen como .ts crudo (sin build propio) con imports sin extensión
# ("./auth.schema"), así que falla con ERR_MODULE_NOT_FOUND. tsx (igual que en
# `pnpm dev`) resuelve esto sin tocar los paquetes compartidos.
exec tsx src/server.ts

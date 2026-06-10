# Guía de dudas — CaseritaApp (Project_GPS2026)

> Documento didáctico para entender el backend (`apps/api`) del proyecto.
> Escrito pensando en alguien que está aprendiendo. Cada sección responde una de tus preguntas.

---

## Índice

1. [¿Qué es Zod y para qué sirve?](#1-qué-es-zod-y-para-qué-sirve)
2. [La dependencia `cors` (no "cor")](#2-la-dependencia-cors-no-cor)
3. [¿Qué es el "dev runner"?](#3-qué-es-el-dev-runner)
4. [Las 4 carpetas de `apps/api/src`: flujo y función](#4-las-4-carpetas-de-appsapisrc-flujo-y-función)
5. [Prisma: `schema.prisma` y `config/prisma.ts`](#5-prisma-schemaprisma-y-configprismats)
6. [¿Para qué existe `lib/http.ts`?](#6-para-qué-existe-libhttpts)
7. [El `import { z } from 'zod'` — ¿qué es esa `z`?](#7-el-import--z--from-zod--qué-es-esa-z)
8. [Paso a paso para iniciar el proyecto](#8-paso-a-paso-para-iniciar-el-proyecto)
9. [Glosario rápido (pipeline, cliente Prisma, ORM ≠ CRM)](#9-glosario-rápido)

---

## 1. ¿Qué es Zod y para qué sirve?

**Zod es una librería de validación de datos.** Su trabajo es revisar que los datos que llegan tengan la forma correcta *antes* de que tu código los use.

Piensa en esto: a tu API le llegan datos desde afuera (desde un formulario, desde otra app, desde Postman...). Tú **no puedes confiar** en que esos datos vengan bien. Alguien podría mandar una categoría sin nombre, o un precio que sea texto en vez de número. Zod es el "portero" que revisa todo en la entrada.

Mira tu propio código en [packages/validations/src/category.schema.ts](../packages/validations/src/category.schema.ts):

```ts
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});
```

Esto se lee así: *"un objeto válido debe tener un campo `name`, que sea un string (texto), con al menos 1 carácter; si no, muestra el error 'El nombre es obligatorio'."*

Cuando en [crud.ts](../apps/api/src/lib/crud.ts) se hace:

```ts
const data = createSchema.parse(req.body);
```

`.parse()` revisa el cuerpo de la petición. Si los datos son válidos, sigue adelante; si no, **lanza un error automáticamente** que tu `errorHandler` convierte en una respuesta `400 Datos inválidos`.

### Zod tiene un segundo superpoder: tipos automáticos

En tu schema también ves esto:

```ts
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
```

`z.infer` toma la regla de validación y **genera el tipo de TypeScript** automáticamente. Así no tienes que escribir el tipo dos veces (una para validar y otra para TypeScript). Defines la regla **una vez** y obtienes validación en tiempo de ejecución **y** tipado en el editor.

**Resumen:** Zod valida datos de entrada y, de paso, te da los tipos de TypeScript gratis.

---

## 2. La dependencia `cors` (no "cor")

La dependencia se llama **`cors`**, y viene de **CORS = Cross-Origin Resource Sharing** (Compartición de Recursos de Origen Cruzado).

### El problema que resuelve

Por seguridad, los navegadores **bloquean** que una página web de un origen (por ejemplo `http://localhost:5173`, donde correría tu frontend) llame a una API de **otro origen** (por ejemplo `http://localhost:3000`, tu backend). A esto se le llama "política del mismo origen".

Sin permiso explícito, el navegador diría: *"No te dejo pedir datos a ese otro servidor"*.

### Cómo lo usas en tu proyecto

En [apps/api/src/app.ts](../apps/api/src/app.ts):

```ts
import cors from 'cors';
// ...
app.use(cors());
```

Esa línea le dice a Express: *"agrega las cabeceras necesarias para que los navegadores permitan que otros orígenes (tu frontend) llamen a esta API"*.

> ⚠️ `cors()` así, sin opciones, permite **cualquier** origen. Está bien para desarrollar, pero para producción normalmente se restringe a los dominios concretos de tu frontend.

---

## 3. ¿Qué es el "dev runner"?

"Dev runner" no es un nombre oficial; es una forma de referirse a la **herramienta que ejecuta tu código en modo desarrollo**. En tu proyecto esa herramienta es **`tsx`**.

Mira el script en [apps/api/package.json](../apps/api/package.json):

```json
"scripts": {
  "dev": "tsx watch src/server.ts"
}
```

¿Qué hace `tsx watch`?

1. **Ejecuta TypeScript directamente.** Normalmente, el navegador y Node.js no entienden `.ts`; habría que compilar a `.js` primero. `tsx` compila "al vuelo" y ejecuta, sin que tú tengas que hacer el paso de compilación manual.
2. **`watch` = "vigilar".** Se queda observando tus archivos. Cada vez que guardas un cambio, **reinicia el servidor automáticamente**. No tienes que parar y arrancar a mano cada vez.

Compáralo con los otros scripts:

| Script | Qué hace | Cuándo se usa |
|---|---|---|
| `dev` (`tsx watch`) | Ejecuta y recarga al guardar | Mientras programas |
| `build` (`tsc`) | Compila TypeScript a JavaScript en `dist/` | Antes de desplegar |
| `start` (`node dist/server.js`) | Ejecuta el JS ya compilado | En producción |

**Resumen:** el "dev runner" (`tsx`) es lo que te deja correr el backend cómodamente mientras desarrollas, recargando solo.

---

## 4. Las 4 carpetas de `apps/api/src`: flujo y función

Tu backend está dividido en 4 carpetas con responsabilidades claras. La idea es **separar las cosas para que cada una haga una sola tarea**. Vamos una por una y luego vemos el flujo completo.

### `config/` — Configuración y conexiones

Aquí vive todo lo que "prepara el terreno": la conexión a la base de datos y la lectura de variables de entorno.

- [config/env.ts](../apps/api/src/config/env.ts): lee y **valida** las variables de entorno (con Zod). Si falta `DATABASE_URL` o el `PORT` está mal, la app **no arranca** y te avisa con un mensaje claro. Esto evita errores raros más adelante.
- [config/prisma.ts](../apps/api/src/config/prisma.ts): crea la conexión a la base de datos (lo vemos en detalle en la sección 5).

### `lib/` — Herramientas reutilizables ("biblioteca")

`lib` viene de *library*. Aquí están las funciones genéricas que se usan en varios lugares para **no repetir código**:

- [lib/http.ts](../apps/api/src/lib/http.ts): utilidades de HTTP (paginación, validar IDs). Ver sección 6.
- [lib/crud.ts](../apps/api/src/lib/crud.ts): la "fábrica" de operaciones CRUD (Crear, Leer, Actualizar, Borrar). `makeCrud()` genera automáticamente las 5 operaciones para cualquier tabla.
- [lib/router.ts](../apps/api/src/lib/router.ts): conecta cada operación CRUD con su ruta HTTP (`GET /`, `POST /`, etc.).

### `middlewares/` — Funciones que se ejecutan "en medio"

Un **middleware** es una función que se ejecuta *entre* que llega la petición y que sale la respuesta. Es como una estación intermedia por la que pasa cada petición.

- [middlewares/notFound.ts](../apps/api/src/middlewares/notFound.ts): si nadie respondió la petición (ruta inexistente), devuelve un `404`.
- [middlewares/errorHandler.ts](../apps/api/src/middlewares/errorHandler.ts): atrapa **cualquier error** que ocurra y lo convierte en una respuesta ordenada (400 si Zod falló, 404/409 si Prisma falló, 500 si fue algo inesperado). Gracias a esto, en `crud.ts` puedes hacer `.parse()` sin un `try/catch` en cada función: el error "cae" hasta aquí.

### `routes/` — Las rutas (los "endpoints" de tu API)

Define **qué URLs existen** y qué hacen. Cada archivo arma las rutas de un recurso.

Mira lo elegante que queda [routes/categories.routes.ts](../apps/api/src/routes/categories.routes.ts) gracias a `lib/`:

```ts
import { createCategorySchema, updateCategorySchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const crud = makeCrud(prisma.categories, createCategorySchema, updateCategorySchema);

export const categoriesRouter = crudRouter(crud);
```

En 8 líneas tienes `GET /categories`, `GET /categories/:id`, `POST`, `PUT` y `DELETE` funcionando. Toda la lógica pesada vive en `lib/`.

Y [routes/index.ts](../apps/api/src/routes/index.ts) junta todas las rutas bajo `/api`:

```ts
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/products', productsRouter);
// ...
```

### El flujo completo (cómo viaja una petición)

Imagina que alguien hace `POST /api/categories` con `{ "name": "Florería" }`:

```
1. server.ts        → arranca y deja la app escuchando en el PORT
2. app.ts           → la petición entra; pasa por cors() y express.json()
3. routes/index.ts  → ve que empieza con /api/categories → la manda a categoriesRouter
4. lib/router.ts    → ve que es POST / → llama a crud.create
5. lib/crud.ts      → valida el body con Zod (createCategorySchema.parse)
6. config/prisma.ts → Prisma inserta la fila en PostgreSQL
7. crud.ts          → responde 201 con la categoría creada
   (si algo falla en cualquier punto → middlewares/errorHandler.ts da la respuesta de error)
```

Cada carpeta hace **una** cosa, y juntas forman una cadena ordenada. Esto se llama **separación de responsabilidades** y es lo que hace que el proyecto sea fácil de mantener y crecer.

---

## 5. Prisma: `schema.prisma` y `config/prisma.ts`

### ¿Qué es `prisma/schema.prisma`?

Es el **plano (mapa) de tu base de datos**. Un único archivo donde se describen todas las tablas, sus columnas y las relaciones entre ellas. Prisma usa este archivo como "fuente de la verdad".

Mira un trozo de [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma):

```prisma
model categories {
  id     BigInt   @id @default(autoincrement())
  name   String
  stores stores[]
}
```

Eso describe la tabla `categories`: tiene un `id` (clave primaria, autoincremental), un `name` de texto, y una relación con `stores`.

Arriba del archivo hay dos bloques importantes:

```prisma
generator client {
  provider = "prisma-client-js"   // genera el cliente Prisma para JavaScript/TypeScript
}

datasource db {
  provider = "postgresql"          // tu base de datos es PostgreSQL
  url      = env("DATABASE_URL")   // la dirección sale de tu archivo .env
}
```

**¿Cuándo se usa este archivo?**

- Cuando ejecutas `prisma generate`: Prisma **lee este plano** y genera el código (el "cliente") que te permite hablar con la base de datos desde TypeScript con autocompletado.
- Cuando ejecutas `prisma db pull`: ocurre al revés, Prisma **mira tu base de datos real** y actualiza este archivo para que coincida. (Tu proyecto usa este enfoque: el script `prisma:pull`.)

### ¿Qué hace `src/config/prisma.ts`?

Es cortísimo pero clave. [apps/api/src/config/prisma.ts](../apps/api/src/config/prisma.ts):

```ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

Línea por línea:

1. `import 'dotenv/config'` → carga las variables del archivo `.env` (entre ellas `DATABASE_URL`).
2. `import { PrismaClient }` → trae el cliente que Prisma generó a partir de tu `schema.prisma`.
3. `export const prisma = new PrismaClient()` → **crea una instancia** del cliente y la comparte para todo el proyecto.

### ¿Qué significa "crear una instancia"?

Una **instancia** es un *objeto concreto y funcionando*, creado a partir de un molde (la clase).

Analogía: `PrismaClient` es como los **planos de un teléfono**. `new PrismaClient()` es **fabricar un teléfono real** a partir de esos planos. Con ese teléfono ya puedes "llamar" a la base de datos.

La palabra clave `new` es la que "fabrica". El objeto resultante (`prisma`) ya tiene lista la conexión, así que puedes escribir `prisma.categories.findMany()` y hablar con tu base de datos.

> 💡 Importante: se crea **una sola** instancia y se reutiliza en todo el proyecto (por eso está en `config/` y se exporta). Crear muchas instancias abriría muchas conexiones y daría problemas.

---

## 6. ¿Para qué existe `lib/http.ts`?

[lib/http.ts](../apps/api/src/lib/http.ts) contiene **dos utilidades pequeñas pero muy usadas** relacionadas con peticiones HTTP. Su objetivo es escribir esa lógica **una vez** y reutilizarla en todo el CRUD.

### Función 1: `parseBigIntId` — validar y convertir IDs

```ts
export function parseBigIntId(value: string): bigint | null {
  if (!/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}
```

**El problema:** en una URL como `GET /api/categories/5`, el `5` llega como **texto** (`"5"`). Pero tus IDs en la base de datos son `BigInt` (números muy grandes). Hay que convertir el texto a `BigInt`, y además protegerse de que alguien mande basura como `/categories/abc`.

Esta función:
- Revisa que sean **solo dígitos** (`/^\d+$/`). Si no, devuelve `null`.
- Si son válidos, los convierte a `BigInt`.

En [crud.ts](../apps/api/src/lib/crud.ts) la usas así:

```ts
const id = parseBigIntId(String(req.params.id));
if (id === null) {
  res.status(400).json({ error: 'ID inválido' });
  return;
}
```

→ *"si el ID no es válido, responde 400 y no sigas"*.

### Función 2: `getPagination` — paginar resultados

```ts
export function getPagination(query: Record<string, unknown>): Pagination {
  // lee ?page=2&limit=20 de la URL, con valores por defecto seguros
}
```

**El problema:** si tu tabla tiene 10.000 productos, no quieres devolverlos todos de golpe. La **paginación** trae los resultados de a "páginas" (por ejemplo, 20 por vez).

Esta función lee `?page=` y `?limit=` de la URL y calcula:
- `skip` → cuántos registros saltar.
- `take` → cuántos traer.
- Pone topes sensatos (por defecto 20 por página, máximo 100) para que nadie pida 1 millón de filas.

En `crud.ts`:

```ts
const { skip, take, page, limit } = getPagination(req.query);
const [data, total] = await Promise.all([
  delegate.findMany({ where: baseWhere, skip, take, orderBy: { id: 'asc' } }),
  delegate.count({ where: baseWhere }),
]);
```

### ¿Cuándo y para qué la uso?

**No la llamas tú directamente casi nunca.** Vive "debajo" de `crud.ts`, que es quien la usa. Tú te beneficias de ella automáticamente cada vez que usas `makeCrud` para crear un recurso. Si algún día creas una ruta a mano (sin `makeCrud`) y necesitas validar un ID o paginar, entonces sí importarías estas funciones directamente.

**Resumen:** `http.ts` evita repetir en cada ruta la lógica de "convertir IDs de la URL" y "paginar listas".

---

## 7. El `import { z } from 'zod'` — ¿qué es esa `z`?

```ts
import { z } from 'zod';
```

La `z` **no es una letra mágica**: es simplemente el **nombre del objeto que la librería Zod exporta**. Los creadores de Zod decidieron empaquetar todas sus herramientas dentro de un objeto y llamarlo `z` (corto, cómodo de escribir).

Desglosando la línea:

- `import { ... } from 'zod'` → "trae algo desde el paquete `zod`".
- `{ z }` → "trae específicamente lo que se llama `z`" (esto se llama *importación con nombre* o *named import*).

Una vez importado, `z` es tu caja de herramientas. Cada cosa que escribes después es un método de ese objeto:

```ts
z.object({ ... })   // "quiero validar un objeto"
z.string()          // "esto debe ser texto"
z.number()          // "esto debe ser número"
z.coerce.number()   // "conviértelo a número si puedes"
z.infer<...>        // "dame el tipo de TypeScript"
```

> 💡 Dato: podrías renombrarla al importar (`import { z as validador } from 'zod'`), pero **toda la comunidad usa `z`** porque así aparece en la documentación oficial. Es una convención, no una obligación del lenguaje.

Compáralo con `import express from 'express'`: ahí `express` es el nombre. Con `{ z }`, `z` es el nombre. Misma idea.

---

## 8. Paso a paso para iniciar el proyecto

Vas a usar **DBeaver** para crear la base de datos en PostgreSQL. Importante aclarar algo primero:

> **DBeaver es solo un programa para *ver y administrar* bases de datos** (un cliente gráfico). **No es PostgreSQL.** DBeaver necesita conectarse a un servidor PostgreSQL que esté corriendo en algún lado. Si no tienes PostgreSQL **instalado**, DBeaver no tiene a qué conectarse.

Por eso el **Paso 0** es conseguir un servidor PostgreSQL. Tienes dos caminos; elige uno:

### Paso 0 — Conseguir un servidor PostgreSQL

**Opción A (recomendada si no quieres instalar nada): PostgreSQL con Docker.**
Si tienes Docker Desktop, levantas Postgres con un comando:

```powershell
docker run --name caserita-pg -e POSTGRES_PASSWORD=tu_password -e POSTGRES_DB=caseritApp -p 5432:5432 -d postgres:16
```

Esto crea un servidor PostgreSQL en `localhost:5432`, con la base `caseritApp` ya creada.

**Opción B: Instalar PostgreSQL en Windows.**
Descarga el instalador desde https://www.postgresql.org/download/windows/ , instálalo y anota la contraseña que pongas para el usuario `postgres`. Quedará escuchando en `localhost:5432`.

> Si eliges la Opción A con Docker, ya no necesitas DBeaver para *crear* la base (Docker la crea con `POSTGRES_DB`). Igual puedes usar DBeaver para *mirar* los datos.

### Paso 1 — Crear la base de datos `caseritApp` (si elegiste Opción B)

En DBeaver:
1. Crea una conexión nueva → tipo **PostgreSQL**.
2. Host: `localhost`, Puerto: `5432`, Usuario: `postgres`, Contraseña: la que pusiste al instalar.
3. Conéctate y crea una base de datos nueva llamada **`caseritApp`** (clic derecho sobre *Databases* → *Create New Database*).

### Paso 2 — Instalar las dependencias del proyecto

Tu proyecto usa **pnpm** (lo dice el `package.json` raíz: `"packageManager": "pnpm@11.1.1"`). Si no tienes pnpm:

```powershell
npm install -g pnpm
```

Luego, desde la raíz del proyecto (`Project_GPS2026`), instala todo el monorepo:

```powershell
pnpm install
```

### Paso 3 — Crear tu archivo `.env`

En la carpeta `apps/api` hay un `.env.example`. Cópialo a `.env` y pon tu contraseña real:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Luego abre [apps/api/.env](../apps/api/.env) y ajusta la línea de conexión. Debe quedar con **tu** contraseña:

```
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/caseritApp?schema=public"
PORT=3000
NODE_ENV=development
```

> Esa línea `DATABASE_URL` es la dirección que Prisma usará para encontrar tu base. Formato:
> `postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BASE?schema=public`

### Paso 4 — Generar el cliente Prisma

Esto lee tu `schema.prisma` y genera el código para hablar con la base:

```powershell
pnpm --filter api prisma:generate
```

(El `--filter api` significa "ejecuta este script dentro del paquete llamado `api`".)

### Paso 5 — Cargar datos de ejemplo (seed)

Tu proyecto trae un archivo [prisma/seed.ts](../apps/api/prisma/seed.ts) que inserta datos de prueba (regiones, categorías, una tienda demo con productos). Ejecútalo:

```powershell
pnpm --filter api prisma:seed
```

> ⚠️ Esto asume que las **tablas ya existen** en la base. Como tu proyecto trabaja con `prisma db pull` (la base manda sobre el schema), las tablas deberían crearse desde tu script SQL del modelo. Si al hacer el seed te dice que las tablas no existen, primero hay que crear el esquema en PostgreSQL (ejecutando el SQL del modelo de datos en DBeaver) y luego correr `prisma:pull` para sincronizar el `schema.prisma`.

### Paso 6 — Arrancar el backend

```powershell
pnpm --filter api dev
```

Si todo va bien, verás en la consola:

```
API escuchando en http://localhost:3000
```

### Paso 7 — Probar que funciona

Abre en el navegador o en Postman:

- http://localhost:3000/health → debe responder `{ "status": "ok" }`
- http://localhost:3000/api/categories → debe responder la lista de categorías

¡Listo! Tu backend está corriendo. 🎉

### Resumen de comandos (de un vistazo)

```powershell
# 0. (una vez) PostgreSQL corriendo, vía Docker o instalado
# 1. Instalar dependencias
pnpm install
# 2. Crear .env con tu DATABASE_URL
Copy-Item apps/api/.env.example apps/api/.env
# 3. Generar cliente Prisma
pnpm --filter api prisma:generate
# 4. Cargar datos demo
pnpm --filter api prisma:seed
# 5. Arrancar
pnpm --filter api dev
```

---

## 9. Glosario rápido

### ¿Qué es un "pipeline"?

En inglés, *pipeline* significa literalmente **"tubería" o "línea de montaje"**. En programación se usa para describir **una serie de pasos encadenados, donde la salida de uno es la entrada del siguiente**.

Ejemplos en tu proyecto:
- El **flujo de una petición** (sección 4) es un pipeline: petición → cors → json → router → validación → base de datos → respuesta. Cada paso pasa el resultado al siguiente.
- En Express, los **middlewares** forman un pipeline: la petición "fluye" por cada `app.use(...)` en orden.
- En CI/CD (integración continua), un "pipeline" es la cadena automática de pasos: instalar → testear → construir → desplegar.

En todos los casos, la idea es la misma: **una cadena ordenada de etapas**.

### ¿Qué es "crear un cliente Prisma"?

Un **cliente** (en este contexto) es un objeto de tu programa que sabe **comunicarse con un servicio externo** — aquí, tu base de datos.

"Crear el cliente Prisma" tiene dos momentos distintos que conviene no confundir:

1. **Generar el cliente** (`prisma generate`): Prisma lee tu `schema.prisma` y **escribe el código** del cliente, hecho a la medida de tus tablas. Por eso después puedes escribir `prisma.categories.findMany()` con autocompletado: ese código fue generado a partir de tu modelo.

2. **Instanciar el cliente** (`new PrismaClient()` en `config/prisma.ts`): crear el objeto que de verdad **abre la conexión** y ejecuta las consultas (es la "instancia" de la sección 5).

En resumen: *generar* = fabricar el código; *instanciar* = encender el objeto que habla con la base.

### ⚠️ Prisma NO es un CRM

Ojo con esta confusión importante:

- **CRM** = *Customer Relationship Management* (gestión de relaciones con clientes). Son programas como Salesforce o HubSpot para gestionar ventas y clientes. **Prisma no es eso.**

- **Prisma es un ORM** = *Object-Relational Mapping* (mapeo objeto-relacional).

Un **ORM** es un traductor entre dos mundos:
- El mundo de la **base de datos**, que piensa en tablas y filas, y se habla en SQL.
- El mundo de tu **código**, que piensa en objetos y funciones (TypeScript).

En vez de escribir SQL a mano así:

```sql
SELECT * FROM categories WHERE id = 5;
```

Con el ORM (Prisma) escribes:

```ts
await prisma.categories.findFirst({ where: { id: 5n } });
```

Prisma traduce eso a SQL por ti, ejecuta la consulta, y te devuelve los resultados como objetos de TypeScript (con tipos y autocompletado). Eso es lo que hace Prisma en tu proyecto: es el **puente entre tu backend y PostgreSQL**.

---

*Documento generado para apoyar el aprendizaje en Project_GPS2026 (CaseritaApp).*

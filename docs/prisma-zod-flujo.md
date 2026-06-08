# Prisma + Zod: cómo funciona una petición en la API

## ¿Qué es Prisma?

Prisma es un ORM (Object-Relational Mapper). Su trabajo es hacer de puente entre el código TypeScript y la base de datos PostgreSQL, de modo que no tengas que escribir SQL a mano.

Tiene tres piezas principales:

| Pieza | Qué hace |
|---|---|
| `schema.prisma` | Describe los modelos (tablas) y sus relaciones |
| `prisma generate` | Lee el schema y genera el `PrismaClient` con tipos TypeScript |
| `PrismaClient` | El objeto con el que consultas la base de datos desde el código |

Una vez generado, el cliente expone un objeto por cada tabla. Por ejemplo, `prisma.products` tiene métodos como `findMany`, `create`, `update`, `delete`, etc. Prisma traduce esas llamadas a SQL internamente.

---

## ¿Qué es Zod?

Zod es una librería de validación de esquemas. Su trabajo es verificar que los datos que llegan en el body de una petición HTTP tienen la forma y los tipos correctos antes de pasarlos a Prisma.

Si los datos no cumplen el esquema, Zod lanza un `ZodError` con el detalle de qué campo falló.

**Ejemplo de esquema Zod** (tomado de `users.routes.ts`):

```ts
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  phone: z.string().max(20).optional(),
});
```

Esto dice: `email` es obligatorio y debe ser un email válido, `password` obligatorio con mínimo 6 caracteres, el resto opcionales.

---

## La arquitectura en este proyecto

El código sigue un patrón de tres capas:

```
routes/*.routes.ts  →  lib/crud.ts  →  config/prisma.ts  →  PostgreSQL
```

Cada ruta no define su lógica directamente. En cambio, llama a `makeCrud` pasándole:
1. El delegate de Prisma (ej. `prisma.products`)
2. El schema Zod para crear
3. El schema Zod para actualizar
4. Opciones como `softDelete`

`makeCrud` devuelve handlers de Express listos para usarse. Luego `crudRouter` los conecta a las rutas HTTP.

---

## Flujo completo de una petición

Ejemplo: `POST /api/products`

```
Cliente HTTP
    │
    │  POST /api/products
    │  Body: { "name": "Empanada", "price": 1500, "store_id": 3 }
    ▼
app.ts — express.json()
    │  Parsea el body JSON a un objeto JS
    ▼
routes/index.ts
    │  Redirige /api/products → productsRouter
    ▼
lib/router.ts — crudRouter
    │  POST / → crud.create
    ▼
lib/crud.ts — create()
    │
    ├─ createSchema.parse(req.body)   ← Zod valida los datos
    │       │
    │       ├─ Si falla → lanza ZodError
    │       └─ Si pasa → devuelve los datos tipados y limpios
    │
    ├─ transform(data)                ← convierte store_id de number a BigInt
    │
    └─ prisma.products.create({ data })  ← Prisma ejecuta el INSERT en PostgreSQL
            │
            ├─ Si hay error de DB → lanza PrismaClientKnownRequestError
            └─ Si ok → devuelve el registro creado
    ▼
res.status(201).json(created)
    │  Responde con el producto creado
    ▼
Cliente HTTP
```

---

## Qué pasa cuando algo falla

Los errores no se manejan en cada handler individualmente. Se lanzan y los captura el middleware `errorHandler` en `middlewares/errorHandler.ts`:

```
ZodError (validación fallida)
    → 400 Bad Request
    → { error: "Datos inválidos", issues: { campo: ["mensaje"] } }

Prisma P2025 (registro no encontrado)
    → 404 Not Found

Prisma P2002 (valor duplicado, viola unique)
    → 409 Conflict

Prisma P2003 (referencia inválida, viola foreign key)
    → 409 Conflict

Cualquier otro error
    → 500 Internal Server Error
```

Esto significa que en los handlers de `makeCrud` no hay `try/catch`. Se dejan caer los errores intencionalmente para que Express los pase al `errorHandler`.

---

## El singleton de Prisma

`config/prisma.ts` exporta una única instancia de `PrismaClient`:

```ts
export const prisma = new PrismaClient();
```

Todos los archivos de rutas importan este mismo objeto. Esto es importante porque `PrismaClient` mantiene un pool de conexiones a la base de datos — si cada archivo creara su propia instancia, habría demasiadas conexiones abiertas.

---

## Resumen visual

```
Request
  └── express.json()         → body como objeto JS
        └── Zod.parse()      → valida y tipifica
              └── transform  → ajusta tipos (ej. BigInt)
                    └── prisma.modelo.método()  → SQL → PostgreSQL
                          └── res.json()        → respuesta al cliente

Error en cualquier paso → errorHandler → respuesta HTTP con código apropiado
```

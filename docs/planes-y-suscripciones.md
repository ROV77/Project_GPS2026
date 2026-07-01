# Planes y suscripciones: guía de estudio del módulo

Este documento no es solo un changelog — está pensado para que entiendas **por qué** el módulo quedó armado así, no solo **qué** archivos se tocaron. Si en el futuro tienes que tocar este código (o algo parecido en otro proyecto), la idea es que reconozcas los patrones y sepas razonar sobre ellos.

---

## 1. El problema, en una frase

Una tienda quiere pagar por el plan Pro y que, al confirmarse el pago, su suscripción quede activa por un mes — y que vuelva sola al plan Gratis cuando ese mes termine.

Parece una frase simple, pero adentro tiene tres problemas de ingeniería distintos, que conviene separar mentalmente:

1. **Modelado de datos**: ¿cómo represento "una tienda tiene este plan, desde tal fecha hasta tal otra"?
2. **Integración con un sistema externo**: el dinero no lo mueve mi API, lo mueve MercadoPago. ¿Cómo me entero de que el pago se aprobó, de forma confiable?
3. **Máquina de estados**: una suscripción no es un booleano "activa/no activa" — pasa por *pendiente → activa → vencida*, y cada transición la dispara un evento distinto.

Vamos por partes.

---

## 2. Modelado de datos: separar el catálogo del contrato

Un error común de diseño es mezclar "qué se vende" con "quién lo compró". Por eso el schema (que ya existía, no lo tocamos) separa tres tablas:

```
plans               → EL CATÁLOGO. Qué planes existen y en qué condiciones.
subscriptions        → EL CONTRATO. Qué tienda compró qué plan, y cuándo empieza/termina.
payments              → EL COMPROBANTE. El cobro puntual asociado a un contrato.
```

La analogía que más ayuda: `plans` es como la lista de precios de un gimnasio ("Plan Mensual: $20.000"); `subscriptions` es tu membresía concreta ("Juan tiene el Plan Mensual desde el 1 hasta el 31 de marzo"); `payments` es la boleta que te dieron el día que pagaste. Nunca confundas la lista de precios con tu membresía — son entidades con ciclos de vida completamente distintos (la lista de precios cambia rara vez; tu membresía se renueva todos los meses).

Esto es justo lo que discutimos en la conversación: **no existe administración del catálogo desde la web** (nadie va a crear/editar planes con un formulario), así que `plans` sigue siendo datos fijos de seed. Todo el trabajo nuevo vive en `subscriptions` y `payments`.

### La decisión de "toda tienda parte en Gratis"

Había dos formas de modelar "toda tienda tiene el plan Gratis por defecto":

- **(a)** Crear una fila en `subscriptions` para cada tienda apenas se registra.
- **(b)** No crear nada: si una tienda no tiene ninguna suscripción, **asumir** que está en el plan Gratis.

Elegimos **(b)**, en `apps/api/src/services/subscriptions.service.ts`, función `getCurrentSubscription`. La razón: (a) obliga a tocar el flujo de registro de tiendas y a "migrar" (backfillear) todas las tiendas que ya existen en la base. (b) es una regla de negocio que se aplica *al leer*, sin tocar nada más — el equivalente a decir "si no tengo el dato, uso el valor por defecto" en vez de "guardo el valor por defecto en todos lados por si acaso". Es el mismo espíritu que ya usa `services/store-status.service.ts` en este proyecto: calcular en vez de almacenar.

```ts
// apps/api/src/services/subscriptions.service.ts
async getCurrentSubscription(storeId: bigint) {
  const latest = await prisma.subscriptions.findFirst({
    where: { store_id: storeId, state_id: activeStateId },
    orderBy: { starts_at: 'desc' },
    ...
  });

  if (!latest) {
    // No hay ninguna fila → la tienda nunca contrató nada → está en Gratis.
    return toResponse(null, await getFreePlan());
  }
  ...
}
```

¿Cómo sabe el sistema cuál plan es "el gratis"? No hay una columna `is_free` — usamos `price === 0` como criterio (`getFreePlan()`). Es una convención implícita: "el plan gratuito es el único que cuesta $0". Funciona porque solo hay uno; si el negocio algún día quisiera dos planes gratuitos distintos, esta regla dejaría de alcanzar y habría que agregar una columna explícita. Vale la pena anotarlo como *deuda técnica documentada* — no es un error, es una simplificación consciente para el MVP.

---

## 3. La máquina de estados de una suscripción

Toda suscripción pasa por (a lo más) tres estados, guardados como filas en la tabla de lookup `subscriptions_states` (que antes estaba vacía — la poblamos en el seed):

```
pending  →  active  →  (vencida, vuelve a "no hay suscripción activa")
```

- **`pending`**: se creó la fila porque el usuario hizo clic en "Contratar", pero MercadoPago todavía no confirma el pago.
- **`active`**: el pago se confirmó. Tiene `starts_at` y `expires_at` (un mes después).
- **Vencida**: en vez de un estado `expired` que alguien tiene que setear activamente, el sistema simplemente **deja de considerar `active`** una fila cuya `expires_at` ya pasó, y crea una fila nueva para el plan Gratis. Fíjate que sí existe el nombre `expired` en el seed (por completitud del vocabulario), pero la lógica actual no lo necesita para funcionar — es la misma filosofía de "compute, don't store" del punto anterior.

¿Por qué guardar el "pendiente" como una fila real en la base, en vez de, por ejemplo, guardarlo en memoria o en una tabla temporal? Porque necesitamos un **ancla** a la que amarrar la respuesta de MercadoPago cuando llegue (ver siguiente sección) — y esa respuesta puede llegar segundos, minutos o (en teoría) nunca. Sin una fila persistente, no habría dónde "aterrizar" la confirmación del pago.

---

## 4. Integrar un pago externo: el patrón preference → redirect → webhook

Esta es la parte más nueva conceptualmente si nunca has integrado una pasarela de pago. La idea central: **tu servidor nunca ve la tarjeta de crédito del usuario**. En vez de eso, el flujo es una coreografía de tres actores (tu API, el navegador del usuario, los servidores de MercadoPago):

```
1. Usuario hace clic "Contratar Pro"
        │
        ▼
2. TU API crea una "Preference" en MercadoPago
   (le dice: "quiero cobrar $9.990 por esto, y esta es la referencia")
        │
        ▼
3. MercadoPago responde con un init_point (una URL)
        │
        ▼
4. TU API le dice al NAVEGADOR: "anda a esa URL"
   (window.location.href = init_point)
        │
        ▼
5. El usuario paga EN LOS SERVIDORES DE MERCADOPAGO, no en los tuyos
        │
        ▼
6. MercadoPago redirige al navegador de vuelta a tu web (back_urls)
   ...pero ESO es solo para que el usuario vea algo. No es confiable.
        │
        ▼
7. En PARALELO, MercadoPago llama a tu API por su cuenta (notification_url)
   avisando "algo cambió en el pago X". ESO SÍ hay que procesarlo.
        │
        ▼
8. Tu API le pregunta A MERCADOPAGO (no confía en lo que le llegó):
   "oye, ¿cómo está el pago X realmente?"
        │
        ▼
9. Si dice "approved" → activas la suscripción en tu base de datos.
```

Esto está implementado en tres piezas:

- **`apps/api/src/config/mercadopago.ts`** — el "adaptador" al SDK oficial. Tiene dos funciones: `createCheckoutPreference` (pasos 2-3) y `getPayment` (paso 8). Nota el patrón `requireClient()`: si no hay `MP_ACCESS_TOKEN` configurado, lanza un `HttpError(503, ...)` con un mensaje claro — **el mismo patrón exacto** que ya usa `apps/api/src/config/cloudinary.ts` para las subidas de imágenes. Cuando encuentras un patrón repetido en un código base, cópialo: significa que el equipo ya decidió cómo se ven los "fallos de configuración externa" en este proyecto.

- **`apps/api/src/services/subscriptions.service.ts`, función `startCheckout`** — paso 2: crea la fila `pending` (el "ancla" del punto 3) y le pasa su `id` como `external_reference` a MercadoPago. Este `external_reference` es la pieza clave: es el hilo que conecta "la preference que creé" con "la fila en mi base de datos", porque MercadoPago me lo va a devolver tal cual cuando llegue el webhook.

- **`apps/api/src/controllers/subscriptions.controller.ts`, función `webhook`** más **`services/subscriptions.service.ts`, función `handleWebhook`** — pasos 7-9. Aquí está la regla de seguridad más importante de toda la integración:

  > **Nunca confíes en el *body* del webhook para decidir nada de dinero.** Úsalo solo para saber "a qué id de pago preguntarle", y después pregúntale a la API oficial de MercadoPago cuál es el estado real.

  ¿Por qué? Porque técnicamente cualquiera podría mandarle un POST falso a `/api/subscriptions/webhook` diciendo "¡el pago fue aprobado!" sin que haya pasado nada. Si tu código activara la suscripción solo por confiar en ese POST, estarías regalando planes Pro gratis a cualquiera que descubra la URL. Por eso `handleWebhook` hace esto:

  ```ts
  async handleWebhook(paymentId: string) {
    const payment = await getPayment(paymentId); // ← vuelve a preguntarle a MercadoPago
    const subscriptionId = payment.external_reference; // ← el dato real viene de acá, no del POST
    ...
    if (payment.status === 'approved') { ... }
  }
  ```

  El `paymentId` que sacamos del POST es solo un **puntero**; el contenido en el que confiamos (`status`, `external_reference`, `amount`) siempre se vuelve a pedir directamente a MercadoPago con nuestro `access_token` privado, que un atacante no tiene.

### Idempotencia: MercadoPago puede avisar más de una vez

Los sistemas de webhooks casi nunca garantizan "exactamente una notificación" — garantizan "al menos una", porque si tu servidor no responde rápido, reintentan. Si tu código no fuera cuidadoso, un mismo pago podría activarse dos veces, o crear dos comprobantes de pago duplicados. La defensa está en una sola línea:

```ts
if (subscription.state_id === activeStateId) return; // ya procesado, no repetir
```

Si la suscripción ya está `active`, no hacemos nada más — sin importar cuántas veces llegue la notificación. No necesitamos guardar el ID del pago de MercadoPago en ninguna columna nueva para lograr esto; el propio estado del negocio (¿ya está activa?) es suficiente como "seguro" contra duplicados. Es una simplificación aceptable para el MVP — si más adelante hay pagos que se reintentan de verdad (ej. reembolsos, contracargos), ahí sí convendría guardar el ID externo del pago.

---

## 5. Por qué "capas" (routes → controllers → services) y no CRUD genérico

Este proyecto tiene dos patrones de backend conviviendo (lo explica `CLAUDE.md`): CRUD genérico (`makeCrud` + `crudRouter`) para recursos simples como `categories` o `regions`, y arquitectura en capas para recursos con reglas de negocio reales, como `delivery/*`.

`subscriptions` claramente pertenece al segundo grupo: no es "guardar y leer una fila", es "decidir si corresponde crear una fila `pending`, o activar directo, o hacer un downgrade, dependiendo del estado actual y de una respuesta externa". Por eso el módulo nuevo copia exactamente la forma de `delivery-vacancies`:

```
routes/subscriptions.routes.ts        → define endpoints + valida con Zod (validateBody)
controllers/subscriptions.controller.ts → lee res.locals.body / res.locals.storeId, llama al service
services/subscriptions.service.ts      → TODA la lógica de negocio vive acá
```

(No agregamos una capa de "repositorio" separada, igual que `delivery-vacancies.service.ts`: el service llama a Prisma directamente. Sacar un repositorio aparte solo vale la pena cuando las consultas se vuelven complejas o se reutilizan en muchos lugares — acá no era el caso.)

Un detalle de plomería que vale la pena notar: la ruta `/api/subscriptions/webhook` **no lleva `requireAuth`**, porque no la llama un usuario logueado — la llama el servidor de MercadoPago. En Express, el orden de registro importa: por eso esa ruta se declara *antes* del `router.use(requireAuth, withStore)`, así ese middleware nunca corre para ella.

```ts
// apps/api/src/routes/subscriptions.routes.ts
subscriptionsRouter.post('/webhook', webhook);          // ← pública, sin auth
subscriptionsRouter.use(requireAuth, withStore);          // ← desde acá para abajo, sí requiere sesión
subscriptionsRouter.get('/me', getMySubscription);
subscriptionsRouter.post('/checkout', validateBody(checkoutSchema), checkout);
```

---

## 6. Un pequeño refactor de paso: `withStore` compartido

Al construir `subscriptions`, nos dimos cuenta de que necesitábamos exactamente la misma lógica que ya existía —inline, sin exportar— dentro de `apps/api/src/routes/products.routes.ts`: "dado el usuario autenticado, encuentra su tienda y déjala en `res.locals.storeId`". Copiar y pegar esa función hubiera creado dos copias de la misma regla de negocio (¿qué pasa si mañana cambia el criterio de "cuál es la tienda del usuario"? Habría que acordarse de actualizar los dos lugares).

En vez de eso, la extrajimos a `apps/api/src/middlewares/withStore.ts` y `products.routes.ts` ahora la importa de ahí. Es un ejemplo pequeño pero real de una heurística útil: **la segunda vez que necesitas una pieza de lógica, es la señal de extraerla — no antes** (extraerla "por si acaso" antes de tener un segundo uso real suele ser sobre-ingeniería).

---

## 7. Recorrido por los archivos nuevos/modificados

| Archivo | Rol |
|---|---|
| `apps/api/prisma/seed.ts` | Datos: estados de suscripción/pago (antes no existían) + `features` (ventajas) de cada plan |
| `packages/validations/src/subscriptions.schema.ts` | Regla de validación del body de `POST /checkout` (compartida, aunque hoy solo la usa la API) |
| `apps/api/src/middlewares/withStore.ts` | Resuelve "la tienda del usuario logueado" (extraído de `products.routes.ts`) |
| `apps/api/src/config/mercadopago.ts` | Adaptador al SDK de MercadoPago (crear preference, consultar pago) |
| `apps/api/src/lib/billingPeriod.ts` | Calcula la fecha de vencimiento según el período de facturación del plan |
| `apps/api/src/services/subscriptions.service.ts` | Toda la lógica de negocio: leer estado actual, iniciar checkout, procesar webhook |
| `apps/api/src/controllers/subscriptions.controller.ts` | Traduce HTTP ↔ service |
| `apps/api/src/routes/subscriptions.routes.ts` | Expone `/api/subscriptions/{me,checkout,webhook}` |
| `apps/api/src/routes/index.ts` | Monta el router nuevo |
| `apps/api/src/config/env.ts`, `.env.example` | Variables nuevas: `MP_ACCESS_TOKEN`, `WEB_PUBLIC_URL`, `API_PUBLIC_URL` |
| `apps/web/src/features/plans/types.ts` | El tipo `Plan` ahora incluye `features` |
| `apps/web/src/features/subscriptions/` | Feature nueva del panel: tipos, llamadas HTTP (`subscriptionsApi`) y hooks de TanStack Query (`useMySubscription`, `useCheckout`) |
| `apps/web/src/features/plans/pages/PlansListPage.tsx` | La pantalla "Planes" pasa de ser una tabla de solo lectura a un catálogo tipo "elige tu plan", con el plan vigente resaltado y botón "Contratar" |

---

## 8. Cómo probarlo de punta a punta

1. Crea una cuenta de *developer* en MercadoPago y saca credenciales de **prueba** (sandbox): `MP_ACCESS_TOKEN` en `apps/api/.env`.
2. El webhook necesita que MercadoPago te alcance desde internet — `localhost` no sirve. Expón tu puerto 3000 con algo como `ngrok http 3000` y usa esa URL pública como `API_PUBLIC_URL`.
3. `pnpm --filter api dev:reset` (reseedea con los nuevos estados y `features` — **ojo, esto borra la base local**).
4. `pnpm --filter api dev` + `pnpm --filter web dev`, entra como el vendedor demo.
5. En `/planes`: deberías ver "Gratis" marcado como tu plan actual, y Pro/Premium con sus ventajas listadas. Haz clic en "Contratar" sobre Pro.
6. Te redirige al Checkout de MercadoPago (sandbox) — usa una [tarjeta de prueba](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards) para simular la aprobación.
7. Al volver, `/planes` debería mostrar "Pro" como tu plan actual, con fecha de vencimiento ~1 mes adelante.
8. Alternativa sin ngrok: desde el panel de developers de MercadoPago puedes **simular manualmente** una notificación de webhook contra tu API, para probar `handleWebhook` sin depender de un pago real.

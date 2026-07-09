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

Toda suscripción pasa por estos estados, guardados como filas en la tabla de lookup `subscriptions_states` (que antes estaba vacía — la poblamos en el seed):

```
pending  →  active  →  expired    (venció solo el mes)
                    →  canceled   (el usuario dio de baja, o cambió a otro plan)
```

- **`pending`**: se creó la fila porque el usuario hizo clic en "Contratar", pero MercadoPago todavía no confirma el pago.
- **`active`**: el pago se confirmó. Tiene `starts_at` y `expires_at` (un mes después).
- **`expired`**: la fila cuya `expires_at` ya pasó. La marca la primera lectura que se da cuenta del vencimiento (`getCurrentSubscription`), no un cron.
- **`canceled`**: baja voluntaria (el botón "Cancelar suscripción") o reemplazo por un cambio de plan (contrataste Premium teniendo Pro).

> **Nota histórica (importante).** En la primera versión, el vencimiento **no** usaba el estado `expired`: se creaba una fila nueva para el plan Gratis y se dejaba la vieja como estaba. Eso resultó ser un error de diseño — dejaba **dos filas `active` a la vez** (la Pro vencida y la Gratis nueva), que la lectura "disimulaba" tomando siempre la más reciente. En la segunda iteración lo corregimos: **ya no se crea ninguna fila de Gratis**. Cuando una suscripción termina (vence, se cancela o se reemplaza) se marca con su estado terminal (`expired`/`canceled`), y el plan Gratis vuelve a quedar **implícito** (ver §9). Esa es la aplicación correcta de "compute, don't store": Gratis = "no hay ninguna fila activa".

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
7. Vuelve manualmente a la pestaña del panel y recarga `/planes`: debería mostrar "Pro" como tu plan actual, con fecha de vencimiento ~1 mes adelante. (Ojo: **no hay redirección automática** de vuelta a la web; el porqué está en §10.)
8. Alternativa sin ngrok: desde el panel de developers de MercadoPago puedes **simular manualmente** una notificación de webhook contra tu API, para probar `handleWebhook` sin depender de un pago real.

> Esta sección es el resumen corto. La **guía completa y a prueba de tropiezos para un desarrollador que parte de cero** (incluida la app de prueba de MercadoPago que puede compartir el equipo) está en **§12**. Los problemas concretos que encontramos al probar (y cómo resolverlos) están en **§10**.

---

## 9. Segunda iteración: cancelar plan, cambiar de plan y el arreglo del "doble activo"

Al probar el módulo de punta a punta aparecieron dos huecos de diseño que corregimos. Esta sección documenta **qué cambió, tanto en lo visual como en lo funcional**.

### 9.1 El problema que disparó los cambios

Con Pro ya contratado, la pantalla de planes seguía mostrando el botón "Contratar" sobre el plan **Gratis**. Al hacer clic, la tienda **bajaba a Gratis al instante y sin aviso**, perdiendo los días de Pro que le quedaban. Peor: por dentro, bajar a Gratis (y también *subir* de Pro a Premium) **no cerraba la suscripción anterior**, así que quedaban dos filas `active` a la vez en la base — el bug de "doble activo".

### 9.2 Cambios visuales (pantalla `/planes`)

El botón de cada tarjeta ahora depende de dos preguntas: *¿es tu plan actual?* y *¿es el plan Gratis?*. Quedaron cuatro casos:

| Situación | Botón que se muestra | Comportamiento |
|---|---|---|
| Gratis, y es tu plan actual | `Plan actual` (deshabilitado) | — |
| Plan **pago**, y es tu plan actual | **`Cancelar suscripción`** (rojo) | Abre un `ConfirmPopover` de confirmación antes de dar de baja |
| Gratis, y **no** es tu actual | `Plan por defecto` (deshabilitado) | El Gratis ya **no se "contrata"**: se llega a él al cancelar o al vencer |
| Plan **pago**, y **no** es tu actual | `Contratar` | Si ya tienes otro plan pago activo, primero avisa (ver abajo) |

El aviso de cambio de plan (cuando ya tienes un plan pago vigente y contratas otro) usa el mismo `ConfirmPopover` y dice, con datos reales:

> *"Ya tienes Pro (vigente hasta 02-08-2026). Al contratar Premium perderás los días restantes, sin reembolso. ¿Continuar al pago?"*

Detalle de plomería: `ConfirmPopover` (en `apps/web/src/shared/ui/ConfirmPopover.tsx`) solo permitía un botón disparador de ancho automático (`inline-flex`). Le agregamos una prop opcional `className` para poder hacerlo de **ancho completo** dentro de la tarjeta, sin romper los otros usos (el default sigue siendo `relative inline-flex`).

### 9.3 Cambios funcionales (backend)

- **Nuevo estado `canceled`** en `subscriptions_states` (seed). Distingue una baja voluntaria/reemplazo de un vencimiento natural (`expired`).
- **Se dejó de crear filas del plan Gratis.** La antigua `activateFreePlan` (que insertaba una fila Gratis `active`) se reemplazó por `endActiveSubscriptions(storeId, 'expired' | 'canceled')`, que **marca como terminadas** las suscripciones activas de la tienda con un `updateMany` y no inserta nada. Gratis vuelve a ser implícito. Esto elimina el "doble activo" de raíz.
- **Nuevo endpoint `POST /api/subscriptions/cancel`** → `subscriptionsService.cancelSubscription`. Da de baja el plan pagado vigente (lo marca `canceled`) y devuelve el estado ya en Gratis. Rechaza con `400` si no hay un plan pagado que cancelar (no se puede "cancelar" Gratis).
- **Cierre del plan anterior al cambiar de plan.** Dentro de `handleWebhook`, cuando un pago se aprueba, la misma transacción ahora también hace un `updateMany` que marca `canceled` **cualquier otra** suscripción activa de la tienda (`id: { not: subscription.id }`). Así, al activar Premium, el Pro viejo se cierra en el mismo acto.
- **Simplificación del camino de vencimiento** en `getCurrentSubscription`: si la última activa ya venció, se llama a `endActiveSubscriptions(storeId, 'expired')` y se devuelve Gratis implícito (antes creaba fila).

> **Decisión de producto (MVP):** el cambio de plan y la cancelación son **inmediatos y sin prorrateo** — no se devuelve ni se acredita el dinero de los días no usados. Es una simplificación consciente; si más adelante importa, ahí conviene calcular crédito proporcional.

### 9.4 Archivos tocados en esta iteración

| Archivo | Cambio |
|---|---|
| `apps/api/prisma/seed.ts` | Nuevo estado `canceled` en `subscriptions_states` |
| `apps/api/src/services/subscriptions.service.ts` | `endActiveSubscriptions` (reemplaza `activateFreePlan`), `cancelSubscription`, cierre del plan anterior en `handleWebhook`, vencimiento sin crear filas |
| `apps/api/src/controllers/subscriptions.controller.ts` | Handler `cancelSubscription` |
| `apps/api/src/routes/subscriptions.routes.ts` | Ruta `POST /cancel` (autenticada) |
| `apps/api/src/config/mercadopago.ts` | `auto_return: 'approved'` **comentado** (ver §10) |
| `apps/web/src/shared/ui/ConfirmPopover.tsx` | Prop opcional `className` para trigger de ancho completo |
| `apps/web/src/features/subscriptions/api/subscriptionsApi.ts` | Método `cancel()` → `POST /subscriptions/cancel` |
| `apps/web/src/features/subscriptions/hooks/useSubscription.ts` | Hook `useCancelSubscription` |
| `apps/web/src/features/plans/pages/PlansListPage.tsx` | Los 4 estados de botón, confirmación de cancelar y aviso de cambio de plan |

---

## 10. Los problemas que encontramos al probar en local (ngrok y el retorno del pago)

Esta sección es un registro honesto de los tropiezos reales, para que el próximo no pierda las mismas horas.

### 10.1 ngrok: identificar bien el *authtoken*

En el panel de ngrok hay una tabla "Authtokens" donde cada credencial tiene un **ID** que empieza con `cr_...`. **Ese ID no es el token.** Si lo usas en `ngrok config add-authtoken cr_...` falla con `ERR_NGROK_105 authentication failed`. El authtoken real (una cadena larga distinta) está en **Getting Started → Your Authtoken** (`https://dashboard.ngrok.com/get-started/your-authtoken`).

### 10.2 ngrok gratis: un solo túnel público

Intentamos abrir **dos** túneles a la vez (uno para la API en `:3000` y otro para el web en `:5173`) y chocamos con `ERR_NGROK_334: the endpoint ... is already online`. El plan **Free de ngrok no permite dos endpoints públicos simultáneos** con dominios distintos. Aunque los declares juntos en `ngrok.yml` (`tunnels:` + `ngrok start --all`), en el plan gratis terminan compartiendo el mismo dominio, que no sirve para separar API y web.

### 10.3 Por qué, al pagar, no vuelve solo a la web

Aquí hubo dos cosas encadenadas:

1. **`auto_return: 'approved'` exige que `back_urls.success` sea una URL pública.** Con `WEB_PUBLIC_URL=http://localhost:5173`, MercadoPago rechaza la preference con `400 auto_return invalid. back_url.success must be defined` (aunque técnicamente *sí* está definida — el problema real es que es `localhost`).
2. Como no teníamos un segundo túnel para el web (ver 10.2), **comentamos `auto_return`** en `apps/api/src/config/mercadopago.ts`. Sin `auto_return`, MercadoPago ya no redirige automáticamente; muestra una pantalla de "pago acreditado" con un botón "Volver al sitio". **Pero ese botón tampoco aparece cuando el `back_url` es `localhost`** (MercadoPago no lo considera un destino público), así que en la práctica el usuario se queda en la pantalla de MercadoPago.

**La clave conceptual:** que no vuelva a la web **no rompe nada**. La activación del plan viaja por un canal **independiente** — el **webhook** (servidor→servidor, vía el túnel de ngrok del `:3000`). La redirección del navegador es solo cosmética. Por eso, tras pagar, basta **recargar `/planes`** manualmente y el plan ya aparece activo.

> **Actualización (tercera iteración, §14).** Ese "basta recargar manualmente" era verdad **solo mientras el webhook llegara**. Resultó que ese único canal era también un **único punto de falla**: si el webhook no llegaba (algo frecuente en sandbox), el plan quedaba en `pending` para siempre. En §14 lo corregimos agregando un **segundo canal de respaldo** — reconciliar el pago al volver del checkout — para que la activación ya **no dependa exclusivamente** del webhook.

### 10.4 Ideas para resolverlo de verdad

Ordenadas de más recomendable a más "parche":

1. **Desplegar el web en una URL pública** (Vercel, Netlify, Render…) y poner esa URL en `WEB_PUBLIC_URL`; ahí se puede **volver a activar `auto_return`** y el retorno automático funciona. Es lo más cercano a producción.
2. **Un segundo dominio/túnel público para el `:5173`**: plan de pago de ngrok (permite dominios estáticos y varios túneles), o alternativas como **Cloudflare Tunnel (`cloudflared`)** que en su tier gratis permite varios hostnames. Con eso, `auto_return` vuelve a funcionar en local.
3. **Servir web y API bajo un mismo dominio** con un reverse proxy (p. ej. Vite proxeando `/api` al `:3000`, y exponer solo ese único puerto por ngrok). Un solo túnel resuelve ambos.
4. **Dejarlo como está para dev/demo** (auto_return comentado) y simplemente recargar `/planes` a mano. Es lo que usamos hoy; funciona, solo que la UX de retorno no es automática.

> **Otro detalle de ngrok:** en el plan gratis la URL pública **cambia cada vez que reinicias** el túnel. Cada vez que la URL cambie hay que actualizar `API_PUBLIC_URL` en `apps/api/.env` (y reiniciar/reseedear no es necesario, pero sí que la API relea el `.env`).

---

## 11. El flujo del código del pago, paso a paso (con nombres de función reales)

Une lo conceptual de §4 con los nombres concretos, en orden de ejecución:

```
FRONTEND (PlansListPage.tsx)
  handleContratar(plan)
    └─ useCheckout().mutate({ plan_id })         → POST /api/subscriptions/checkout

BACKEND — iniciar checkout
  routes/subscriptions.routes.ts  POST /checkout (requireAuth + withStore + validateBody)
  controllers/subscriptions.controller.ts  checkout()
    └─ lee res.locals.storeId y res.locals.body.plan_id
  services/subscriptions.service.ts  startCheckout(storeId, planId)
    ├─ si el plan cuesta 0  → endActiveSubscriptions(...,'canceled') + Gratis implícito (sin pago)
    └─ si el plan cuesta >0 → crea fila `pending` (el "ancla")
                             → config/mercadopago.ts  createCheckoutPreference()
                                  · external_reference = id de la fila pending
                                  · notification_url  = API_PUBLIC_URL + /api/subscriptions/webhook
                             → devuelve { requiresPayment:true, init_point }

FRONTEND
  window.location.href = init_point                → el navegador se va a MercadoPago

MERCADOPAGO
  el usuario paga en su Checkout (sandbox)
  ├─ (cosmético) redirige a back_urls  → hoy deshabilitado, ver §10
  └─ (confiable) POST notification_url → nuestro webhook

BACKEND — procesar webhook  (ruta PÚBLICA, sin auth)
  controllers/subscriptions.controller.ts  webhook()
    └─ extractPaymentId(req)                       → saca solo el id del pago del body/query
  services/subscriptions.service.ts  handleWebhook(paymentId)
    ├─ getPayment(paymentId)                       → RE-consulta el estado real a MercadoPago
    ├─ subscriptionId = payment.external_reference → el hilo de vuelta a nuestra fila
    ├─ if (state_id === active) return;            → idempotencia (puede llegar varias veces)
    └─ if (payment.status === 'approved')  → transacción:
         · crea payments (comprobante, estado approved)
         · updateMany: marca `canceled` cualquier OTRA activa de la tienda (cambio de plan)
         · update: la fila pending → active, con starts_at y expires_at (+1 período)

LECTURA del estado (en cualquier momento)
  GET /api/subscriptions/me → getCurrentSubscription(storeId)
    ├─ busca la última fila `active`
    ├─ si no hay → Gratis implícito
    ├─ si la hay pero venció → endActiveSubscriptions(...,'expired') + Gratis implícito
    └─ si la hay y vigente → ese plan

CANCELAR
  POST /api/subscriptions/cancel → cancelSubscription(storeId)
    ├─ si no hay plan pagado activo → 400
    └─ endActiveSubscriptions(...,'canceled') + Gratis implícito
```

Las dos reglas de oro que gobiernan todo esto (repetidas de §4 porque son las que más fácil se rompen):
1. **Nunca confiar en el body del webhook** para decidir dinero — siempre `getPayment()` con el `access_token` privado.
2. **Idempotencia por estado de negocio** — si ya está `active`, no reprocesar; no hace falta guardar el id externo del pago.

---

## 12. Guía para otro desarrollador: probar la feature desde cero

Pensada para alguien que clona el repo y quiere ver el flujo completo funcionando. El equipo **puede compartir** los datos de la app de prueba de MercadoPago (son de *sandbox*, no mueven dinero real).

### 12.1 Requisitos previos
- PostgreSQL corriendo y `DATABASE_URL` válido en `apps/api/.env`.
- `pnpm` instalado, dependencias instaladas (`pnpm install` en la raíz).
- El ejecutable de **ngrok** y una cuenta gratis (para el authtoken).

### 12.2 Variables en `apps/api/.env`
```
MP_ACCESS_TOKEN=<access token de PRUEBA de la app de MercadoPago>
WEB_PUBLIC_URL=http://localhost:5173
API_PUBLIC_URL=<la URL pública que te dé ngrok, ver 12.4>
```
> En Chile, las credenciales de **prueba** de MercadoPago **también empiezan con `APP_USR-`** (no con `TEST-`, a diferencia de guías antiguas). Lo que importa es que las saques de la pestaña **"Credenciales de prueba"** de la app, no de las productivas. Si el `.env` no tiene `MP_ACCESS_TOKEN` o `API_PUBLIC_URL`, el checkout responde `503 MercadoPago no configurado`.

### 12.3 App y usuario de prueba de MercadoPago (compartibles por el equipo)
- **App de developers:** cuenta en `https://www.mercadopago.cl/developers/panel/app`, producto **Checkout Pro** (no "Suscripciones": este proyecto modela la suscripción por su cuenta —tabla `subscriptions` con `starts_at`/`expires_at`— y MercadoPago solo hace el **cobro puntual**, no el recurrente). El **Access Token de prueba** de la app va en `MP_ACCESS_TOKEN`.
- **Usuario comprador de prueba:** créalo en `https://www.mercadopago.cl/developers/panel/test-users`. Es una cuenta ficticia con la que te logueas **en el Checkout** para pagar. Ejemplo del que creamos para este proyecto (país Chile):
  - Usuario: `TESTUSER5211...` (la cadena completa está en el panel)
  - Contraseña: `8cwmbFQlQF`
  - Código de verificación: `240908`
  - User ID: `3516240908`
> **Regla de oro del sandbox:** no puedes pagar con tu cuenta real de MercadoPago cuando el vendedor está en modo prueba (sale *"Una de las partes con la que intentas hacer el pago es de prueba"*). Tienes que pagar **con el usuario comprador de prueba** — lo más cómodo es hacer el checkout en una ventana de **incógnito** para no mezclar sesiones.

### 12.4 Levantar el túnel (un solo túnel, al `:3000`)
```
ngrok config add-authtoken <tu-authtoken-largo>   # una sola vez
ngrok http 3000
```
Copia la URL `Forwarding` (`https://xxxx.ngrok-free.dev`) a `API_PUBLIC_URL`. **Deja esta terminal abierta** mientras pruebas. Si reinicias ngrok, la URL cambia → actualiza `API_PUBLIC_URL`.

### 12.5 Base de datos y servidores
```
pnpm --filter api dev:reset     # ⚠️ BORRA la base local y reseedea (crea los estados, incluido `canceled`)
pnpm --filter api dev           # API en :3000
pnpm --filter web dev           # web en :5173
```
> El `dev:reset` es **obligatorio** la primera vez con esta versión: si falta el estado `canceled`, el webhook revienta con `500` al aprobar un pago (`handleWebhook` lo busca).

### 12.6 Probar el flujo feliz (contratar Pro)
1. Entra al panel (`http://localhost:5173`) como el **vendedor demo** (`demo@caserita.cl` / `demo123`).
2. `/planes`: verás **Gratis** como plan actual, y Pro/Premium con sus ventajas.
3. Clic en **Contratar** sobre Pro → te vas al Checkout de MercadoPago.
4. Inicia sesión con el **usuario comprador de prueba** (incógnito) y paga con una [tarjeta de prueba](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards) (ej. Mastercard `5031 7557 3453 0604`, venc. `11/30`, CVV `123`, nombre/RUT ficticios).
5. Verás "¡Listo! Tu pago ya se acreditó". **No vuelve solo** a la web (§10). Cambia a la pestaña del panel y **recarga `/planes`**.
6. Debe aparecer **Pro** como plan actual, con vencimiento ~1 mes adelante y el botón rojo **Cancelar suscripción**.

### 12.7 Probar cancelar y cambiar de plan
- **Cancelar:** en la tarjeta de Pro, clic en **Cancelar suscripción** → confirmar. Vuelves a Gratis al instante; el Pro queda `canceled` en la base.
- **Cambiar de plan:** con Pro activo, clic en **Contratar** sobre Premium → aparece el aviso ("perderás los días restantes") → "Ir a pagar" → paga. Al recargar, el plan actual es **Premium** y el Pro anterior quedó `canceled` (no como fila activa fantasma).

### 12.8 Probar el webhook sin ngrok (opcional)
Desde el panel de developers de MercadoPago puedes **simular manualmente** una notificación de webhook (Webhooks → Simular) apuntando a `API_PUBLIC_URL/api/subscriptions/webhook`, para ejercitar `handleWebhook` sin un pago real. Igual necesitas que la API sea alcanzable (ngrok), pero te ahorra repetir el checkout completo.

### 12.9 Tabla de errores frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `503 MercadoPago no configurado` | Falta `MP_ACCESS_TOKEN` o `API_PUBLIC_URL` en `.env` | Complétalos (12.2) y reinicia la API |
| `400 auto_return invalid. back_url.success must be defined` | `auto_return` activo con `WEB_PUBLIC_URL=localhost` | Ya lo dejamos comentado; si reapareció, revisa §10.3 |
| `403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES` al crear preference | Token/cuenta no válidos para ese cobro | Usa el Access Token de **prueba** de la app; revisa que la app esté bien creada |
| *"Una de las partes… es de prueba"* al pagar | Estás pagando con tu cuenta real | Paga con el **usuario comprador de prueba** (incógnito) |
| El pago se acredita pero `/planes` sigue en Gratis | Fallaron **ambos** canales: no llegó el webhook **y** tampoco se confirmó al volver (§14) | ¿Volviste al panel para que corra la confirmación? ¿Sigue vivo el túnel y `API_PUBLIC_URL` coincide? Si ya quedó atascada, destrábala con `set-plan.ts` (§14.11) |
| Webhook responde `500` al aprobar | Falta el estado `canceled` en la base | Corre `pnpm --filter api dev:reset` |
| `ERR_NGROK_105` al guardar authtoken | Copiaste el **ID** `cr_...` en vez del authtoken | Saca el authtoken real de *Your Authtoken* (§10.1) |
| `ERR_NGROK_334` al abrir túnel | Ya hay un túnel online / dos túneles en plan free | Cierra el otro; en local basta un túnel al `:3000` (§10.2) |

---

## 13. ⭐ Lo siguiente (y lo más importante): que los planes *signifiquen* algo

Hasta acá el módulo resuelve **contratar, pagar, cancelar y cambiar** de plan. Pero hay algo que todavía **no** hace, y es justamente lo que le da sentido a cobrar por Pro o Premium: **hoy los tres planes desbloquean exactamente las mismas capacidades.** Un vendedor en Gratis puede hacer lo mismo que uno en Premium. Las "ventajas" que se muestran en `/planes` (`features`) son, por ahora, **solo texto decorativo** — no hay ningún código que las haga cumplir.

> **Este es el trabajo que sigue, y es el más importante del módulo:** convertir cada `feature` listada en una **restricción real** ("gating" o control de acceso por plan). Sin esto, la feature de pagos está técnicamente completa pero **no tiene valor de negocio**: nadie pagaría por algo que ya tiene gratis.

### 13.1 Qué hay que "gatear", según el seed actual

Los planes ya traen los datos que definen qué debería permitir cada uno (`apps/api/prisma/seed.ts`):

| Capacidad | Gratis | Pro | Premium | ¿Dónde vive el dato hoy? |
|---|---|---|---|---|
| Máximo de productos | 20 | ∞ | ∞ | Columna `plans.max_products` (¡ya existe!) |
| Ver estadísticas (dashboard) | ❌ | ✅ | ✅ | Solo como texto en `features` |
| Promociones | ❌ | ✅ | ✅ | Solo como texto en `features` |
| Verificación destacada | ❌ | ❌ | ✅ | Solo como texto en `features` |
| Soporte prioritario | ❌ | ❌ | ✅ | Solo como texto en `features` |

Fíjate que **`max_products` ya es una columna estructurada** (número o `null` = ilimitado): ese es el caso más fácil por dónde empezar, porque no hay que inventar el dato, solo *usarlo*.

**Analizando el código, cada capacidad parte de un punto distinto** — conviene saberlo antes de estimar el trabajo, porque no todas son "poner un candado": algunas requieren *construir la feature* primero.

| Capacidad | Estado hoy en el código | Qué falta |
|---|---|---|
| Límite de productos | El dato existe (`plans.max_products`), pero `products.routes.ts` → `create()` **lo ignora** | Solo *usar* el dato: contar y rechazar |
| Estadísticas | El endpoint **ya existe y funciona para todos** (`GET /stores/:id/stats`, `getStoreStats`) | Solo el candado (middleware) + ocultar la UI en Gratis |
| Promociones | ⚠️ El modelo `promotions` existe en el schema, pero **no hay rutas, controller ni UI** | **Construir la feature completa** y recién ahí gatearla |
| Verificación destacada | La columna `stores.verified` (boolean) **ya existe** | Definir la política que la conecta a Premium (¿la activa el plan? ¿la otorga un admin y Premium solo la destaca?) |
| Soporte prioritario | No es técnico (un canal/label de contacto) | Nada de código; es operativo |

La lección: **"estadísticas" y "límite de productos" son candados rápidos** (la funcionalidad ya está); **"promociones" es un feature nuevo entero** disfrazado de una línea en la tabla de planes. No los estimes igual.

### 13.2 La regla de oro: el candado va en el backend

Es tentador "resolverlo" ocultando botones en el frontend. **Eso no es seguridad, es cosmética.** Cualquiera puede llamar la API directamente (Postman, `curl`) saltándose la UI. La restricción **de verdad** tiene que estar en el **backend**, en el service o middleware que ejecuta la acción:

- **Frontend** → *experiencia*: oculta o deshabilita lo que tu plan no incluye, y muestra un "mejora a Pro" (mejora la UX, evita frustración).
- **Backend** → *autorización*: **rechaza** la acción si el plan no la permite (es el candado real). Ejemplo: al crear el producto nº 21 con plan Gratis, responder `403 Tu plan permite hasta 20 productos`.

Ambos usan la **misma fuente de verdad**: `getCurrentSubscription(storeId)`, que ya sabe en qué plan está la tienda (§2). No hay que inventar un mecanismo nuevo — hay que *consultar el que ya existe* justo antes de cada acción restringida.

### 13.3 Cómo se vería (patrón sugerido, no implementado aún)

La heurística de §6 aplica: en cuanto la pregunta *"¿el plan de esta tienda permite X?"* aparezca por **segunda** vez, conviene extraerla a un solo lugar en vez de repetir la consulta. Un helper del estilo:

```ts
// apps/api/src/services/plan-access.service.ts  (a crear)
// Fuente única de "qué permite el plan vigente de la tienda".
async function assertCanAddProduct(storeId: bigint) {
  const { plan } = await subscriptionsService.getCurrentSubscription(storeId);
  if (plan.max_products === null) return;            // ilimitado
  const count = await prisma.products.count({ where: { store_id: storeId } });
  if (count >= plan.max_products) {
    throw new HttpError(403, `Tu plan permite hasta ${plan.max_products} productos.`);
  }
}
```

…y llamarlo desde la función `create()` de `apps/api/src/routes/products.routes.ts`, **justo antes de `crud.create(req, res)`**. Ojo: productos **no tiene capa de service** — usa `makeCrud` directo en la ruta (§5), así que el candado se inserta ahí, en el `create()` que ya envuelve al CRUD para forzar el `store_id`. (Si prefieres, este es un buen momento para extraer un `products.service.ts`, pero no es obligatorio.)

Para las capacidades booleanas (estadísticas, promociones, verificación), el mismo patrón pero preguntando por la `feature` — y para las rutas gateadas conviene un **middleware** al estilo `requireFeature('canViewStats')` (misma forma que `withStore`), compuesto en la ruta: `storesRouter.get('/:id/stats', requireFeature('canViewStats'), getStoreStats)`. Compara siempre contra una clave estructurada, no contra el texto libre de `features` (ver la deuda técnica de §13.4).

En el frontend, el hook `useMySubscription` ya trae el plan; basta condicionar el render (`plan.name === 'Gratis' ? <Bloqueado/> : <Estadísticas/>`), o mejor, exponer las capacidades de forma explícita para no comparar por nombre.

### 13.4 Una deuda técnica a resolver de paso

Hoy las ventajas viven como **strings de texto libre** en `plans.features` (`'Ver estadísticas (dashboard)'`). Eso sirve para *mostrarlas*, pero es frágil para *decidir con ellas* (un typo o un cambio de redacción rompería el gating). Cuando se implemente el control de acceso, conviene modelar las capacidades como **claves estables** (p. ej. `can_view_stats`, `can_use_promotions`, `is_verified`) — sea como columnas booleanas del plan, como una tabla `plan_features`, o como un `enum`. Así el candado compara contra un identificador estable, no contra un texto pensado para el usuario.

### 13.5 Orden sugerido para abordarlo

1. **Límite de productos** (más fácil y ya tiene el dato): candado en el `create()` de `products.routes.ts` usando `plan.max_products`. Es el mejor "primer gating" para dejar el patrón montado.
   - **Caso borde a decidir:** ¿qué pasa si una tienda con 50 productos (contratados en Pro) **baja a Gratis** (límite 20)? Lo recomendable es **no borrar** productos existentes —eso sería destruir datos del usuario— sino solo **bloquear crear nuevos** hasta que baje de 20 por su cuenta. Es decir, el candado se evalúa *al crear*, no retroactivamente. Conviene también reflejarlo en la UI ("estás sobre el límite de tu plan").
2. **Modelar las capacidades booleanas** como flags estables (§13.4) en el schema + seed.
3. **Estadísticas y Promociones** (Pro+): gatear sus endpoints y ocultar su UI.
4. **Verificación destacada y Soporte prioritario** (Premium): normalmente son más "de negocio" que técnicas (un badge, una cola de soporte distinta), pero el candado de acceso es el mismo patrón.

> En resumen: **la infraestructura de cobro ya está; falta la contraparte que la justifica.** Mientras los planes no restrinjan nada, pagar no cambia nada para el vendedor. Este es el punto donde el módulo pasa de "funciona técnicamente" a "tiene sentido de producto".

---

## 14. Tercera iteración: reconciliar el pago al volver (arreglar «pagué y el plan no se actualizó»)

> Esta sección documenta un arreglo posterior a la segunda iteración (§9). El nombre "tercera iteración" es cronológico; convive con el trabajo pendiente de §13.

### 14.1 El síntoma

Levantando el stack con Docker, entrando al panel web y mejorando un perfil de **Gratis → Pro**: el Checkout de MercadoPago funcionó perfecto, se pagó con las cuentas de prueba, y MercadoPago ofreció volver al panel. **El pago se realizó, pero el plan del perfil no se actualizó** — seguía en `pending`, nunca pasó a `active`.

### 14.2 El diagnóstico: un solo canal es también un solo punto de falla

Repasando §4: la activación del plan **solo** ocurría dentro de `handleWebhook`, que **solo** se dispara cuando MercadoPago llama al `notification_url` (webhook servidor→servidor). El retorno del navegador a `back_urls.success` era **puramente cosmético**: la pantalla `/planes` únicamente leía el query param `status`, mostraba un *toast* y hacía **un** `refetch` — nunca confirmaba el pago contra el backend.

Eso deja al webhook como **único punto de falla**, con dos modos de rotura:

1. **Carrera (aunque el webhook funcione):** el usuario vuelve al panel y el frontend refetchea *de inmediato*, pero el webhook puede llegar segundos después. Como no hay reintento, el usuario ve el plan viejo y ahí se queda.
2. **El webhook no llega ni se procesa:** en sandbox, la entrega de webhooks de MercadoPago es **poco confiable** (a veces no lo envía, o deja de reintentar si el túnel parpadeó un instante). Y como no hay cron ni ningún respaldo, la suscripción queda en `pending` **para siempre**. Este era exactamente el caso.

**Cómo lo confirmamos (registro honesto, al estilo §10).** Inspeccionando la base de datos aparecieron suscripciones `Pro` atascadas en `pending` **sin ninguna fila en `payments`** — es decir, `handleWebhook` nunca corrió para ellas. En paralelo probamos que el endpoint del webhook **sí era alcanzable** desde internet (`POST` al `notification_url` a través del túnel → `HTTP 200`), lo que **descartó** un problema de ngrok/nginx y dejó a la vista la verdadera causa: no era plomería rota, era la **fragilidad de depender de un solo canal asíncrono sin respaldo**.

### 14.3 La idea del arreglo: usar lo que MercadoPago ya te devuelve

Cuando MercadoPago redirige el navegador de vuelta, **adjunta a la URL** los datos del pago como query params: `payment_id`, `status`, `external_reference`, `collection_id`, `merchant_order_id`, etc. Es decir, **el navegador ya vuelve con el id del pago en la mano.**

En vez de *confiar* en que el webhook ya corrió, ahora el frontend **usa ese `payment_id` para pedirle al backend que reconcilie el pago en el acto.** La activación pasa de ser una *espera pasiva* ("ojalá llegue el webhook") a una *confirmación activa* ("volví, confirma este pago ahora"). El webhook **no se elimina**: queda como **respaldo** para el caso en que el usuario cierre la pestaña antes de volver.

Dicho de otra forma: ahora hay **dos caminos independientes** que llevan al mismo lugar, y basta con que **uno** de los dos funcione.

```
                 ┌─(A) webhook  (servidor→servidor, async, sin sesión)──┐
pago aprobado ───┤                                                      ├──► reconcilePayment() ──► plan activo
                 └─(B) confirm   (browser→API al volver, con sesión) ───┘
```

### 14.4 Reusar, no duplicar: `reconcilePayment()`

La lógica de activación (re-consultar el pago, ubicar la suscripción por `external_reference`, activar si está aprobado, cerrar otras activas) **vivía inline dentro de `handleWebhook`**. Como ahora la necesitan **dos** entradas, la extrajimos a una función compartida — es la heurística de §6 otra vez: *el segundo uso es la señal de extraer*.

```ts
// apps/api/src/services/subscriptions.service.ts

// Núcleo compartido. `expectedStoreId` es opcional (ver 14.5).
async function reconcilePayment(paymentId: string, expectedStoreId?: bigint) {
  const payment = await getPayment(paymentId);           // ← regla de oro §4: re-preguntar a MP
  const subscriptionId = payment.external_reference;
  ...
  if (subscription.state_id === activeStateId) return;   // ← idempotencia §4 (ahora entre 2 canales)
  if (payment.status === 'approved') { /* misma transacción de siempre */ }
}

// Las dos entradas quedan mínimas y comparten TODAS las garantías:
async handleWebhook(paymentId: string) {
  await reconcilePayment(paymentId);                     // webhook: sin sesión
},
async confirmCheckout(storeId: bigint, paymentId: string) {
  await reconcilePayment(paymentId, storeId);            // confirm: con sesión → pasa el store
  return this.getCurrentSubscription(storeId);           // devuelve el estado ya actualizado
},
```

Ambos caminos heredan las mismas dos reglas de oro de §4: **nunca confiar en quien invoca** (siempre `getPayment()` con el `access_token` privado) e **idempotencia por estado de negocio** (si ya está `active`, no reprocesar).

### 14.5 La guarda `expectedStoreId` (seguridad de la confirmación autenticada)

El webhook es anónimo (lo llama MercadoPago), así que se guía **solo** por el pago real. Pero `/confirm` lo llama un usuario **con sesión**, y podría intentar pasar un `payment_id` **ajeno**. Para eso `confirmCheckout` le pasa a `reconcilePayment` el `storeId` de la sesión, y la función **se niega a activar una suscripción que no sea de esa tienda**:

```ts
if (expectedStoreId !== undefined && subscription.store_id !== expectedStoreId) return;
```

Es *defensa en profundidad*: aunque el peor caso sería activar una suscripción **que igual ya está pagada** (no se regala nada), preferimos que la sesión de una tienda no pueda tocar la suscripción de otra. El webhook omite la guarda a propósito (no tiene sesión con la cuál comparar).

### 14.6 Idempotencia entre los dos canales

Antes la idempotencia protegía contra "MercadoPago avisa el mismo pago dos veces". Ahora protege, además, contra "el webhook **y** la confirmación llegan casi a la vez para el mismo pago". La defensa es la misma línea de siempre (`if (state_id === active) return`): el primero que llega activa; el segundo ve que ya está activa y no hace nada. **No hizo falta ninguna columna nueva.**

### 14.7 El endpoint nuevo y el frontend

- **`POST /api/subscriptions/confirm`** (autenticado: `requireAuth` + `withStore` + `validateBody`). Body `{ payment_id }`. Devuelve la suscripción vigente con sus `capabilities`, **igual que `GET /me`**, para que el frontend actualice la UI de una.
- **`confirmSchema`** en `packages/validations/src/subscriptions.schema.ts` (misma convención que `checkoutSchema`).
- **Frontend** (`apps/web/src/features/subscriptions/`): método `subscriptionsApi.confirm(paymentId)` y hook `useConfirmCheckout`, que al confirmar **deja la suscripción devuelta directo en la cache** (`queryClient.setQueryData`) — el banner "Tu plan actual" cambia a Pro sin esperar otro request.
- **`PlansListPage.tsx`**: al volver con `status=success`, lee `payment_id` (o `collection_id` en integraciones antiguas) de la URL y llama a `confirm`. Si **no** viene `payment_id`, cae al comportamiento anterior (*toast* + `refetch`, confiando en el webhook) — degradación elegante, nunca peor que antes.

### 14.8 Cómo queda el flujo ahora (agrega esto a §11)

```
MERCADOPAGO
  el usuario paga en su Checkout (sandbox)
  ├─ (A, respaldo) POST notification_url  → webhook → handleWebhook → reconcilePayment(id)
  └─ (B, principal) redirige al navegador a back_urls.success?...&payment_id=XXX

FRONTEND — al volver (PlansListPage.tsx, useEffect sobre searchParams)
  status === 'success' && paymentId
    └─ useConfirmCheckout().mutate(paymentId)     → POST /api/subscriptions/confirm

BACKEND — confirmar (ruta AUTENTICADA)
  controllers/subscriptions.controller.ts  confirmCheckout()
    └─ res.locals.storeId + res.locals.body.payment_id
  services/subscriptions.service.ts  confirmCheckout(storeId, paymentId)
    ├─ reconcilePayment(paymentId, storeId)       → activa el plan en el acto (idempotente)
    └─ getCurrentSubscription(storeId)            → devuelve el estado ya actualizado
```

### 14.9 Por qué esto sí funciona de punta a punta en el stack Docker actual

La §10 describía el setup **viejo** (`pnpm dev` + túnel personal, con `WEB_PUBLIC_URL=http://localhost:5173`), donde MercadoPago **ni siquiera mostraba** el botón "Volver al sitio" porque el `back_url` era `localhost`. El stack Docker actual (ver `docs/docker-guia.md`) es distinto: `WEB_PUBLIC_URL` es el **dominio ngrok público** del equipo, así que MercadoPago **sí** redirige de vuelta al panel **con los query params**. Por eso la confirmación al volver (canal B) funciona de verdad hoy, sin depender de reactivar `auto_return`.

### 14.10 Archivos tocados en esta iteración

| Archivo | Cambio |
|---|---|
| `apps/api/src/services/subscriptions.service.ts` | Extraído `reconcilePayment(paymentId, expectedStoreId?)`; `handleWebhook` ahora delega en él; nuevo `confirmCheckout(storeId, paymentId)` |
| `apps/api/src/controllers/subscriptions.controller.ts` | Handler `confirmCheckout` (lee `storeId` + `payment_id`, responde con la suscripción + capacidades) |
| `apps/api/src/routes/subscriptions.routes.ts` | Ruta `POST /confirm` (autenticada, con `validateBody(confirmSchema)`) |
| `packages/validations/src/subscriptions.schema.ts` | `confirmSchema` + tipo `ConfirmInput` |
| `apps/web/src/features/subscriptions/api/subscriptionsApi.ts` | Método `confirm(paymentId)` → `POST /subscriptions/confirm` |
| `apps/web/src/features/subscriptions/hooks/useSubscription.ts` | Hook `useConfirmCheckout` (deja el resultado en la cache) |
| `apps/web/src/features/plans/pages/PlansListPage.tsx` | Al volver del checkout, confirma con el `payment_id` de la URL en vez de solo refetchear |

### 14.11 Dato operativo: destrabar suscripciones que ya quedaron en `pending`

Las suscripciones que se atascaron **antes** de este arreglo no se reparan solas (su pago en MercadoPago ya expiró como notificación). Para dejar a esa tienda en el plan que pagó, usa el script de desarrollo del equipo:

```
docker compose exec api npx tsx set-plan.ts <email-del-vendedor> Pro
```

`set-plan.ts` cierra cualquier activa previa y crea la suscripción activa por un mes (sin pasar por MercadoPago). Los intentos de checkout abandonados que hayan quedado en `pending` son inofensivos (`getCurrentSubscription` solo mira las `active`), pero conviene marcarlos `canceled` para no confundir a quien depure la tabla más adelante.

### 14.12 Deuda técnica / mejoras futuras de este arreglo

- **Feedback de "activando…" en la UI:** hoy la confirmación es rápida, pero si el `getPayment` de MercadoPago tarda, la tarjeta no muestra un estado intermedio. Un spinner mientras `confirm.isPending` mejoraría la percepción.
- **Reintento si el pago aún está `pending` al volver:** si el usuario vuelve muy rápido y MercadoPago todavía reporta `in_process`, `reconcilePayment` no activa (correcto) y quedamos a la espera del webhook. Un *polling* corto de `GET /me` tras confirmar cubriría ese hueco sin depender del webhook.
- **Guardar el `payment_id` externo:** seguimos sin persistir el id del pago de MercadoPago (la idempotencia es por estado de negocio, §4). Si algún día hay reembolsos/contracargos, ahí sí conviene una columna con el id externo para conciliaciones más finas.

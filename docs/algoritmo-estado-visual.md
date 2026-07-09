# Documento Explicativo de Avance 2: Algoritmo de Estado Visual (Semáforo)

## ¿Qué se implementó y por qué?

Este documento explica el algoritmo que calcula el **estado visual** de cada tienda en CaseritApp: un sistema de semáforo (🟢 Verde / 🟡 Amarillo / 🔴 Rojo) que indica a los clientes si una tienda está abierta, próxima a cerrar, o cerrada.

---

## 1. Los tres estados del semáforo

| Color | Estado | Cuándo se asigna |
| ----- | -------------- | -------------------------------------------------------------------- |
| 🟢 | `open` | La hora actual está dentro del horario y faltan **más de 30 min** |
| 🟡 | `closing_soon` | La hora actual está dentro del horario y faltan **≤ 30 min** |
| 🔴 | `closed` | Fuera del horario, o la tienda no tiene horarios configurados |

### ¿Por qué 30 minutos como umbral?

30 minutos es un valor razonable que permite al cliente decidir si le da tiempo de llegar o hacer un pedido antes del cierre. Este valor es una constante configurable en [`store-status.service.ts`](../apps/api/src/services/store-status.service.ts):

```typescript
const CLOSING_SOON_THRESHOLD_MINUTES = 30;
```

Si en el futuro se decide cambiar el umbral (por ejemplo a 15 o 45 minutos), basta con modificar esta constante.

---

## 2. Modelo de datos utilizado

No se crearon nuevas tablas ni columnas. El algoritmo usa los campos **ya existentes** en la tabla `stores`:

```sql
opening_time TIME,    -- ej: '09:00:00'
closing_time TIME,    -- ej: '21:00:00'
```

El estado se **calcula en tiempo real** a partir de estos campos y la hora del servidor. **No se persiste** en la base de datos, ya que cambiaría constantemente.

### ¿Por qué no guardar el estado en la DB?

- El estado depende de la **hora actual**, que cambia cada segundo.
- Guardarlo obligaría a tener un cron o trigger que actualice todas las tiendas continuamente.
- Calcularlo al vuelo en el servidor es trivial en costo (solo aritmética de minutos).
- Es consistente: nunca puede haber desincronización entre la hora real y el estado almacenado.

---

## 3. Función pura `calculateStoreStatus`

### ¿Qué se creó?

[`store-status.service.ts`](../apps/api/src/services/store-status.service.ts) contiene la función principal `calculateStoreStatus`:

```typescript
function calculateStoreStatus(
  openingTime: string | null,   // "HH:mm:ss"
  closingTime: string | null,   // "HH:mm:ss"
  now?: Date,                   // inyectable para testing
): StoreStatusResult
```

### ¿Por qué es una función pura?

Una función pura no depende de estado externo ni produce efectos secundarios. Solo recibe datos y devuelve un resultado. Esto tiene ventajas concretas:

1. **Testeable**: se puede probar con cualquier hora sin mockear `Date`, simplemente pasando un valor en el parámetro `now`.
2. **Reutilizable**: puede usarse en cualquier contexto (endpoint individual, listado, futuro frontend SSR).
3. **Predecible**: dados los mismos inputs, siempre produce el mismo output.

### ¿Cómo maneja la zona horaria?

Los campos `TIME` de PostgreSQL no tienen zona horaria, y el servidor puede correr en UTC. La función usa `Intl.DateTimeFormat` para convertir la hora del servidor a la zona horaria de Chile (`America/Santiago`):

```typescript
const STORE_TIMEZONE = 'America/Santiago';

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: STORE_TIMEZONE,
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});
const currentTimeStr = formatter.format(currentDate); // "HH:mm:ss" en hora chilena
```

Esto es importante porque Chile tiene horario de verano (CLST) y horario de invierno (CLT), con una diferencia de 1 hora. `Intl.DateTimeFormat` maneja automáticamente el cambio de horario estacional.

### ¿Cómo soporta horarios nocturnos?

Algunas tiendas abren de noche y cruzan la medianoche (ej. 22:00 → 03:00). La función detecta este caso comparando `opening_time` con `closing_time`:

```typescript
function isWithinSchedule(current: number, open: number, close: number): boolean {
  if (close > open) {
    // Caso normal: 09:00 → 21:00
    return current >= open && current < close;
  }
  // Caso nocturno: 22:00 → 03:00
  // Abierto si es ≥ 22:00 O < 03:00
  return current >= open || current < close;
}
```

| Tienda | `opening_time` | `closing_time` | Hora actual | Resultado |
| ------ | -------------- | -------------- | ----------- | --------------- |
| Panadería | 09:00 | 21:00 | 15:30 | 🟢 `open` |
| Panadería | 09:00 | 21:00 | 20:45 | 🟡 `closing_soon` |
| Panadería | 09:00 | 21:00 | 22:00 | 🔴 `closed` |
| Bar | 22:00 | 03:00 | 23:30 | 🟢 `open` |
| Bar | 22:00 | 03:00 | 02:45 | 🟡 `closing_soon` |
| Bar | 22:00 | 03:00 | 10:00 | 🔴 `closed` |
| Sin horario | null | null | cualquier | 🔴 `closed` |

---

## 4. Integración en el repositorio de tiendas

### ¿Qué se modificó?

[`store.repository.ts`](../apps/api/src/repositories/store.repository.ts) ahora enriquece cada fila del listado con el estado visual:

```typescript
const stores: StoreWithRating[] = rawStores.map((store) => {
  const statusResult = calculateStoreStatus(store.opening_time, store.closing_time);
  return {
    ...store,
    status: statusResult.status,
    color: statusResult.color,
    minutesUntilClose: statusResult.minutesUntilClose,
  };
});
```

El raw query sigue siendo exactamente el mismo (no se tocó el SQL). Se agregó un paso de post-procesamiento en JavaScript que no afecta el rendimiento, ya que el cálculo es pura aritmética de minutos.

### ¿Por qué no calcular el estado en SQL?

Tres razones:

1. **Zona horaria**: SQL `TIME` no tiene zona horaria, y manejar `America/Santiago` con cambio de horario estacional en SQL puro es complejo y frágil.
2. **Testabilidad**: una función JavaScript es trivial de testear. Una expresión SQL embebida en un raw query no lo es.
3. **Reutilización**: la misma función se usa en el endpoint individual `GET /stores/:id/status` sin duplicar lógica.

---

## 5. Nuevo endpoint `GET /stores/:id/status`

### ¿Qué se creó?

Un endpoint ligero en [`stores.routes.ts`](../apps/api/src/routes/stores.routes.ts) que devuelve **solo** el estado visual de una tienda:

```
GET /api/stores/1/status
→ { "status": "open", "label": "Abierto", "color": "green", "minutesUntilClose": 142 }
```

### ¿Para qué sirve?

La app mobile puede necesitar refrescar el indicador del semáforo periódicamente (ej. cada 5 minutos) sin recargar toda la ficha de la tienda con sus productos, reviews, rating, etc. Este endpoint es mucho más liviano.

### ¿Por qué va antes de las rutas CRUD?

Express evalúa las rutas en orden de registro. La ruta `GET /:id/status` debe registrarse **antes** de la ruta genérica `GET /:id` del CRUD. Si no, Express interpretaría `"status"` como un ID y daría error o 404.

```typescript
// Orden correcto
storesRouter.get('/:id/status', ...);  // ← se evalúa primero
storesRouter.use('/', crudRoutes);      // ← /:id no captura "status" porque ya fue manejado

// (la ruta /:id/status tiene un segmento adicional "/status", así que 
//  Express NO la confunde con /:id — son patrones diferentes)
```

---

## 6. Tipos compartidos

### ¿Qué se modificó?

[`packages/shared-types/src/store.types.ts`](../packages/shared-types/src/store.types.ts) ahora exporta:

| Tipo | Descripción |
| ---- | ----------- |
| `StoreVisualStatus` | Unión de string: `'open' \| 'closing_soon' \| 'closed'` |
| `StoreStatusResult` | Objeto completo con `status`, `label`, `color`, `minutesUntilClose` |
| `StoreWithRating` (modificado) | Ahora incluye `status`, `color`, `minutesUntilClose` |

### ¿Por qué en `shared-types` y no en la API?

Porque el frontend (web y mobile) necesita estos tipos para tipar las respuestas del API y para renderizar el componente visual del semáforo. Al estar en `shared-types`, se importan sin duplicar definiciones.

---

## 7. Diseño para extensibilidad futura

La implementación actual asume un horario fijo (`opening_time` / `closing_time` únicos para todos los días). Si en el futuro se agrega una tabla `store_schedules` con horarios por día de la semana, el cambio sería:

1. Crear la tabla `store_schedules` con `day_of_week`, `opening_time`, `closing_time`.
2. Modificar `calculateStoreStatus` para aceptar un array de horarios y buscar el del día actual.
3. El resto (endpoint, tipos, integración) no cambia.

La función pura facilita esta extensión porque la lógica de cálculo está **aislada** en un solo archivo.

---

## Resumen de decisiones de diseño

| Decisión | Alternativa descartada | Razón |
| -------- | ---------------------- | ----- |
| Estado calculado al vuelo | Guardarlo en la DB | Evita desincronización; no necesita cron |
| Función pura con `now` inyectable | Usar `Date.now()` interno | Permite unit tests determinísticos |
| `Intl.DateTimeFormat` para zona horaria | Librería externa (luxon, dayjs) | Nativo de Node.js, sin dependencias |
| Post-procesamiento en JS, no en SQL | `CASE WHEN` en el raw query | Zona horaria estacional imposible en SQL puro |
| Umbral como constante nombrada | Valor hardcoded | Auto-documentado y fácil de cambiar |
| Endpoint individual `/status` | Solo en el listado | La mobile app necesita refrescar sin cargar todo |
| Soporte cruce de medianoche | Asumir siempre `open < close` | Hay tiendas nocturnas en la app |

---

*Documento generado para apoyar el aprendizaje en Project_GPS2026 (CaseritaApp).*

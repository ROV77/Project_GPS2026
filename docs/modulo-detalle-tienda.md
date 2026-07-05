# Módulo Detalle de Tienda: cómo se conectan `mobile` y `api`

Este documento explica, con código real del repo, cómo la app **mobile** muestra
la pantalla de detalle de una tienda (ficha + catálogo de productos) consumiendo
la API. Complementa a [`MOBILE-GUIA-INICIO.md`](./MOBILE-GUIA-INICIO.md), que dejó
esta pantalla como armazón pendiente del endpoint público de catálogo.

Todo el módulo vive en:
- Backend: [`apps/api/src/routes/stores.routes.ts`](../apps/api/src/routes/stores.routes.ts) · [`controllers/store.controller.ts`](../apps/api/src/controllers/store.controller.ts) · [`repositories/store.repository.ts`](../apps/api/src/repositories/store.repository.ts)
- Frontend (mobile): [`apps/mobile/src/app/(public)/store/[id].tsx`](../apps/mobile/src/app/(public)/store/[id].tsx) · [`features/stores/`](../apps/mobile/src/features/stores/)

---

## 0. Qué problema resuelve

La pantalla `store/[id].tsx` era un placeholder: recibía solo `id` por la URL, no
hacía ningún fetch y no mostraba información. Dos bloqueos había que levantar:

1. **`GET /stores/:id` crudo** (CRUD genérico) devuelve la fila de `stores` **sin**
   los campos computados (`category_name`, `commune_name`, `region_name`,
   `avg_rating`, `review_count`) que sí trae `/stores/search`.
2. **No existía catálogo público**: `GET /api/products` exige `requireAuth` y está
   acotado a la tienda del dueño ([products.routes.ts](../apps/api/src/routes/products.routes.ts)).

Se resolvió con **dos endpoints públicos nuevos** siguiendo el patrón por capas
del proyecto (route → controller → repository), idéntico al de `/stores/:id/stats`.

---

## 1. Backend: los dos endpoints nuevos

### 1.1 `GET /api/stores/:id` — ficha enriquecida

Reutiliza el mismo `SELECT` + JOINs + cálculo de estado (semáforo) que el listado,
acotado por `WHERE s.id = ${id}` y sin paginación. Devuelve `null` → el controlador
responde `404`.

```ts
// apps/api/src/repositories/store.repository.ts
export async function findStoreByIdWithRating(id: bigint): Promise<StoreWithRating | null> {
  const rawStores = await prisma.$queryRaw<StoreRawRow[]>`
    SELECT s.id, s.name, ..., cat.name AS category_name,
           COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating,
           COUNT(rv.id)::INT AS review_count
    FROM stores s
    LEFT JOIN regions r ... LEFT JOIN reviews rv ON rv.store_id = s.id
    WHERE s.id = ${id}
    GROUP BY s.id, r.name, c.name, c.city, cat.name`;
  const store = rawStores[0];
  if (!store) return null;
  // ...enriquecer con el estado visual (semáforo) del día actual
}
```

```ts
// apps/api/src/controllers/store.controller.ts
export const getStoreDetail = async (req, res) => {
  const id = parseBigIntId(String(req.params.id));
  if (id === null) { res.status(400).json({ error: 'ID inválido' }); return; }
  const store = await findStoreByIdWithRating(id);
  if (!store) { res.status(404).json({ error: 'Tienda no encontrada' }); return; }
  res.json(store);
};
```

### 1.2 `GET /api/stores/:id/products` — catálogo público

Solo lectura, destacados primero, sin exponer `deleted_at`/`updated_at`:

```ts
// apps/api/src/repositories/store.repository.ts
export async function findPublicStoreProducts(storeId: bigint) {
  return prisma.products.findMany({
    where: { store_id: storeId, deleted_at: null },
    orderBy: [{ featured: 'desc' }, { id: 'asc' }],
    select: { id: true, name: true, description: true, price: true, stock: true, image_url: true, featured: true },
  });
}
```

### 1.3 Orden de rutas (importante)

Las rutas específicas y el getById enriquecido se montan **antes** del CRUD
genérico, para que `GET /:id` no caiga en el getById crudo:

```ts
// apps/api/src/routes/stores.routes.ts
storesRouter.get('/:id/stats', getStoreStats);
storesRouter.get('/:id/products', getStoreProducts);
storesRouter.get('/:id', getStoreDetail);      // ← antes del CRUD genérico
storesRouter.use('/', crudRouter(crud));       // ← CRUD genérico al final
```

> Los `BigInt` (id, store_id) y `Decimal` (price) se serializan a **string**
> automáticamente por el parche global de [`app.ts`](../apps/api/src/app.ts).

---

## 2. Mobile: cómo se consume

Respeta la regla de capas del mobile (`app/` → `features/hooks` → `features/api`
→ `shared/api/client`). Una pantalla nunca hace red directo.

### 2.1 Capa HTTP (`features/stores/api.ts`)

```ts
export async function getStoreById(id: string): Promise<Store> {
  const { data } = await api.get<Store>(`/stores/${id}`);
  return data;
}
export async function getStoreProducts(id: string): Promise<Product[]> {
  const { data } = await api.get<Product[]>(`/stores/${id}/products`);
  return data;
}
```

### 2.2 Hook (`features/stores/useStoreDetail.ts`)

Espejo de `useStores` (useState/useEffect, sin react-query). Carga ficha + catálogo
**en paralelo** (`Promise.all`) y acepta un `initialStore` para hidratar al instante:

```ts
export function useStoreDetail(id: string, initialStore?: Store | null) {
  const [store, setStore] = useState<Store | null>(initialStore ?? null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialStore);
  // load(): Promise.all([getStoreById(id), getStoreProducts(id)])
  return { store, products, loading, error, reload };
}
```

### 2.3 La pantalla (`app/(public)/store/[id].tsx`)

- Lee `id` y un `store` serializado (opcional) de los params.
- Header con botón volver + `StoreHeader` (logo, nombre, `BadgeCheck` si verified,
  categoría vía `getCategoryStyle`, rating, ubicación, descripción, botón "Cómo
  llegar"). El layout está **portado de** [`StoreDetailSheet`](../apps/mobile/src/components/StoreDetailSheet.tsx).
- Catálogo: `FlatList` de [`ProductCard`](../apps/mobile/src/components/ProductCard.tsx)
  (`ListHeaderComponent` = ficha), con estados skeleton / vacío / error coherentes
  con la Home.

### 2.4 Navegación con hidratación instantánea

Home y el mapa ya tienen el objeto `Store`, así que lo pasan por params para pintar
la ficha sin parpadeo (el detalle igual refetchea, por lo que un deep-link sin
params también funciona):

```tsx
// apps/mobile/src/app/(public)/index.tsx  y  components/StoreDetailSheet.tsx
router.push({ pathname: '/(public)/store/[id]', params: { id: item.id, store: JSON.stringify(item) } });
```

---

## Flujo completo

```
StoreCard / StoreDetailSheet  ── router.push({ id, store: JSON.stringify(store) }) ─▶
  store/[id].tsx
    └─ useStoreDetail(id, initialStore)         ← hidrata ficha al instante desde params
         └─ Promise.all([getStoreById, getStoreProducts])   (features/stores/api.ts)
              └─ axios GET /api/stores/:id  +  /api/stores/:id/products
                   └─ getStoreDetail / getStoreProducts (controller)
                        └─ findStoreByIdWithRating / findPublicStoreProducts (repository)
                             └─ prisma ($queryRaw enriquecido / findMany)  ── PostgreSQL
    └─ StoreHeader (ficha) + FlatList<ProductCard> (catálogo)
```

---

## Resumen de las piezas involucradas

| Capa | Ficha de tienda | Catálogo de productos |
|---|---|---|
| Pantalla (mobile) | `StoreHeader` en `store/[id].tsx` | `FlatList` + `ProductCard` |
| Hook | `useStoreDetail` (ficha + catálogo en paralelo) | idem |
| API client (mobile) | `getStoreById` | `getStoreProducts` |
| Ruta (backend) | `GET /api/stores/:id` | `GET /api/stores/:id/products` |
| Controller | `getStoreDetail` | `getStoreProducts` |
| Repository | `findStoreByIdWithRating` | `findPublicStoreProducts` |
| Persistencia | `prisma.$queryRaw` (enriquecido) | `prisma.products.findMany` |
| Auth | pública (sin login) | pública (sin login) |

Ambos endpoints son públicos y de solo lectura, coherentes con el principio
"cliente primero, anónimo" de la app mobile.

---

## 3. Contacto por WhatsApp

La ficha ofrece contacto directo con la tienda por WhatsApp, debajo de "Cómo llegar".

- **Backend:** la tabla `stores` ya tiene `store_phone` (`VarChar(20)`). Se añadió
  al `SELECT` de ambas queries de [store.repository.ts](../apps/api/src/repositories/store.repository.ts)
  (`findStoresWithRating` y `findStoreByIdWithRating`) y a `StoreWithRating`
  ([store.types.ts](../apps/api/src/types/store.types.ts)), por lo que viaja en
  `/stores/:id` y en `/stores/search`.
- **Mobile:** [`shared/lib/whatsapp.ts`](../apps/mobile/src/shared/lib/whatsapp.ts)
  normaliza el teléfono al formato de `wa.me` (solo dígitos, código país, sin `+`;
  antepone `56` a móviles chilenos de 9 dígitos) y arma la URL. En `StoreHeader`
  el botón "Contactar por WhatsApp" abre el chat con un saludo precargado. Si el
  teléfono no es válido, `buildWhatsAppUrl` devuelve `null` y el botón no se muestra.

```ts
const waUrl = buildWhatsAppUrl(store.store_phone, `Hola ${store.name}, te contacto desde Caserita 👋`);
// waUrl → https://wa.me/56911111111?text=...   (o null)
```

---

## 4. Carrito ficticio → pedido por WhatsApp

Sobre el catálogo, el cliente arma un **carrito ficticio** (no hay pasarela de pago)
y lo envía como pedido por WhatsApp.

- **Estado** ([`features/cart/`](../apps/mobile/src/features/cart/)): `cart.store.ts`
  es un store zustand (patrón de `session.store.ts`) que guarda el carrito de **una
  tienda a la vez** (`storeId/storeName/storePhone` + `items`). `addItem` reemplaza
  el carrito si se agrega desde otra tienda; `setQty`/`increment`/`decrement`/`clear`
  gestionan cantidades (qty ≤ 0 elimina). `cartCount`/`cartTotal` son selectores puros.
- **`message.ts`**: `buildOrderMessage(storeName, items)` arma el texto del pedido
  (líneas `• {qty}× {nombre} — {CLP}` + total), reutilizando `formatCLP`.
- **UI:** [`ProductCard`](../apps/mobile/src/components/ProductCard.tsx) muestra
  "Agregar" o un [`QuantityStepper`](../apps/mobile/src/ui/QuantityStepper.tsx) según
  la cantidad; al cambiar de tienda pide confirmación con `Alert`. En
  [`store/[id].tsx`](../apps/mobile/src/app/(public)/store/[id].tsx) una **OrderBar**
  fija abajo (auto-oculta si el carrito está vacío) abre el
  [`CartSheet`](../apps/mobile/src/components/CartSheet.tsx) (bottom-sheet) para
  editar cantidades y enviar. La TabBar se oculta en esta ruta
  ([(public)/_layout.tsx](../apps/mobile/src/app/(public)/_layout.tsx)) para no
  competir con la OrderBar.
- **Envío:** `buildWhatsAppUrl(store.store_phone, buildOrderMessage(...))` +
  `Linking.openURL`. El carrito no se vacía al enviar (queda editable); "Vaciar" lo limpia.

```
ProductCard "Agregar" ─▶ useCart.addItem(store, product)
  OrderBar (N · $total) ─▶ CartSheet (editar qty) ─▶ "Pedir por WhatsApp"
       └─ buildWhatsAppUrl(storePhone, buildOrderMessage(storeName, items)) ─▶ wa.me
```

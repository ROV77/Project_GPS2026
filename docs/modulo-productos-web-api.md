# Módulo Productos: cómo se conectan `web` y `api`

Este documento explica, con código real del repo, los tres flujos del catálogo de productos:
1. cómo el panel web obtiene y muestra los productos desde la API,
2. cómo se crean (suben) productos nuevos,
3. cómo se eliminan.

Todo el módulo vive en:
- Backend: [`apps/api/src/routes/products.routes.ts`](../apps/api/src/routes/products.routes.ts)
- Frontend: [`apps/web/src/features/products/`](../apps/web/src/features/products/)
- Validación compartida: [`packages/validations/src/product.schema.ts`](../packages/validations/src/product.schema.ts)

---

## 1. Cómo se conecta el web con la API para mostrar productos

### 1.1 El endpoint

`GET /api/products` está protegido (`requireAuth`) y **siempre acotado a la tienda del usuario logueado** — no existe un listado global de productos de todas las tiendas. La ruta hace dos cosas antes de listar:

```ts
// apps/api/src/routes/products.routes.ts
productsRouter.use(requireAuth, withStore);
productsRouter.get('/', list);
```

- `requireAuth` valida el JWT del header `Authorization: Bearer <token>` y deja `res.locals.userId`.
- `withStore` busca la tienda cuyo `owner_id` sea ese usuario y deja `res.locals.storeId`. Si el usuario no tiene tienda, `storeId` queda `null`.
- `list` arma el `where` con `store_id: storeId` + `deleted_at: null`, soporta filtros (`search`, `featured`, `lowStock`) y orden (`sort`), y responde paginado:
  ```json
  { "data": [...], "page": 1, "limit": 20, "total": 42 }
  ```
  Si la tienda aún no existe, responde `{ data: [], page, limit, total: 0 }` en vez de error.

### 1.2 El lado web

**Capa HTTP pura** — `productsApi.list` arma la query string y pega al endpoint:
```ts
// apps/web/src/features/products/api/productsApi.ts
list: ({ page, limit, search, featured, lowStock, sort }: ProductListParams) =>
  api.get<Paginated<Product>>('/products', { params: { page, limit, ...} })
     .then((r) => r.data),
```
`api` es la instancia única de axios (`shared/api/client.ts`) con `baseURL: '/api'`. Su interceptor de request agrega el JWT desde `authStore` (Zustand) a cada llamada; su interceptor de response detecta un 401 y desloguea automáticamente.

**Capa de datos del servidor** — `useProducts` envuelve `productsApi.list` en una query de TanStack Query:
```ts
// apps/web/src/features/products/hooks/useProducts.ts
export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData, // evita parpadeo al cambiar de página/filtro
  });
}
```

**La página** — `ProductsListPage` arma los `params` (página, búsqueda con debounce de 300 ms, filtros `featured`/`lowStock`, orden) y los pasa a `useProducts`; el resultado alimenta la `Table` y la `Pagination`, que muestran `data.data` y usan `data.total` (nunca `data.length`) para calcular las páginas.

### Flujo completo

```
ProductsListPage
  └─ useProducts({ page, limit, search, featured, lowStock, sort })
       └─ TanStack Query (cachea por [‘products’, params])
            └─ productsApi.list(params)
                 └─ axios.get('/api/products?...')   ← Vite hace proxy a :3000 en dev
                      └─ requireAuth → withStore → list()
                           └─ prisma.products.findMany({ where: { store_id, deleted_at: null, ... } })
                                └─ { data, page, limit, total }
       └─ Table + Pagination renderizan data.data / data.total
```

---

## 2. Cómo se suben (crean) productos nuevos

### 2.1 Validación compartida

El schema de creación vive en `@caserita/validations` y lo usan **tanto el backend como el formulario web** — así el front nunca envía algo que el backend vaya a rechazar:

```ts
// packages/validations/src/product.schema.ts
export const createProductSchema = z.object({
  store_id: z.coerce.number().int().positive(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative().default(0),
  stock: z.coerce.number().int().nonnegative().default(0),
  image_url: z.string().url().optional(),
  featured: z.coerce.boolean().optional(),
});
```

### 2.2 El formulario (web)

`ProductFormDrawer` usa `react-hook-form` + `zodResolver(createProductSchema)`. Al abrir en modo "alta", precarga `store_id` con la tienda del usuario (no hay selector de tienda — modelo de una tienda por cuenta):

```ts
// apps/web/src/features/products/components/ProductFormDrawer.tsx
reset({ ...emptyDefaults, store_id: storeId ? Number(storeId) : undefined });
```

Al enviar, llama a la mutación de creación:
```ts
const onSubmit = (values: CreateProductInput) => {
  ...
  if (product) update.mutate(...);
  else create.mutate(values, handlers); // alta
};
```

`useCreateProduct` (en `hooks/useProducts.ts`) es una `useMutation` de TanStack Query que, al tener éxito, **invalida la query `['products']`** para que la tabla se refresque sola desde el servidor:
```ts
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
```
Y `productsApi.create` hace el POST:
```ts
create: (data: CreateProductInput) =>
  api.post<Product>('/products', data).then((r) => r.data),
```

### 2.3 El endpoint (backend)

`POST /api/products` **no expone `store_id` al cliente** — lo fuerza desde la tienda del usuario autenticado para evitar que alguien cree un producto en otra tienda:

```ts
// apps/api/src/routes/products.routes.ts
async function create(req, res, next) {
  const storeId = res.locals.storeId;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  req.body = { ...req.body, store_id: storeId.toString() };
  await crud.create(req, res); // delega en makeCrud
}
```

`crud.create` (genérico, de `lib/crud.ts`) hace `createProductSchema.parse(req.body)` y luego `prisma.products.create(...)`, devolviendo `201` con el producto creado.

### 2.4 Manejo de errores en el formulario

- **400** (Zod rechazó algo) → la API responde `{ error, issues: { campo: [...] } }`; `applyApiValidationErrors` mapea esos issues a cada campo del formulario con `setError`, así el usuario ve el error junto al input.
- **409** (conflicto, p. ej. restricción de la DB) → se muestra como toast con `getApiErrorMessage(error)`.
- **201** (éxito) → toast "Producto creado", se cierra el Drawer, y la tabla se refresca por la invalidación de query.

### Flujo completo

```
ProductFormDrawer ("Nuevo producto")
  └─ react-hook-form + zodResolver(createProductSchema)   ← valida igual que el backend
       └─ useCreateProduct().mutate(values)
            └─ productsApi.create(values)
                 └─ axios.post('/api/products')
                      └─ requireAuth → withStore → create()
                           ├─ fuerza store_id = res.locals.storeId
                           └─ crud.create()
                                ├─ createProductSchema.parse(body)  ← Zod valida de nuevo en servidor
                                └─ prisma.products.create({ data })
                                     ├─ 201 → toast "creado" + invalidateQueries(['products']) → tabla se refresca
                                     ├─ 400 → setError por campo (issues)
                                     └─ 409 → toast de error
```

---

## 3. Cómo se eliminan productos

### 3.1 El botón de la tabla

Cada fila tiene un botón de eliminar envuelto en confirmación (`ConfirmDelete` → `ConfirmPopover`), para evitar borrados accidentales:

```tsx
// apps/web/src/features/products/pages/ProductsListPage.tsx
<ConfirmDelete
  title="¿Eliminar este producto?"
  onConfirm={() => handleDelete(p.id)}
  loading={del.isPending}
/>
```

Al confirmar, se dispara la mutación de borrado:
```ts
const del = useDeleteProduct();

const handleDelete = (id: string) => {
  del.mutate(id, {
    onSuccess: () => toast.success('Producto eliminado'),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
};
```

`useDeleteProduct` (mismo patrón que crear/editar) invalida `['products']` al tener éxito, así la fila desaparece de la tabla sin recargar la página:
```ts
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
```
Y `productsApi.remove` hace el DELETE:
```ts
remove: (id: Id) => api.delete(`/products/${id}`).then(() => id),
```

### 3.2 El endpoint (backend)

```ts
// apps/api/src/routes/products.routes.ts
productsRouter.delete('/:id', ownProduct, crud.remove);
```

Antes de borrar, el middleware `ownProduct` verifica que el `:id` pertenezca a la tienda del usuario logueado (si no, responde `404` aunque el producto exista, para no filtrar IDs de otras tiendas):
```ts
async function ownProduct(req, res, next) {
  const found = await prisma.products.findFirst({
    where: { id, store_id: storeId, deleted_at: null },
    select: { id: true },
  });
  if (!found) { res.status(404).json({ error: 'No encontrado' }); return; }
  next();
}
```

Luego `crud.remove` (genérico) **no borra la fila físicamente**: como `products` se creó con `softDelete: true`, marca `deleted_at` y responde `204`:
```ts
// apps/api/src/lib/crud.ts
async remove(req, res) {
  ...
  if (opts.softDelete) {
    await delegate.update({ where: { id }, data: { deleted_at: new Date() } });
  } else {
    await delegate.delete({ where: { id } });
  }
  res.status(204).send();
}
```

Esto es clave para entender por qué la fila "desaparece" en el front: no es que el front la oculte localmente, es que `GET /api/products` **ya no la devuelve** (su `where` siempre filtra `deleted_at: null`), así que al refrescar la query tras el `204` la fila simplemente no vuelve a aparecer.

### Flujo completo

```
Tabla de productos → botón eliminar (con ConfirmPopover)
  └─ confirmar
       └─ useDeleteProduct().mutate(id)
            └─ productsApi.remove(id)
                 └─ axios.delete(`/api/products/${id}`)
                      └─ requireAuth → withStore → ownProduct
                           ├─ verifica que el producto sea de la tienda del usuario (si no, 404)
                           └─ crud.remove()
                                └─ prisma.products.update({ data: { deleted_at: now } })  ← soft delete
                                     ├─ 204 → toast "eliminado" + invalidateQueries(['products'])
                                     └─ la fila desaparece porque el GET ya no la trae (deleted_at != null)
```

---

## Resumen de las piezas involucradas

| Capa | Listar | Crear | Eliminar |
|---|---|---|---|
| UI (web) | `ProductsListPage` + `Table`/`Pagination` | `ProductFormDrawer` (modo alta) | botón `ConfirmDelete` en cada fila |
| Hook (TanStack Query) | `useProducts` (`useQuery`) | `useCreateProduct` (`useMutation`) | `useDeleteProduct` (`useMutation`) |
| API client (web) | `productsApi.list` | `productsApi.create` | `productsApi.remove` |
| Ruta (backend) | `GET /api/products` | `POST /api/products` | `DELETE /api/products/:id` |
| Middlewares (backend) | `requireAuth`, `withStore` | `requireAuth`, `withStore` | `requireAuth`, `withStore`, `ownProduct` |
| Validación | — (solo filtros de query) | `createProductSchema` (Zod, compartido) | — |
| Persistencia | `prisma.products.findMany` | `prisma.products.create` | `prisma.products.update` (soft delete vía `deleted_at`) |

Todas las mutaciones (crear/editar/eliminar) siguen el mismo patrón: ejecutar la acción → invalidar la query `['products']` → dejar que TanStack Query vuelva a pedir la lista al servidor. No hay actualización manual del estado local de la tabla en ningún caso.

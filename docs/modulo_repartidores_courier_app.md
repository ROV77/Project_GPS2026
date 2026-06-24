# Módulo de Repartidores: Vista Exclusiva del Repartidor (Delivery Dashboard)

## Contexto
Este documento explica la interfaz web dedicada exclusivamente para los usuarios que se registran con el rol `delivery` (repartidores). A diferencia de los dueños de tiendas (que usan el `AdminLayout`), los repartidores interactúan con un panel aislado que les permite buscar trabajo.

## Arquitectura del Feature
Ubicación: `apps/web/src/features/delivery/pages/DeliveryDashboardPage.tsx`

El dashboard funciona como una "Shell Autocontenida".
1. **Gatekeeper (Seguridad):** El componente verifica inmediatamente si el usuario activo tiene el rol `delivery`. Si es un vendedor intentando espiar la vista, es redirigido de vuelta a `/dashboard`.
2. **Consumo de APIs Compartidas:**
   - Para mantener el código DRY (Don't Repeat Yourself), esta vista reutiliza las funciones ubicadas en `apps/web/src/features/couriers/api/couriersApi.ts`.
   - Utiliza el hook `useVacancies()` para obtener todas las ofertas disponibles en la base de datos sin filtrar por tienda (trae toda la bolsa de trabajo global).
3. **Flujo de Postulación (Apply Flow):**
   - Se incorporó el hook `useCreateApplication()`, el cual ejecuta una mutación `POST /api/delivery-applications`.
   - Cuando un repartidor hace clic en "Postular" en una tarjeta de vacante, se envía su `courier_id` y el `vacancy_id` correspondiente a la base de datos, con estado inicial `pending`.
   - Una vez enviada, el dueño de la tienda que publicó esa vacante podrá verla en su panel web (pestaña de Postulaciones) y decidir si Acepta o Rechaza al repartidor.

## Limitaciones Actuales y Trabajo Futuro
- **Detalle de la Tienda:** Actualmente, la API de lectura de vacantes devuelve el `store_id`, pero no el nombre de la tienda (ej. "Panadería La Esquina"). En la próxima iteración del backend, se debe agregar `include: { store: true }` a las consultas de Prisma en `deliveryVacancies.service.ts` para poder mostrar nombres amigables en el Dashboard del repartidor.

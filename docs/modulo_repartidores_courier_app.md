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
3. **Flujo de Postulación y Filtro:**
   - Se usa el hook `useApplications({ courier_id })` para traer el historial de vacantes a las que el usuario ya aplicó.
   - Las vacantes a las que ya se postuló se remueven inteligentemente de la lista de "Oportunidades de Reparto".
   - Se implementó la vista de **"Mis Postulaciones"**, donde el repartidor puede ver el estado actual (Pendiente, Aceptada, Rechazada) de cada solicitud.
4. **Perfil y Calificaciones:**
   - Se utiliza `useCourierRatings({ courier_id })` para extraer todas las valoraciones dadas por las tiendas al repartidor.
   - Se calcula el promedio matemático en el frontend para mostrar una métrica clara en estrellas (ej. 4.5/5).

## Limitaciones Actuales y Trabajo Futuro
- **Detalle de la Tienda:** Actualmente, la API de lectura de vacantes devuelve el `store_id`, pero no el nombre de la tienda (ej. "Panadería La Esquina"). En la próxima iteración del backend, se debe agregar `include: { stores: true }` a las consultas de Prisma en `deliveryVacancies.service.ts` para poder mostrar nombres amigables en el Dashboard del repartidor.

# Módulo de Repartidores en Frontend (apps/web)

## Contexto
El módulo de Repartidores permite a los dueños de tiendas gestionar su relación con los repartidores colaborativos directamente desde el panel web administrativo. Este *feature* consume los endpoints creados en el **Módulo 4 de Logística** del backend.

## Arquitectura del Feature
Ubicación: `apps/web/src/features/couriers/`

El módulo se construyó respetando la arquitectura de capas estándar del proyecto:

1. **Tipos (`types.ts`)**: Adaptación de los tipos exportados desde `@caserita/shared-types` utilizando los tipos base de la API del front (`Id`).
2. **API Pura (`api/couriersApi.ts`)**: Cliente HTTP (Axios) agnóstico de React para interactuar con las rutas:
   - `GET / POST / PUT / DELETE /api/delivery-vacancies`
   - `GET / PUT /api/delivery-applications`
   - `GET / POST /api/courier-ratings`
3. **Hooks de Estado (`hooks/useCouriers.ts`)**: Envoltorios de **TanStack Query** (`useQuery`, `useMutation`). Se encargan del caché y de invalidar queries tras una escritura para refrescar las tablas automáticamente.
4. **Componentes Visuales (`components/`)**:
   - `VacancyFormDrawer.tsx`: Formulario en panel lateral (Drawer) para publicar y editar vacantes, usando `react-hook-form`.
   - `VacanciesTab.tsx`: Tabla con el listado de vacantes (Bolsa de trabajo) publicadas por la tienda logueada.
   - `ApplicationsTab.tsx`: Tabla que muestra los repartidores que han postulado a las vacantes, con acciones rápidas para "Aceptar" o "Rechazar".
   - `RatingsTab.tsx`: Tabla con el historial de calificaciones de los repartidores de la tienda.
5. **Página Orquestadora (`pages/CouriersPage.tsx`)**: Reúne los componentes anteriores utilizando un sistema de Pestañas (Tabs) en estado local (`useState`), permitiendo ver toda la información sin sobrecargar el menú principal.

## Validaciones Compartidas
Se importan los *schemas* de Zod desde el paquete centralizado `@caserita/validations` (específicamente `delivery.schema.ts`). Estos se inyectan en `react-hook-form` usando `zodResolver`, asegurando que el frontend rechace errores de formato exactamente con las mismas reglas que el backend.

## Usuario de Prueba (Repartidor)
Para probar el panel del repartidor y sus funciones, se ha creado el siguiente usuario de prueba:
- **Email:** `delivery@caserita.cl`
- **Contraseña:** `demo123`

## Secuencia de Pruebas (Flujo Completo)

Para probar la integración completa entre una tienda y un repartidor, sigue estos pasos:

1. **Creación de Vacante (Tienda):**
   - Inicia sesión con un usuario que sea dueño de tienda (por ejemplo, `dueño1@caserita.cl` o el que estés usando).
   - Dirígete al panel de administración de la tienda, sección Repartidores (`/dashboard/couriers`).
   - En la pestaña "Bolsa de trabajo", haz clic en "Publicar Vacante", completa los datos (título, descripción, etc.) y guárdala.
   
2. **Postulación (Repartidor):**
   - Cierra sesión y vuelve a entrar, esta vez con las credenciales del repartidor (`delivery@caserita.cl`).
   - El sistema te redirigirá automáticamente al Panel de Repartidor (`/delivery-dashboard`).
   - En la columna de "Oportunidades de Reparto", verás la vacante recién creada. Haz clic en el botón **"Postular"**.
   - Notarás que la vacante desaparece de la lista de oportunidades y aparece en tu recuadro de "Mis Postulaciones" con el estado **Pendiente**.

3. **Resolución de la Solicitud (Tienda):**
   - Cierra sesión y vuelve a iniciar sesión como el dueño de la tienda.
   - Navega nuevamente a `/dashboard/couriers` y abre la pestaña **"Postulaciones"**.
   - Verás al usuario repartidor solicitando el puesto. 
   - Utiliza los botones de acción para **Aceptar** o **Rechazar** al candidato.
   - Si el repartidor vuelve a entrar a su panel, verá que el estado de su postulación cambió de "Pendiente" a "Aceptada" o "Rechazada".

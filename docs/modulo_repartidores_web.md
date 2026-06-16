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

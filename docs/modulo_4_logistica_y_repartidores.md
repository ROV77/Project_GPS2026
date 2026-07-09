# Módulo 4: Ecosistema de Logística y Repartidores Colaborativos

Este módulo maneja toda la lógica del backend para la gestión de vacantes de repartidores, postulaciones y el sistema de calificaciones.

## Arquitectura

Se ha implementado utilizando la **Arquitectura de 3 Capas** estándar del proyecto:

1. **Rutas (`apps/api/src/routes/delivery/`)**: Definen los endpoints HTTP y validan los datos entrantes usando los esquemas de Zod importados de `packages/validations`.
2. **Controladores (`apps/api/src/controllers/delivery/`)**: Extraen la información de la petición (`res.locals.body` o `req.params`) y llaman a la capa de servicios.
3. **Servicios (`apps/api/src/services/delivery/`)**: Contienen la lógica de negocio y se comunican con los repositorios.
4. **Repositorios (`apps/api/src/repositories/delivery/`)**: Archivos exclusivos para interactuar con la base de datos a través de Prisma.

Además, los tipos de TypeScript y las validaciones de Zod se crearon en los paquetes compartidos (`packages/shared-types` y `packages/validations`) para que puedan ser reutilizados por el Frontend en el futuro.

## Endpoints Creados

### Bolsa de Trabajo (Vacantes)
- `GET /api/delivery-vacancies`: Lista todas las vacantes publicadas por los locales.
- `GET /api/delivery-vacancies/:id`: Obtiene el detalle de una vacante específica.
- `POST /api/delivery-vacancies`: Crea una nueva vacante.
- `PUT /api/delivery-vacancies/:id`: Actualiza la información o estado de una vacante.
- `DELETE /api/delivery-vacancies/:id`: Elimina una vacante.

### Postulaciones
- `GET /api/delivery-applications`: Lista las postulaciones de los repartidores.
- `GET /api/delivery-applications/:id`: Obtiene el detalle de una postulación.
- `POST /api/delivery-applications`: Crea una nueva postulación a una vacante.
- `PUT /api/delivery-applications/:id`: Actualiza el estado de una postulación (ej. Aceptada/Rechazada).
- `DELETE /api/delivery-applications/:id`: Elimina o cancela una postulación.

### Sistema de Calificaciones
- `GET /api/courier-ratings`: Lista todas las calificaciones de los repartidores.
- `GET /api/courier-ratings/:id`: Obtiene el detalle de una calificación específica.
- `POST /api/courier-ratings`: Registra una nueva calificación (1 a 5 estrellas) para un repartidor.
- `PUT /api/courier-ratings/:id`: Modifica una calificación existente.
- `DELETE /api/courier-ratings/:id`: Elimina una calificación.

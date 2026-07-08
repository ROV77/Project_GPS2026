# Registro de Cambios y Correcciones (07-Jul-2026)

Este documento detalla los cambios masivos a nivel de diseño de interfaz (UI), interacciones y correcciones críticas en el backend (API) y base de datos realizados en esta sesión de trabajo.

## 🎨 1. Mejoras de UI e Interacciones (Frontend Web)

### 1.1 Rediseño de la Landing Page
- **Barra de Búsqueda Eliminada:** Se quitó la barra de búsqueda compleja de la página de inicio. En su lugar, se implementó un único botón grande y llamativo ("Buscar comercios") que redirige a la vista de Explorar, dando una estética más minimalista y limpia.
- **Tarjetas de Beneficios:** La sección "Por qué registrar tu negocio" se rediseñó por completo.
  - Pasaron de ser rectángulos pequeños a cuadrados grandes en una grilla de 4 columnas.
  - El icono representativo de cada beneficio ahora se muestra como una "marca de agua" grande y desvanecida en el fondo de la tarjeta.
  - Se agregaron efectos de elevación (`hover`) que resaltan la tarjeta al pasar el cursor.

### 1.2 Rediseño de la Página de Explorar (Explore Page)
- **Banner Promocional Sticky:** Se reemplazó la cabecera estándar por un *banner* expansivo de ancho completo (`w-full` ocupando del extremo izquierdo al derecho).
  - El banner se mantiene fijo en la parte superior al hacer scroll de la página (*sticky*).
  - Cuenta con un efecto de sombra sutil para diferenciarse del fondo al bajar.
- **Sello de Verificado Animado:** Se modificó la insignia de verificación en las tarjetas de las tiendas. Ahora incluye una sutil animación dorada/brillante para destacar las tiendas que cuentan con planes Pro/Premium.
- **Estrellas y Reseñas:** Se ajustó la distribución del espacio en las tarjetas de tiendas para evitar cortes y asegurar que la calificación (estrellas) sea siempre visible en la parte inferior.

### 1.3 Interacción en Tarjetas de Planes (Suscripciones)
- **Estado de Selección Persistente:** En lugar de lanzar una simple animación temporal al cliquear un plan, las tarjetas (`PlanCard.tsx`) ahora guardan un estado de selección. Al hacer clic, la tarjeta seleccionada queda levantada y agrandada permanentemente respecto al resto.
- **Sistema de Partículas (Confetti Ambient):** Las tarjetas seleccionadas emiten continuamente pequeñas partículas brillantes desde sus bordes (usando `canvas-confetti`). 
  - Las partículas flotan hacia arriba lentamente y se desvanecen.
  - El color de las partículas es dinámico y depende del plan seleccionado (tonos dorados para Premium, azules para Pro, plateados para Gratis).

---

## 🛠 2. Correcciones Críticas (API y Base de Datos)

### 2.1 Prisma Client & Database Sync
Se detectó un fallo crítico en la API que devolvía código `500` (Error Interno del Servidor) al intentar consultar los detalles de una tienda y sus productos. 

1. **Problema de Migración (Schema Drift):** 
   - El archivo `schema.prisma` definía nuevas relaciones (como `product_id` en `promotions`), pero la base de datos física no estaba sincronizada.
   - El intento de sincronización estaba bloqueado porque existían registros en la tabla `promotions` que impedían agregar columnas obligatorias sin valor por defecto.
   - **Solución:** Se vació la tabla `promotions` localmente (`TRUNCATE`) y se ejecutó `prisma db push` para alinear la base de datos de PostgreSQL con el código de Prisma.

2. **Crasheo de Consultas nulas (`valid_from`):**
   - El repositorio de tiendas (`store.repository.ts`) estaba ejecutando una consulta que pasaba `{ valid_from: null }` directamente. Esto causaba un `PrismaClientValidationError` que tumbaba el servidor Node.js por completo.
   - **Solución:** Se actualizó la sintaxis para cumplir con las validaciones estrictas de Prisma 6.x usando `{ equals: null }`.

### 2.2 Arreglo de Conexión en Mobile
- El cliente móvil (`apps/mobile`) arrojaba `[AxiosError: Network Error]` al intentar conectarse a la API porque la IP configurada en su archivo `.env` estaba desactualizada (la IP de la computadora había cambiado dinámicamente en la red WiFi).
- **Solución:** Se actualizó la IP en `EXPO_PUBLIC_API_URL` para que apunte correctamente a la nueva dirección de la computadora anfitriona.

---

## ⚠️ 3. Acciones Requeridas por el Resto del Equipo

Si estás bajando estos cambios (`git pull`) en tu entorno local, **ES OBLIGATORIO** que realices los siguientes pasos para que tu entorno de desarrollo no se rompa:

1. **Actualiza tu cliente de Prisma:** Debido a los cambios en el esquema, tu código Node.js no reconocerá campos como `promotions` a menos que regeneres los binarios tipados de Prisma.
   - Detén la API si la tienes corriendo.
   - Ve a la carpeta de la API (`cd apps/api`).
   - Ejecuta: `npx prisma generate`

2. **Sincroniza tu Base de Datos Local:** Tu base de datos local necesita los nuevos campos. 
   - En `apps/api`, ejecuta: `npx prisma db push`
   - *Nota: Si te arroja error porque ya tienes datos en `promotions`, tendrás que limpiar esa tabla primero.*

3. **Verifica tus `.env`:** 
   - Revisa tu archivo `.env` en `apps/mobile/` y asegúrate de que `EXPO_PUBLIC_API_URL` tenga la IP real de tu máquina (revísalo con `ipconfig` en Windows o `ifconfig` en Mac/Linux). Cada vez que tu router te cambie la IP, tendrás que actualizar ese archivo y reiniciar Expo.

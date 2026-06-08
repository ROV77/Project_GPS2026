# ProyetoGPS2026
Proyecto de desarrollo correspondiende a la asignatura de Gestión de Proyecto de Software.

## ¿Cómo organizamos el repo?
Se armó una estructura tipo monorepo, para que cada uno pueda avanzar de manera independiente en el mismo proyecto:

* **`/apps`**: Aquí va lo que cada uno está programando: `api` para el backend, `web` para el panel administrativo y `mobile` para la aplicación que usarán los clientes.
* **`/packages`**: Acá guardamos lo que compartimos entre todos, como las configuraciones globales, tipos de datos o validaciones. Esto nos ayuda a que el código sea consistente en todo el proyecto.
* **`/docs`**: Aquí subiremos todo lo relacionado con la documentación, actas y el material que nos pida el profe.
* **`/scripts`**: Cosas técnicas que nos sirvan para automatizar tareas repetitivas.

## ¿Cómo empezamos a trabajar?
1.  Clonen el repo en su computadora.
2.  Ejecuten un `npm install` en la carpeta principal para instalar todo lo necesario.
3.  **Muy importante**: Cada uno trabaje en su carpeta asignada dentro de `/apps` o `/packages` según el módulo que le tocó. Tratemos de no mover carpetas de lugar para no romper la estructura que configuramos.

## Configurar el backend (`apps/api`)

### Requisitos previos
- PostgreSQL instalado y corriendo en tu máquina.

### Pasos en orden

1. **Crear la base de datos**:
   ```bash
   createdb caseritApp
   ```

2. **Cargar el esquema SQL** (crea todas las tablas):
   ```bash
   psql -d caseritApp -f docs/caseritapp_schema.sql
   ```

3. **Configurar las variables de entorno**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Editen el `.env` y reemplacen `TU_PASSWORD` con su contraseña de PostgreSQL.

4. **Generar el cliente de Prisma**:
   ```bash
   cd apps/api
   npx prisma generate
   ```

## El tema del CI (Integración Continua)
Fabián dejó andando el pipeline de integración continua, así que el sistema va a revisar automáticamente lo que subamos. Antes de hacer un `push` a la rama `main`, asegúrense de que su código esté bien para que no nos salten errores en el pipeline.

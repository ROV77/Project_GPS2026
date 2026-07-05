# Resumen — Módulo de ubicación (Mi Tienda)

**Proyecto:** CaseritaApp · **Rama:** carlos-Develop  
**Fecha:** junio 2026

---

## Qué hicimos

Trabajamos en el **módulo de ubicación de la tienda** (pantalla "Mi Tienda"):

1. **Mejoramos cómo se elige la dirección**
   - La búsqueda manual de calle es la opción principal.
   - Se agregó un campo para el **número** de la dirección.
   - El GPS quedó como opción secundaria ("Usar mi ubicación actual").

2. **Unificamos región, comuna y mapa**
   - La idea es que no aparezcan datos distintos (antes podías tener Concepción arriba y Mulchén en el mapa).
   - Al elegir **región y comuna**, el mapa **se centra en esa comuna**.
   - La búsqueda de calle queda **limitada a la zona elegida**.
   - Si mueves el pin y la comuna existe en el catálogo, **se actualizan solos** región y comuna.

3. **Ampliamos la base de datos de comunas**
   - Antes solo había **6 comunas de prueba** (semilla).
   - Ahora hay el **catálogo completo de Chile** (346 comunas), incluyendo Cabrero, Mulchén, etc.

4. **Subimos los cambios** a la rama `carlos-Develop` para revisión en GitHub.

---

## Problemas que existían

1. **Datos inconsistentes** — Se podía guardar una comuna en el formulario y otra distinta en el mapa (ej.: Concepción vs Mulchén).

2. **Catálogo incompleto** — Muchas comunas reales no estaban en la base de datos, así que el sistema no las reconocía aunque el mapa sí las mostrara.

3. **La calle "se quedaba pegada"** — Al cambiar comuna o ubicación, el nombre de la calle no se actualizaba bien.

4. **El número de dirección** — No había campo para el número; direcciones como "Lago Riñihue 155" no se podían completar bien. Al usar GPS después de buscar otra dirección, el número anterior no se borraba.

5. **Problemas al subir a GitHub (CI)** — El pipeline fallaba al instalar dependencias porque el archivo de lockfile no coincidía con la configuración del proyecto (versiones distintas de Node y pnpm en local vs GitHub).

---

## Cómo quedó la lógica

**El usuario elige región y comuna → el mapa va a esa comuna → busca la calle y ajusta el pin → todo queda alineado antes de guardar.**

---

## Pendiente / próximos pasos

- Probar en distintos casos (sin GPS, distintas comunas, etc.).
- Confirmar que el CI en GitHub pase con el lockfile regenerado (Node 22 + pnpm 11).
- Documentar para el equipo las versiones recomendadas al trabajar con dependencias.

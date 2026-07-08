# Registro de Cambios - Aplicación Móvil (Expo)
**Fecha:** Julio 2026

Este documento detalla las implementaciones, mejoras y correcciones realizadas recientemente en el frontend móvil (`apps/mobile`).

## 1. Implementación de Skeleton Loading (Estilo shadcn)
Se reemplazaron los clásicos indicadores de carga giratorios (`ActivityIndicator`) por un sistema moderno de carga mediante *Skeletons*.

- **Componente Base (`Skeleton.tsx`)**: Se creó un componente reutilizable animado con `react-native-reanimated` (versión 3+). Utiliza animaciones cíclicas de opacidad (`withRepeat`, `withSequence`, `withTiming`) para generar un efecto de pulso suave. Se implementó una correcta limpieza de memoria (`cancelAnimation`) al desmontar el componente.
- **Integración Global**: El componente de Skeleton se integró para mejorar la experiencia de usuario (UX) en condiciones de red lenta en las siguientes pantallas principales:
  - `index.tsx`: Pantalla principal de exploración.
  - `vacancies.tsx`: Listado de ofertas/vacantes para repartidores.
  - `applications.tsx`: Estado de las postulaciones del repartidor.
  - `courier-reviews.tsx`: Reseñas recibidas.
  - `account.tsx`: Pantalla de perfil de usuario.

## 2. Correcciones Visuales (UI/UX)
- **Soporte de Modo Oscuro en Mapas (`StoreDetailSheet.tsx`)**: Se corrigió un problema visual donde el panel inferior (Bottom Sheet) que muestra los detalles de una tienda en el mapa no heredaba el color oscuro dinámico, mostrándose siempre en color blanco nativo. Se forzaron las variables semánticas del sistema de diseño (color de fondo `card` y color de indicador `border`) para que el panel se mimetice perfectamente con el tema activo de la aplicación.
- **Estabilidad de la Interfaz (`ThemeTransitionOverlay.tsx`)**: Se resolvió un error fatal de React (*"Rendered more hooks than during the previous render"*) que ocurría al intentar cambiar de modo oscuro a claro. Se reorganizó el orden de ejecución de los *hooks* de animación para que se declaren siempre a nivel de raíz, cumpliendo las reglas de React.

## 3. Experimentos de Funcionalidad
- **Transición de Tema (Radial)**: Se intentó implementar una transición radial desde la esquina superior derecha al cambiar entre modo claro y oscuro. Se revirtió debido a la degradación de rendimiento y "lag" en los dispositivos móviles. Actualmente se mantiene la transición nativa/instantánea.
- **Notificaciones Push**: Se diseñó e implementó (temporalmente) la infraestructura backend y frontend para notificaciones Push con Expo (SDK 53+). Sin embargo, fue descartada y revertida para la etapa de desarrollo actual dado que la aplicación de demostración "Expo Go" eliminó el soporte para notificaciones remotas en Android a partir de la versión 53 (requiriendo una compilación nativa en la nube o *Development Build*).

## Resumen Técnico de Dependencias
- Se pulió la integración con TypeScript, garantizando tipado estricto en el uso de los estilos nativos como `DimensionValue` en lugar de strings sueltos.
- No se añadieron dependencias externas permanentes en esta revisión (las pruebas de `expo-notifications` y `expo-device` fueron desinstaladas para evitar incompatibilidades en la rama actual).

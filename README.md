# Gestor de Notas Universitarias (React + Firebase)

Este proyecto es una aplicación de gestión de notas para universidades, desarrollada con React y Firebase.

## Estructura del proyecto

- **src/components/**: Componentes reutilizables (botones, switch de tema, etc.)
- **src/pages/**: Vistas principales (paneles, login, perfil, etc.)
- **src/hooks/**: Hooks personalizados para lógica de negocio y Firestore
- **src/services/**: Configuración y servicios de Firebase
- **src/styles/**: Archivos CSS globales
- **src/utils/**: Utilidades y helpers

## Scripts útiles

- `npm install` — Instala las dependencias
- `npm run dev` — Inicia el servidor de desarrollo
- `npm run build` — Genera la versión de producción
- `npm run lint` — Ejecuta ESLint para revisar el código
- `npm run format` — Formatea el código con Prettier

## Buenas prácticas

- Usa componentes reutilizables desde `src/components`.
- Centraliza la lógica de datos en hooks personalizados.
- Mantén el código formateado y sin errores de lint.
- Usa el switch de tema para modo claro/oscuro.

## Estructura recomendada para nuevos archivos

- Componentes reutilizables: `src/components/NombreComponente.jsx`
- Hooks personalizados: `src/hooks/useNombre.js`
- Páginas: `src/pages/NombrePagina.jsx`

---

¡Listo para escalar y mantener fácilmente!

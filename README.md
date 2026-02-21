# Frontend - Sistema de Monitoreo Meteorológico

Frontend moderno desarrollado con React, Vite y Tailwind CSS para el sistema de gestión de estaciones meteorológicas.

## Tecnologías Utilizadas

- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Build tool ultra rápido
- **Tailwind CSS** - Framework de CSS utility-first
- **React Router DOM** - Enrutamiento
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos modernos

## Características

✨ **Diseño Moderno y Responsivo**
- Interfaz limpia y profesional
- Diseño adaptable a todos los dispositivos
- Animaciones y transiciones suaves
- Gradientes y sombras modernas

🎨 **Componentes Incluidos**
- **Home** - Página de inicio con tarjetas de características
- **Users** - Gestión completa de usuarios (CRUD)
- **Stations** - Administración de estaciones meteorológicas
- **Sensors** - Control de sensores
- **Climate Data** - Visualización de datos climáticos

🔧 **Funcionalidades**
- CRUD completo para todas las entidades
- Modales elegantes para crear/editar
- Validación de formularios
- Indicadores de carga
- Confirmaciones de eliminación
- Navegación intuitiva

## Instalación

```bash
cd frontend
npm install
```

## Ejecución

### Modo Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para Producción
```bash
npm run build
```

### Preview del Build
```bash
npm run preview
```

## Configuración del Backend

El frontend está configurado para conectarse al backend en `http://localhost:8080`.

Si necesitas cambiar la URL del backend, edita el archivo:
```javascript
// src/services/api.js
const API_BASE_URL = 'http://localhost:8080';
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Layout principal con navbar y footer
│   │   └── Navbar.jsx          # Barra de navegación
│   ├── pages/
│   │   ├── Home.jsx            # Página de inicio
│   │   ├── Users.jsx           # Gestión de usuarios
│   │   ├── Stations.jsx        # Gestión de estaciones
│   │   ├── Sensors.jsx         # Gestión de sensores
│   │   └── ClimateData.jsx     # Datos climáticos
│   ├── services/
│   │   └── api.js              # Configuración de Axios y APIs
│   ├── App.jsx                 # Componente principal con rutas
│   ├── main.jsx                # Punto de entrada
│   └── index.css               # Estilos globales con Tailwind
├── public/                     # Archivos estáticos
├── index.html                  # HTML principal
├── vite.config.js              # Configuración de Vite
├── tailwind.config.js          # Configuración de Tailwind
└── package.json                # Dependencias

```

## Rutas Disponibles

- `/` - Página de inicio
- `/users` - Gestión de usuarios
- `/stations` - Gestión de estaciones
- `/sensors` - Gestión de sensores
- `/climate-data` - Datos climáticos

## Personalización de Estilos

Los estilos están definidos en `src/index.css` usando las utilidades de Tailwind.

Clases personalizadas disponibles:
- `.btn-primary` - Botón primario
- `.btn-secondary` - Botón secundario
- `.btn-danger` - Botón de peligro
- `.card` - Tarjeta con sombra
- `.input-field` - Campo de entrada
- `.label` - Etiqueta de formulario

## Paleta de Colores

El tema principal usa la paleta de azul de Tailwind:
- Primary: `#3b82f6` (blue-500)
- Primary Dark: `#1e40af` (blue-800)

Puedes personalizar los colores en `tailwind.config.js`.

## Notas Importantes

1. Asegúrate de que el backend esté corriendo en `http://localhost:8080`
2. El backend debe tener CORS habilitado para peticiones desde `http://localhost:5173`
3. Todas las peticiones usan JSON como formato de datos

## Capturas de Pantalla

El diseño incluye:
- 🎨 Navegación con iconos y gradientes
- 📱 Diseño responsivo mobile-first
- ✨ Animaciones suaves en hover
- 🎯 Modales modernos para formularios
- 💳 Tarjetas con sombras y bordes redondeados
- 🌈 Gradientes sutiles en fondos

## Soporte

Para cualquier problema o sugerencia, contacta al equipo de desarrollo.

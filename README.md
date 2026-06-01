# Sistema Antifraude - Frontend

Interfaz web SPA para el sistema de prevención de fraude. Construida con React.js, TypeScript y TailwindCSS.

## Características

- Autenticación JWT con persistencia de sesión
- Dashboard con KPIs y gráficos en tiempo real
- Gestión de alertas con filtros y paginación
- CRUD de reglas de negocio
- Consulta KYC en tiempo real
- Exportación de reportes ROS (CSV)
- Gestión de usuarios (solo ADMINISTRADOR)
- WebSocket para actualizaciones en vivo
- Diseño responsive y minimalista

## Stack Tecnológico

- **React 18+** con Vite
- **TypeScript** para tipado estático
- **TailwindCSS** para estilos
- **Zustand** para estado global
- **React Hook Form + Zod** para formularios
- **Recharts** para gráficos
- **Socket.IO** para WebSocket
- **Axios** para peticiones HTTP

## Instalación

```bash
npm install
```

## Variables de Entorno

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Sistema Antifraude
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Vista previa build
npm run preview
```

## Documentación

- [Guía de Ejecución](./GUIA_EJECUCION.md)
- [Guía de Pruebas](./GUIA_PRUEBAS.md)
- [Guía Frontend](./guia_frontend_sistema_antifraude_frontend.md)

## Credenciales de Prueba

| Rol            | Email                    | Contraseña |
|----------------|--------------------------|------------|
| Administrador  | admin@antifraude.com     | password   |
| Analista       | analista@antifraude.com  | password   |

## Estructura del Proyecto

```
src/
├── api/            # Servicios API
├── components/     # Componentes reutilizables
├── hooks/          # Custom hooks
├── layouts/        # Layouts de páginas
├── pages/          # Páginas principales
├── routes/         # Configuración de rutas
├── store/          # Estado global (Zustand)
├── types/          # Tipos TypeScript
├── utils/          # Utilidades
└── websocket/      # Conexión WebSocket
```

## Licencia

Proyecto privado - Sistema Antifraude

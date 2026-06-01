# Guía de Ejecución - Frontend Sistema Antifraude

## Requisitos Previos

- Node.js LTS (v18+)
- npm
- Backend ejecutándose en `http://localhost:8080`

## Instalación

```bash
# Clonar repositorio
git clone <repo_frontend>
cd sistema_antifraude_frontend

# Instalar dependencias
npm install
```

## Variables de Entorno

El archivo `.env` debe contener:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Sistema Antifraude
```

## Ejecución en Desarrollo

```bash
npm run dev
```

El servidor de desarrollo estará disponible en: `http://localhost:5173`

## Build de Producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`.

## Verificación de Build

```bash
npm run preview
```

Esto ejecutará una vista previa del build de producción.

## Estructura del Proyecto

```
src/
├── api/            # Servicios API (Axios)
├── assets/         # Recursos estáticos
├── components/     # Componentes reutilizables
│   ├── auth/       # Componentes de autenticación
│   ├── alerts/     # Componentes de alertas
│   ├── dashboard/  # Componentes del dashboard
│   ├── kyc/        # Componentes KYC
│   ├── rules/      # Componentes de reglas
│   └── common/     # Componentes comunes (Button, Loading)
├── hooks/          # Custom hooks (useAuth, useApi)
├── layouts/        # Layouts (PublicLayout, AuthenticatedLayout)
├── pages/          # Páginas principales
│   ├── Login/
│   ├── Dashboard/
│   ├── Alerts/
│   ├── Rules/
│   ├── KYC/
│   ├── Reports/
│   └── Users/
├── routes/         # Configuración de rutas
├── services/       # Servicios de negocio
├── store/          # Estado global (Zustand)
├── styles/         # Estilos globales
├── types/          # Tipos TypeScript
├── utils/          # Utilidades (fechas, formatos, validación)
└── websocket/      # Conexión WebSocket
```

## Credenciales de Prueba

### Administrador
- Email: `admin@antifraude.com`
- Contraseña: `password`

### Analista
- Email: `analista@antifraude.com`
- Contraseña: `password`

## Módulos Implementados

1. **Login**: Autenticación JWT con persistencia de sesión
2. **Dashboard**: KPIs y gráficos en tiempo real
3. **Alertas**: Gestión completa con filtros y paginación
4. **Reglas**: CRUD de reglas de negocio (solo ADMINISTRADOR)
5. **KYC**: Consulta de identidad en tiempo real
6. **Reportes**: Exportación CSV de reportes ROS
7. **Usuarios**: Gestión de usuarios (solo ADMINISTRADOR)

## Roles y Permisos

| Módulo         | ADMINISTRADOR | ANALISTA |
|----------------|---------------|----------|
| Dashboard      | ✅            | ✅       |
| Alertas        | ✅            | ✅       |
| Reglas         | ✅            | ❌       |
| KYC            | ✅            | ✅       |
| Reportes       | ✅            | ✅       |
| Usuarios       | ✅            | ❌       |

## Solución de Problemas

### Error de CORS
Asegúrese de que el backend esté ejecutándose y configurado para aceptar solicitudes desde `http://localhost:5173`.

### Error de Autenticación
Verifique que las credenciales sean correctas y que el backend esté funcionando.

### Error de WebSocket
El WebSocket se conecta automáticamente. Si hay problemas, verifique que el backend soporte WebSocket en la URL configurada.

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build de producción
npm run build

# Verificar lint
npm run lint

# Vista previa del build
npm run preview
```

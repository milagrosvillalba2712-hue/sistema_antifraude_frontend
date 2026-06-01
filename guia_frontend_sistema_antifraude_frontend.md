# Guía Frontend - Sistema Antifraude

## Objetivo del Documento

Este documento tiene como propósito servir como guía técnica y funcional para el desarrollador frontend encargado de implementar el repositorio:

```text
C:\Users\nicol\Projects\
│
├── sistema_antifraude_backend/      # API REST + Motor Drools
├── sistema_antifraude_frontend/     # Interfaz React.js
├── sistema_antifraude_mock/         # APIs externas simuladas
└── sistema_antifraude_infra/        # Docker Compose + Infraestructura
```

El objetivo principal es construir la interfaz web completa del sistema antifraude, utilizando React.js, integrándose con el backend Spring Boot y respetando los requerimientos funcionales, no funcionales y arquitectónicos definidos en el anteproyecto.

---

# 1. Objetivo General del Frontend

Diseñar e implementar una interfaz web moderna, segura, responsiva y orientada a monitoreo financiero en tiempo real para:

* Gestión de alertas antifraude
* Administración de reglas de negocio
* Visualización estadística
* Gestión KYC
* Gestión de usuarios y roles
* Visualización transaccional
* Exportación de reportes regulatorios

---

# 2. Objetivos Técnicos

* Construir una SPA (Single Page Application) con React.js
* Consumir APIs REST del backend Spring Boot
* Implementar autenticación JWT
* Implementar RBAC visual (ADMINISTRADOR / ANALISTA)
* Crear dashboards en tiempo real
* Implementar tablas dinámicas de alertas
* Crear formularios de reglas dinámicas
* Integrar visualización KYC
* Implementar exportación CSV
* Implementar WebSockets para actualizaciones en vivo
* Mantener tiempos de render menores a 3 segundos

---

# 3. Herramientas Necesarias

## Herramientas Obligatorias

En caso de no contar con ellas instaladas:

* Node.js LTS
* npm
* Git
* Visual Studio Code
* Docker Desktop (opcional para entorno completo)
* Postman (testing de APIs)

## Extensiones Recomendadas VSCode

* ES7+ React Snippets
* Prettier
* ESLint
* Tailwind CSS IntelliSense
* Error Lens

---

# 4. Tecnologías Recomendadas

## Base Principal

* React.js
* Vite
* TypeScript (RECOMENDADO)
* React Router DOM
* Axios
* Zustand o Redux Toolkit
* React Hook Form
* Zod
* TailwindCSS
* Material UI o ShadCN UI
* Recharts
* Socket.IO Client
* JWT Decode

---

# 5. Arquitectura Recomendada Frontend

## Recomendación Principal

Se recomienda utilizar:

* Arquitectura modular por dominio
* Feature-based architecture
* Separación clara entre:

  * componentes
  * layouts
  * hooks
  * pages
  * services
  * store
  * utils

---

# 6. Estructura Recomendada del Proyecto

```text
sistema_antifraude_frontend/
|
├── public/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── alerts/
│   │   ├── rules/
│   │   ├── kyc/
│   │   └── auth/
│   │
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Alerts/
│   │   ├── Rules/
│   │   ├── KYC/
│   │   ├── Users/
│   │   └── Reports/
│   │
│   ├── routes/
│   ├── services/
│   ├── store/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── websocket/
│   └── main.tsx
│
├── .env
├── package.json
└── vite.config.ts
```

---

# 7. Instalación Paso a Paso

## 7.1 Clonar Repositorio

```bash
git clone <repo_frontend>
```

---

## 7.2 Entrar al Proyecto

```bash
cd sistema_antifraude_frontend
```

---

## 7.3 Instalar Dependencias

```bash
npm install
```

---

## 7.4 Crear Variables de Entorno

Crear archivo:

```text
.env
```

Contenido sugerido:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Sistema Antifraude
```

---

## 7.5 Ejecutar Proyecto

```bash
npm run dev
```

---

## 7.6 Build Producción

```bash
npm run build
```

---

# 8. Integración Esperada con Backend

El frontend deberá consumir:

## Autenticación

```text
POST /api/auth/login
POST /api/auth/logout
```

---

## Alertas

```text
GET /api/alerts
GET /api/alerts/{id}
PUT /api/alerts/{id}
```

---

## Reglas

```text
GET /api/rules
POST /api/rules
PUT /api/rules/{id}
DELETE /api/rules/{id}
```

---

## Dashboard

```text
GET /api/dashboard
```

---

## KYC

```text
GET /api/kyc/{documento}
```

---

## Reportes

```text
GET /api/reports/ros/export
```

---

# 9. Módulos Frontend Obligatorios

## 9.1 Login

Características:

* JWT
* manejo de sesión
* persistencia segura
* manejo de expiración
* bloqueo visual por intentos fallidos

---

## 9.2 Dashboard

Debe incluir mínimo:

* Alertas activas
* Alertas por prioridad
* Transacciones procesadas
* KPIs
* Tendencias
* Estadísticas históricas

Mínimo:

* 6 visualizaciones gráficas

Utilizar:

* Recharts

---

## 9.3 Bandeja de Alertas

Debe incluir:

* Tabla dinámica
* Filtros
* Ordenamiento
* Paginación
* Prioridades
* Estado
* Asignación
* Resolución

Estados:

* PENDIENTE
* ASIGNADA
* INVESTIGANDO
* RESUELTA
* DESCARTADA

---

## 9.4 Gestor Paramétrico de Reglas

Debe permitir:

* Crear reglas
* Editar reglas
* Activar reglas
* Suspender reglas
* Validación de formularios

NO incluir:

* scripting dinámico
* ejecución de código arbitrario

---

## 9.5 Módulo KYC

Debe visualizar:

* Identidad
* Estado PEP
* Estado sancionado
* Historial de alertas
* Estadísticas transaccionales

Importante:

* Los datos NO se almacenan localmente.
* Todo debe consultarse en tiempo real.

---

## 9.6 Reportes ROS

Debe permitir:

* Exportación CSV
* Descarga manual
* Visualización previa

---

## 9.7 Gestión de Usuarios

Solo ADMINISTRADOR.

Funciones:

* Crear usuarios
* Editar usuarios
* Activar/desactivar usuarios
* Asignar roles

---

# 10. Roles y Seguridad

## Roles

### ADMINISTRADOR

Acceso completo:

* reglas
* usuarios
* dashboard
* alertas
* reportes

### ANALISTA

Acceso limitado:

* dashboard
* alertas
* KYC
* resolución de casos

---

## Seguridad Obligatoria

* JWT en todas las requests
* Protección de rutas
* Logout automático
* Manejo de expiración de token
* RBAC frontend
* Interceptores Axios
* Variables .env
* Nunca almacenar secretos hardcodeados

---

# 11. Requerimientos Funcionales Frontend

## Obligatorios

* RF-FE-01: Login funcional
* RF-FE-02: Dashboard dinámico
* RF-FE-03: Tabla de alertas
* RF-FE-04: Gestión de reglas
* RF-FE-05: Gestión de estados
* RF-FE-06: Integración KYC
* RF-FE-07: Exportación CSV
* RF-FE-08: Visualización responsive
* RF-FE-09: Protección de rutas
* RF-FE-10: Manejo de roles

---

# 12. Requerimientos No Funcionales Frontend

* RNF-FE-01: Render < 3 segundos
* RNF-FE-02: Responsive
* RNF-FE-03: Compatible con Chrome/Firefox/Edge
* RNF-FE-04: Diseño intuitivo
* RNF-FE-05: UI completamente en español
* RNF-FE-06: Navegación fluida SPA
* RNF-FE-07: Código mantenible
* RNF-FE-08: Componentes reutilizables
* RNF-FE-09: Arquitectura escalable

---

# 13. Plan de Implementación

# Fase 1 - Inicialización

* Crear repositorio
* Configurar Vite
* Configurar TypeScript
* Configurar ESLint
* Configurar Tailwind

---

# Fase 2 - Arquitectura Base

* Layouts
* Routing
* Auth Context
* Axios Interceptors
* Manejo JWT
* RBAC

---

# Fase 3 - Login y Seguridad

* Login
* Logout
* Persistencia de sesión
* Protección de rutas
* Guards

---

# Fase 4 - Dashboard

* KPIs
* Gráficos
* Métricas
* WebSockets

---

# Fase 5 - Alertas

* Tabla dinámica
* Estados
* Prioridades
* Filtros
* Paginación

---

# Fase 6 - Reglas

* CRUD reglas
* Formularios
* Validaciones

---

# Fase 7 - KYC

* Consultas en tiempo real
* Consolidación de datos
* Historial

---

# Fase 8 - Reportes

* Export CSV
* Descargas
* Validaciones

---

# Fase 9 - Testing

* Testing UI
* Integración APIs
* Validaciones
* Stress UI

---

# 14. Recomendación Arquitectónica Importante

Se recomienda:

* Mantener frontend desacoplado del backend
* Consumir exclusivamente APIs REST
* No incluir lógica de negocio financiera en frontend
* Toda decisión antifraude debe permanecer en backend/Drools

---

# 15. Recomendación UI/UX

La interfaz debe tener estética:

* financiera
* corporativa
* minimalista
* orientada a monitoreo

Evitar:

* colores excesivos
* animaciones innecesarias
* diseño tipo ecommerce

Priorizar:

* claridad
* legibilidad
* rapidez operativa
* accesibilidad

---

# 16. Exclusiones del Frontend

NO implementar:

* Aplicación móvil nativa
* Machine Learning en frontend
* Lógica antifraude compleja
* Persistencia local de datos regulatorios externos
* Comunicación directa con bases de datos

---

# 17. Integración Esperada con Infraestructura

Compatible con:

```text
sistema_antifraude_infra/
```

Utilizando:

* Docker Compose
* Variables .env
* Networking interno Docker

---

# 18. Consideraciones Finales

El frontend debe comportarse como:

* una plataforma operativa de monitoreo financiero,
* orientada a oficiales de cumplimiento,
* preparada para alto volumen visual,
* con fuerte foco en trazabilidad y usabilidad.

La arquitectura debe facilitar:

* mantenibilidad,
* escalabilidad,
* separación de responsabilidades,
* integración futura con APIs reales regulatorias.

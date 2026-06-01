# AGENTS.md — sistema_antifraude_frontend

React.js SPA for a fraud prevention system. Consumes REST APIs from Spring Boot backend.

## Stack

- **React 18+** with Vite, **TypeScript** (recommended)
- **TailwindCSS** for styling
- **ShadCN UI** or Material UI for components
- **React Router DOM** for routing
- **Axios** for HTTP, **Zustand** or Redux Toolkit for state
- **React Hook Form + Zod** for forms/validation
- **Recharts** for dashboard charts
- **Socket.IO Client** for WebSocket real-time updates

## Setup

```bash
npm install
cp .env.example .env     # or create .env manually
npm run dev              # starts on :5173 (Vite default)
```

### Environment Variables

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Sistema Antifraude
```

## Build & Test

```bash
npm run build            # production build
npm run lint             # ESLint
```

## Architecture

Feature-based structure under `src/`:

```
src/
├── api/            # Axios instance, API service functions
├── components/     # Reusable UI (common/, dashboard/, alerts/, rules/, kyc/, auth/)
├── hooks/          # Custom React hooks
├── layouts/        # Page layouts (authenticated, public)
├── pages/          # Route components (Login/, Dashboard/, Alerts/, Rules/, KYC/, Users/, Reports/)
├── routes/         # React Router config with role guards
├── services/       # Business logic, API calls
├── store/          # Zustand/Redux slices
├── styles/         # Global styles, Tailwind config
├── types/          # TypeScript interfaces/types
├── utils/          # Helpers (date, format, validation)
└── websocket/      # Socket.IO connection manager
```

## Key Conventions

- **UI language**: Spanish (all labels, messages, enums)
- **Roles**: `ADMINISTRADOR` (full access) and `ANALISTA` (dashboard, alerts, KYC, case resolution only)
- **Auth**: JWT stored securely, Axios interceptor adds `Authorization: Bearer <token>` to all requests
- **Route protection**: Redirect unauthorized users; show 403 for insufficient roles
- **No business logic in frontend**: All fraud detection rules execute in backend/Drools
- **No local data storage**: KYC and regulatory data fetched in real-time from backend

## API Integration

Backend runs on `:8080`. Key endpoints:

- `POST /api/auth/login` — returns JWT
- `GET/PUT /api/alerts`, `GET/PUT /api/alerts/{id}` — alert management
- `GET/POST/PUT/DELETE /api/rules` — rule CRUD
- `GET /api/dashboard` — aggregated KPIs
- `GET /api/kyc/{documento}` — identity/PEP/sanctions lookup
- `GET /api/reports/ros/export` — CSV download
- `GET/POST /api/admin/users` — user management (ADMINISTRADOR only)

## Modules

1. **Login**: JWT auth, session persistence, auto-logout on expiry, lockout after failed attempts
2. **Dashboard**: 6+ charts (Recharts), KPIs, trends, WebSocket live updates
3. **Alerts**: Dynamic table with filters, sorting, pagination; states: PENDIENTE → ASIGNADA → INVESTIGANDO → RESUELTA/DESCARTADA
4. **Rules**: CRUD forms for fraud rules; no dynamic scripting or arbitrary code execution
5. **KYC**: Real-time identity lookup (no local caching)
6. **Reports**: CSV export with preview
7. **Users**: ADMINISTRADOR only — create, edit, activate/deactivate, assign roles

## Constraints

- Render time < 3 seconds
- Responsive design (Chrome/Firefox/Edge)
- Financial/corporate/minimalist UI aesthetic — avoid e-commerce styling
- No native mobile app, no ML in frontend, no direct DB access

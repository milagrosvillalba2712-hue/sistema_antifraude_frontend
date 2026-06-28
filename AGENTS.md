# AGENTS.md — sistema_antifraude_frontend

React 19 SPA for a fraud prevention system. Consumes REST APIs from Spring Boot backend on `:8080`.

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server on :5173 (proxies /api and /ws to :8080)
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run preview      # serve production build locally
```

**No test runner is configured.** `GUIA_PRUEBAS.md` documents a planned Vitest setup but it's not wired up yet.

## Tech (verified from package.json)

- React 19, TypeScript 6, Vite 8
- TailwindCSS 4 (uses `@tailwindcss/vite` plugin, `@import "tailwindcss"` + `@theme` syntax in `src/index.css`)
- Zustand 5 for state (persisted to localStorage via `zustand/middleware`)
- React Hook Form 7 + Zod 4 for forms
- Recharts 3 for charts
- Socket.IO Client 4 for WebSocket
- Axios for HTTP (interceptor adds Bearer token, 401 auto-redirects to `/login`)
- `lucide-react` for icons — no ShadCN UI, no Material UI

## Environment

Copy `.env.example` or create `.env`:
```
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Sistema Antifraude
```

## Architecture

```
src/
├── api/            # Axios instance + per-domain API functions (alerts, auth, dashboard, kyc, etc.)
├── assets/         # Static assets
├── components/     # Reusable UI (alerts/, auth/, common/, dashboard/, kyc/, profile/, rules/)
├── hooks/          # useAuth, useApi
├── layouts/        # PublicLayout, AuthenticatedLayout
├── pages/          # Route pages (Alerts/, Dashboard/, KYC/, Login/, Profile/, Reports/, Rules/, Users/)
├── routes/         # ProtectedRoute.tsx (role-based guard)
├── services/       # Business logic
├── store/          # Zustand stores (authStore, alertStore, assignmentStore, profileStore)
├── types/          # All TypeScript types (src/types/index.ts — single file)
├── utils/          # Helpers
└── websocket/      # Socket.IO connection manager
```

## Key Conventions

- **UI language**: Spanish — all labels, messages, enums, route paths
- **Roles**: `ADMINISTRADOR` (full access) and `ANALISTA` (dashboard, alerts, KYC, reports, profile only)
- **Route guards**: `ProtectedRoute` component checks auth + role; unauthorized → `/unauthorized`
- **Admin-only routes**: `/rules` and `/users` require `ADMINISTRADOR`
- **Auth storage**: JWT in localStorage (`token` key), Zustand persist mirrors it
- **All types in one file**: `src/types/index.ts` — includes `Rol`, `EstadoAlerta`, `Alerta`, `ReglaRiesgo`, etc.
- **Custom TailwindCSS theme**: Design tokens in `src/index.css` `@theme` block (Material Design-inspired colors, spacing, typography)
- **No business logic in frontend** — all fraud detection runs in backend/Drools

## Vite Proxy

Dev server proxies to backend automatically (`vite.config.ts`):
- `/api` → `http://localhost:8080`
- `/ws` → `ws://localhost:8080` (WebSocket)

## UI Style

Financial/corporate/minimalist aesthetic. Custom color palette defined in TailwindCSS theme. Use existing design tokens rather than arbitrary colors.

## Backend API

Spring Boot on `:8080`. Key endpoints: auth, alerts, rules, dashboard, KYC, reports (CSV), admin/users.

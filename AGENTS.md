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

**No test runner configured.** `GUIA_PRUEBAS.md` documents a planned Vitest setup but it's not wired up yet.

## Tech (verified from package.json)

- React 19, TypeScript 6, Vite 8
- TailwindCSS 4 (`@tailwindcss/vite` plugin, `@import "tailwindcss"` + `@theme` syntax in `src/index.css`)
- Zustand 5 with `persist` middleware (token/user mirrored to localStorage under `auth-storage` key)
- React Hook Form 7 + Zod 4 (`@hookform/resolvers`)
- Axios with Bearer token interceptor (`src/api/axios.ts`); 401 → redirect to `/login`
- Socket.IO Client 4 for WebSocket (`src/websocket/`)
- `lucide-react` for icons — no ShadCN UI, no Material UI
- `clsx` + `tailwind-merge` exposed via `cn()` at `src/utils/cn.ts`
- `date-fns` with Spanish locale for date formatting (`src/utils/date.ts`)
- `jwt-decode` for JWT parsing

## TypeScript gotchas (build will fail without these)

- `verbatimModuleSyntax: true` — use `import type { X }` for type-only imports
- `erasableSyntaxOnly: true` — no `enum`, no `namespace`, no constructor parameter properties. Use `as const` objects or union types instead
- `noUnusedLocals` / `noUnusedParameters` enabled

## Environment

No `.env.example` in repo — create `.env` from scratch:
```
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_NAME=Sistema Antifraude
```

## Architecture

```
src/
├── api/            # Axios instance + per-domain API functions (barrel at index.ts)
├── assets/         # Static assets
├── components/     # common/ barrel re-exports all shared components (Avatar, Badge, Button, Modal, Skeleton, etc.)
├── hooks/          # useAuth, useApi
├── layouts/        # PublicLayout, AuthenticatedLayout
├── pages/          # 10 route pages (Alerts, Dashboard, KYC, Login, MotorHistorial, Profile, Reports, Rules, Simulador, Users)
├── routes/         # ProtectedRoute.tsx (role-based guard)
├── services/       # Empty directory
├── store/          # Zustand stores (barrel at index.ts exports only useAuthStore; import others directly)
├── types/          # All types in src/types/index.ts
├── utils/          # cn (clsx+twMerge), date (date-fns/es), format (Intl)
└── websocket/      # Socket.IO connection manager (lazy singleton)
```

All types in `src/types/index.ts` — search there first.

## Key Conventions

- **UI language**: Spanish — all labels, messages, route paths
- **Roles** (4): `ADMINISTRADOR`, `SUPERVISOR`, `ANALISTA`, `AUDITOR`
- **Route guards**: `ProtectedRoute` checks `isAuthenticated`; optional `allowedRoles` prop
  - Authenticated routes (any role): `/dashboard`, `/alerts`, `/kyc`, `/reports`, `/profile`, `/simulador`, `/motor/historial`
  - `ADMINISTRADOR | SUPERVISOR` only: `/rules`
  - `ADMINISTRADOR` only: `/users`
  - Unauthorized → `/unauthorized`; unknown routes → redirect to `/dashboard`
- **Auth storage**: JWT in localStorage (`token` key), Zustand `persist` stores under `auth-storage` key. Axios interceptor reads `localStorage.getItem('token')` on every request; 401 clears both and redirects to `/login`
- **WebSocket**: lazy singleton (`connectWebSocket()` returns existing or creates new `Socket`); reads token from localStorage on connect
- **Custom TailwindCSS theme**: Design tokens in `src/index.css` `@theme` block — use `var(--color-*)` or Tailwind utility classes (`bg-primary`, etc.)
- **Brand assets**: `regula/` directory at project root contains logos and icons (SVG/PNG/ICO)

## Vite Proxy

Dev server proxies to backend automatically (`vite.config.ts`):
- `/api` → `http://localhost:8080`
- `/ws` → `ws://localhost:8080` (WebSocket)

## Backend API

Spring Boot on `:8080`. Key endpoint groups: auth, alerts, rules, dashboard, KYC, reports (CSV), admin/users, cases, motor (rule-engine history), simulador, escenarios, assignment, profile.

# Prakriti.AI Frontend

Enterprise frontend foundation for municipal waste operations and carbon intelligence.

## Stack
- Next.js App Router (TypeScript)
- Tailwind CSS v4
- shadcn-style component system
- TanStack Query
- Zustand for auth state

## Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables
- `NEXT_PUBLIC_API_BASE_URL`:
  - Backend base URL (no trailing slash required)
  - Example: `http://localhost:8000`

## Auth Flow
- Login uses `POST /auth/login` with `application/x-www-form-urlencoded` body:
  - `username` = email
  - `password` = password
- Access token is stored in localStorage via Zustand auth store.
- A lightweight cookie (`pa_token=1`) is mirrored for route gating in `proxy.ts`.
- Current user is fetched via `GET /auth/me`.
- Unauthorized API responses trigger logout and redirect to `/login`.

## Route Protection
- `proxy.ts` protects all application routes.
- Unauthenticated requests to protected routes are redirected to `/login`.
- Authenticated requests to `/login` are redirected to `/dashboard`.

## Pages
### Connected to Backend List APIs
- `/organizations` -> `GET /organizations`
- `/cities` -> `GET /cities`
- `/wards` -> `GET /wards`
- `/zones` -> `GET /zones`
- `/users` -> `GET /users`
- `/households` -> `GET /households`
- `/bulk-generators` -> `GET /bulk-generators`
- `/workers` -> `GET /workers`
- `/vehicles` -> `GET /vehicles`
- `/routes` -> `GET /routes`
- `/pickup-tasks` -> `GET /pickup-tasks`
- `/environmental-summaries` -> `GET /environmental-summaries`
- `/carbon-ledger` -> `GET /carbon-ledger`

### Scaffold-only in this phase
- `/dashboard`
- `/reports`

## Reusable Building Blocks
- Layout shell: sidebar, top navbar, role-aware nav
- `PageHeader`
- `MetricStatCard`
- `StatusBadge`
- `FilterBar`
- `DataTableWrapper`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `FormSectionCard`
- `SimpleDataTable`

## Commands
```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Added Packages
- `@tanstack/react-query`
- `zustand`
- `axios`
- `zod`
- `@hookform/resolvers`
- `react-hook-form`
- `lucide-react`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- `tailwindcss-animate`
- `sonner`
- `@radix-ui/react-slot`
- `@radix-ui/react-label`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-dialog`
- `@radix-ui/react-separator`
- `@radix-ui/react-select`

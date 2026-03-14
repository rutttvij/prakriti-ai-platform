# Frontend Architecture

## 1. Frontend Stack

- Next.js App Router
- TypeScript
- Tailwind CSS + reusable UI primitives
- TanStack Query for server state
- Zustand for auth/session state

## 2. Route Model

- `app/(auth)` - login/auth views
- `app/(app)` - authenticated product app
- `app/(public)` - public website
- `app/(app)/platform-admin` - SaaS-readiness admin pages

## 3. Role-Based Portal Design

- Shared authenticated shell and nav
- role-dependent landing and menu visibility
- dashboard content renderer by role
- worker role uses a mobile-first shell path

## 4. UX Component Model

- shared `ui/` primitives (buttons, inputs, cards, table, badges)
- `ui-extensions/` for list/table states and page-level patterns
- domain components per feature (dashboard, reporting, maps, operations, monitoring)

## 5. Data Access Pattern

- `lib/api/client.ts` provides axios instance + auth handling
- `lib/api/services.ts` wraps backend endpoints
- query keys centralized in `types/query-keys.ts`
- pages and feature components use TanStack Query hooks

## 6. Auth Flow

- login posts credentials to backend
- token persisted in local storage and mirrored cookie signal for routing
- unauthorized responses trigger automatic logout
- `/auth/me` hydrates active user and role metadata

## 7. Worker/Mobile Experience

Worker-facing flows are optimized for quick interaction:
- task state visibility
- route and shift pages
- mobile bottom nav
- account access to profile editor and logout

## 8. Public + Platform-Admin Layers

Public layer:
- product storytelling, modules, carbon narrative, contact/demo forms

Platform-admin layer:
- tenant summaries
- health and audit visibility
- feature/subscription placeholders for SaaS readiness demos

## 9. Demo Readiness UX

- demo quick links on key role dashboards
- recommended demo flow cards
- optional demo-mode banner (env-gated)
- optional demo credentials panel on login (env-gated)

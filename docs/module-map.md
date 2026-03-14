# Module Map

## Backend Module Map

- `app/api/routes/auth.py` - login + self profile
- `app/api/routes/dashboard.py` - dashboard aggregates
- `app/api/routes/reports.py` - report pages and summaries
- `app/api/routes/audit_exports.py` + `exports.py` - audit/export outputs
- `app/api/routes/platform_admin.py` - platform-admin metrics and metadata
- `app/services/*` - domain workflows per bounded context
- `app/db/bootstrap_admin.py` - initial admin bootstrap
- `app/db/demo_seed.py` - demo data loader

## Frontend Module Map

- `app/(app)` - authenticated application routes
- `app/(public)` - website and lead-capture pages
- `app/(auth)/login` - login and demo credentials panel
- `components/layout/*` - shell, top nav, side nav, profile editor
- `components/dashboard/*` - role dashboard composition
- `components/maps/*` - operational map surfaces
- `components/monitoring/*` - alerts/exceptions/notifications UI blocks
- `components/reporting/*` and `components/audit/*` - evidence/reporting blocks

## Cross-Cutting Modules

- `frontend/lib/api/*` - API client + service wrappers
- `frontend/store/auth-store.ts` - auth state lifecycle
- `backend/app/core/*` - settings, security, auth dependencies

## Demo / Presentation Modules

- backend demo seed script + route-level safe demo account inspection endpoint
- dashboard demo quick links and recommended flow cards
- docs runbook for presenter flow

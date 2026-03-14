# Backend Architecture

## 1. Backend Stack

- FastAPI (routing + dependency injection)
- SQLAlchemy ORM (domain models)
- PostgreSQL (transactional store)
- Alembic (schema migration)
- Pydantic (schemas)
- JWT auth + passlib password hashing

## 2. Package Layout

- `app/api/routes/` - endpoint groups by domain capability
- `app/services/` - business logic and validation orchestration
- `app/models/` - SQLAlchemy entities and relationships
- `app/schemas/` - request/response DTOs
- `app/core/` - config, security, dependencies
- `app/db/` - session, bootstrap, demo seeding
- `migrations/` - Alembic env + revision history
- `scripts/` - operational scripts (role seed, demo seed)

## 3. API Domain Grouping

- Auth: login, self profile
- Admin registry: organizations/cities/wards/zones/users
- Source registry: households, bulk generators, addresses
- Operations: workers, vehicles, routes, shifts, pickup tasks/logs
- Processing lifecycle: batches, transfers, receipts, processing, landfill, recovery
- Carbon: projects, events, ledger, verifications, summaries
- Reporting + audit exports
- Platform admin (health, subscriptions, audit logs, onboarding visibility)

## 4. Service-Oriented Domain Logic

Routes are intentionally thin and delegate to service modules for:
- hierarchy validation
- status transition correctness
- relationship and uniqueness checks
- derived metrics and scoped reporting

## 5. Auth + Role Model

- Access token issued by `/auth/login`
- Identity and role scope via `/auth/me`
- role assignments persisted in `user_roles`
- route protection uses dependency-based role guards

## 6. Migration Workflow

- migration env in `backend/migrations`
- apply with `alembic upgrade head`
- generate with `alembic revision --autogenerate`

## 7. Seed Workflow

- system roles: startup-safe role seed
- optional super-admin bootstrap: `app.db.bootstrap_admin`
- demo municipal seed: `app.db.demo_seed` / `scripts/load_demo_data.py`
- demo seed blocked in production environment mode

## 8. Runtime Notes

- CORS configured for localhost frontend dev origins
- API base URL consumed by frontend via `NEXT_PUBLIC_API_BASE_URL`
- compile/sanity check: `python3 -m compileall app scripts`

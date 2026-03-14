# Backend (FastAPI)

## Overview

Backend API for Prakriti.AI municipal operations, traceability, carbon accounting, and audit workflows.

## Module Structure

- `app/api/routes/` - route handlers grouped by domain
- `app/services/` - business logic and domain validation
- `app/models/` - SQLAlchemy models
- `app/schemas/` - Pydantic request/response schemas
- `app/db/` - database session and seed/bootstrap scripts
- `migrations/` - Alembic migration environment + versions
- `scripts/` - utility scripts (`seed_roles`, `load_demo_data`)

## Environment Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Required variables are documented in `.env.example`.

## Run

```bash
uvicorn app.main:app --reload
```

## Migrations Workflow

Apply all migrations:

```bash
alembic upgrade head
```

Create a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
```

Rollback one revision:

```bash
alembic downgrade -1
```

## Auth and Bootstrap Flow

- `POST /auth/login` returns JWT token
- `GET /auth/me` returns authenticated profile
- `PATCH /auth/me` updates self profile (and optional password change)
- Optional initial admin bootstrap:

```bash
python3 -m app.db.bootstrap_admin
```

## Seed and Demo Workflow

System roles seed automatically at startup (if tables exist) and can be seeded manually:

```bash
python3 scripts/seed_roles.py
```

Presentation-ready demo seed:

```bash
python3 scripts/load_demo_data.py
```

Safety behavior:
- Demo seeding is blocked when `ENVIRONMENT=production`.

## API Notes

Representative route groups:
- Auth: `/auth/*`
- Registry/admin: `/organizations`, `/cities`, `/wards`, `/zones`, `/users`
- Operations: `/workers`, `/vehicles`, `/routes`, `/route-stops`, `/shifts`, `/pickup-tasks`, `/pickup-logs`
- Facilities/lifecycle: `/batches`, `/transfers`, `/facility-receipts`, `/processing-records`, `/landfill-records`, `/recovery-certificates`
- Carbon/reporting: `/carbon-events`, `/carbon-ledger`, `/environmental-summaries`, `/reports`
- Platform admin: `/platform-admin/*`

## Useful Checks

```bash
python3 -m compileall app scripts
```

For architecture and domain maps, see:
- `../docs/backend-architecture.md`
- `../docs/database-overview.md`

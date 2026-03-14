# Prakriti.AI Platform

Prakriti.AI is a full-stack municipal waste operations and carbon intelligence platform. It supports city-level administration, ward-level operations, field worker workflows, traceability, processing lifecycle monitoring, carbon accounting, and audit-ready exports.

## Key Capabilities

- Multi-role operational portals (admin, supervisor, worker, processor, auditor, bulk generator)
- Source registry and route/shift/task orchestration
- Worker execution support (including mobile-friendly task flows and QR verification)
- Facility transfer, receipt, processing, landfill, and recovery lifecycle tracking
- Carbon events, ledger entries, verifications, and environmental summaries
- Audit and evidence export center
- Public website and platform-admin SaaS readiness layer
- Demo-ready seeded municipal scenario with realistic linked data

## Architecture Summary

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- Auth: JWT token flow (`/auth/login`, `/auth/me`)
- Data model: organization -> city -> ward -> zone hierarchy with role-scoped operations

Detailed docs:
- [System Architecture](docs/system-architecture.md)
- [Backend Architecture](docs/backend-architecture.md)
- [Frontend Architecture](docs/frontend-architecture.md)
- [Database Overview](docs/database-overview.md)
- [Module Map](docs/module-map.md)
- [Demo Runbook](docs/demo-runbook.md)

## Tech Stack

- FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic, python-jose, passlib
- Next.js, React, TypeScript, Tailwind v4, TanStack Query, Zustand, Radix UI
- Docker (optional local stack)

## Repository Structure

- `backend/` - FastAPI application, domain models, services, API routes, migrations
- `frontend/` - Next.js application with role portals and public pages
- `docs/` - architecture, module, runbook, and system documentation
- `infrastructure/` - Dockerfiles and compose stack
- `Makefile` - convenience developer commands

## Quick Start (Local)

### 1) Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2) Database + migrations

Start postgres (either local instance or docker):

```bash
make db-up
```

Run migrations:

```bash
cd backend
alembic upgrade head
```

### 3) Seed demo data (optional but recommended)

```bash
cd backend
python3 scripts/load_demo_data.py
```

### 4) Run backend

```bash
cd backend
uvicorn app.main:app --reload
```

### 5) Frontend setup + run

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`

## Docker Run (Optional)

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

## Demo Credentials (Local/Staging Only)

Default demo password (seeded via script):

```text
Demo@1234
```

Sample users:
- `demo.superadmin@prakriti.ai`
- `demo.cityadmin@prakriti.ai`
- `demo.wardofficer@prakriti.ai`
- `demo.supervisor@prakriti.ai`
- `demo.worker@prakriti.ai`
- `demo.processor@prakriti.ai`
- `demo.auditor@prakriti.ai`
- `demo.bulkgen@prakriti.ai`

For complete walkthrough and role mapping, see [Demo Runbook](docs/demo-runbook.md).

## Suggested Demo Flow

1. Super Admin dashboard KPI view
2. City and ward operations drill-down
3. Worker task flow and QR scanning journey
4. Map operations showcase
5. Transfer-processing-recovery lifecycle
6. Carbon ledger and environmental summaries
7. Audit export center
8. Public website + platform-admin pages

## Common Commands

```bash
make help
make setup-backend
make setup-frontend
make migrate
make demo-seed
make backend
make frontend
make lint
make build
```

## Troubleshooting

- `401` on frontend requests: verify `NEXT_PUBLIC_API_BASE_URL` and login token state.
- Migration issues: ensure `DATABASE_URL` in `backend/.env` points to the same DB you are migrating.
- Demo seed blocked: `ENVIRONMENT=production` disables demo seeding by design.
- CORS issues locally: frontend should run on `http://localhost:3000` and backend on `http://localhost:8000`.

## Roadmap / Future Scope

- richer alert/exception simulation fixtures
- advanced operational forecasting and route optimization
- deeper SaaS billing lifecycle and subscription enforcement
- production deployment hardening (managed secrets, CI/CD, infra modules)

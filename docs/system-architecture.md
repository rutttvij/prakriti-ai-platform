# System Architecture

## 1. Platform Layers

Prakriti.AI is organized into four major layers:

1. Public Layer (marketing + product narrative)
2. Role-Based Operations Layer (authenticated municipal workflows)
3. Carbon + Audit Intelligence Layer (emissions, verification, exports)
4. Platform-Admin Layer (multi-tenant governance readiness)

## 2. Core Topology

- Frontend: Next.js app (role portals, public pages, worker mobile views)
- Backend: FastAPI API (domain routes, validation, workflows)
- Database: PostgreSQL (normalized operational + carbon domain model)
- Migrations: Alembic

## 3. Multi-Role Structure

Primary operational roles:
- SUPER_ADMIN
- CITY_ADMIN
- WARD_OFFICER
- SANITATION_SUPERVISOR
- WORKER
- PROCESSOR
- AUDITOR
- BULK_GENERATOR

Role context controls visibility, dashboard focus, and permitted actions.

## 4. Hierarchy Model

Administrative scope:
- Organization
  - City
    - Ward
      - Zone

Operational records (tasks, workers, routes, facilities, summaries) are linked to this hierarchy for segmentation and reporting.

## 5. Lifecycle Domains

### Source Registry
- Households
- Bulk waste generators
- Addresses and onboarding/compliance states

### Worker Operations
- Worker profiles
- Vehicle assignments
- Routes and route stops
- Shifts and pickup tasks
- Pickup logs and status transitions

### Transfer + Processing
- Collected batches
- Transfer records and facility receipts
- Processing records
- Landfill records
- Recovery certificates

### Carbon + Environment
- Carbon projects
- Carbon events (emissions/avoided emissions)
- Carbon ledger entries and verifications
- Environmental summaries (city/ward period aggregates)

### Audit + Reporting
- Report endpoints
- Export/audit packaging for compliance evidence

## 6. Presentation Readiness Features

- Demo data seeding for a realistic municipal scenario
- Demo quick links in dashboards
- Demo-mode UI hints (env-gated)
- Role-specific account-based walkthrough support

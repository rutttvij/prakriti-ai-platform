# Prakriti.AI Demo Runbook

This runbook prepares a presentation-ready local/staging demo with realistic municipal data.

## 1) Load Demo Data

From `backend/`:

```bash
python3 scripts/load_demo_data.py
```

Notes:
- The loader is idempotent where practical (re-running updates/keeps existing demo records by unique codes).
- In production environments (`ENVIRONMENT=production`), demo seeding is blocked.

## 2) Demo Accounts

Default password for all demo accounts:

```text
Demo@1234
```

Accounts:
- `demo.superadmin@prakriti.ai` (SUPER_ADMIN)
- `demo.cityadmin@prakriti.ai` (CITY_ADMIN)
- `demo.wardofficer@prakriti.ai` (WARD_OFFICER)
- `demo.supervisor@prakriti.ai` (SANITATION_SUPERVISOR)
- `demo.worker@prakriti.ai` (WORKER)
- `demo.processor@prakriti.ai` (PROCESSOR)
- `demo.auditor@prakriti.ai` (AUDITOR)
- `demo.bulkgen@prakriti.ai` (BULK_GENERATOR)

## 3) Suggested Demo Flow

1. Login as `demo.superadmin@prakriti.ai` and open `/dashboard`.
2. Use **Demo Quick Links** to jump to:
   - City dashboard
   - Worker task flow
   - Maps
   - Carbon ledger
   - Audit export center
3. Show role switch with other accounts:
   - Supervisor/worker for field operations
   - Processor for transfer/receipt/processing chain
   - Auditor for carbon + audit evidence
   - Bulk generator for compliance and pickup history
4. Close with public website pages (`/`, `/platform`, `/request-demo`).

## 4) Presentation Prep Commands

Backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```

Optional demo UI flags in `frontend/.env.local`:

```bash
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true
```

## 5) Optional Demo Inspection Endpoint

For SUPER_ADMIN in non-production env only:

- `GET /platform-admin/demo-accounts`

Returns demo account metadata and role mappings.

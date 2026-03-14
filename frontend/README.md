# Frontend (Next.js)

## Overview

Next.js App Router frontend for Prakriti.AI with role-based portals, worker-focused mobile flows, public website pages, and platform-admin views.

## Frontend Structure

- `app/` - route tree (auth, app, public, platform-admin)
- `components/` - UI primitives and domain components
- `lib/` - API client/services, auth helpers, constants, utilities
- `store/` - Zustand auth store
- `types/` - TypeScript domain/query/API types
- `proxy.ts` - route protection and auth gating

## Routing Model

- `app/(auth)` - login and auth flows
- `app/(app)` - authenticated role portals
- `app/(public)` - public marketing/product pages
- `app/(app)/worker/*` - worker mobile-first experience
- `app/(app)/platform-admin/*` - platform-admin SaaS readiness pages

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

## Run

```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` (required): backend base URL
- `NEXT_PUBLIC_DEMO_MODE` (optional): enables tasteful demo mode hints
- `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` (optional): shows demo account panel on login in demo/dev contexts

## Auth + API Behavior

- Login uses `POST /auth/login` (form-urlencoded)
- User profile uses `GET /auth/me`
- Profile updates use `PATCH /auth/me`
- Token is stored in local storage and mirrored via cookie signal for route gating
- Unauthorized API responses trigger logout/redirect

## Role-Based Portals

- SUPER_ADMIN / CITY_ADMIN / WARD_OFFICER dashboards
- SANITATION_SUPERVISOR operations cockpit
- WORKER mobile-friendly execution flows
- PROCESSOR lifecycle/throughput views
- AUDITOR compliance/carbon review views
- BULK_GENERATOR history/compliance views

## Worker/Mobile Section

Worker routes include:
- `/worker`
- `/worker/tasks`
- `/worker/shifts`
- `/worker/routes`

Designed for quick task interaction and profile/account actions on mobile.

## Public Website Section

Public routes include:
- `/`
- `/platform`
- `/modules`
- `/carbon-intelligence`
- `/about`
- `/contact`
- `/request-demo`

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

For architecture and demo flow docs, see:
- `../docs/frontend-architecture.md`
- `../docs/demo-runbook.md`

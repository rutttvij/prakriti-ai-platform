# Database Overview

This document summarizes the main entity groups in Prakriti.AI.

## 1. Organization + Hierarchy

- `organizations`
- `cities`
- `wards`
- `zones`

These define multi-tenant and geographic scope for all operational records.

## 2. Users + Access

- `users`
- `roles`
- `user_roles`

Users can carry one or more role assignments; role codes drive access and portal behavior.

## 3. Source Registry

- `addresses`
- `households`
- `bulk_waste_generators`
- `qr_code_tags`

Represents collection sources and onboarding/compliance context.

## 4. Worker Operations

- `worker_profiles`
- `vehicles`
- `routes`
- `route_stops`
- `shifts`
- `pickup_tasks`
- `pickup_logs`

These tables model assignment, execution, and field traceability.

## 5. Processing Lifecycle

- `processing_facilities`
- `collected_batches`
- `transfer_records`
- `facility_receipts`
- `processing_records`
- `landfill_records`
- `recovery_certificates`

Captures the chain from source collection to final disposal/recovery outcomes.

## 6. Carbon Accounting

- `emission_factors`
- `carbon_projects`
- `carbon_events`
- `carbon_ledger_entries`
- `carbon_verifications`
- `environmental_summaries`

Supports event-level accounting and period-level municipal environmental reporting.

## 7. Alerts / Audit / Export Context

- alerts/exceptions are surfaced through monitoring/reporting flows in current implementation
- audit/export endpoints aggregate evidence across pickup, transfer, processing, and carbon records

## 8. Migration and Schema Evolution

- migrations live in `backend/migrations/versions`
- apply latest schema via `alembic upgrade head`

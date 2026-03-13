# Prakriti.AI Backend Foundation

FastAPI backend foundation for multi-tenant municipal operations and carbon intelligence platform.

## Stack
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Alembic
- Pydantic
- JWT auth (`python-jose`)
- Password hashing (`passlib` + bcrypt)
- `.env` config (`python-dotenv`)

## Environment Variables
Create `backend/.env` using `backend/.env.example` and set:
- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ENVIRONMENT`
- `PROJECT_NAME`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`

## Run Commands
From `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create first migration:

```bash
alembic revision --autogenerate -m "initial foundation"
alembic upgrade head
```

Run server:

```bash
uvicorn app.main:app --reload
```

Bootstrap initial super admin:

```bash
python3 -m app.db.bootstrap_admin
```

## Role Seeding
System roles are seeded automatically on startup if `roles` table exists.

Manual seed command:

```bash
python3 scripts/seed_roles.py
```

## API Endpoints
- `GET /health`
- `POST /auth/login`
- `GET /auth/me`
- `POST /organizations`, `GET /organizations`
- `POST /cities`, `GET /cities`
- `POST /wards`, `GET /wards`
- `POST /zones`, `GET /zones`
- `POST /users`, `GET /users`

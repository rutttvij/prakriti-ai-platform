.PHONY: help setup-backend setup-frontend backend frontend db-up db-down migrate demo-seed lint build

help:
	@echo "Prakriti.AI developer commands"
	@echo "  make setup-backend   - create backend venv and install deps"
	@echo "  make setup-frontend  - install frontend deps"
	@echo "  make db-up           - start postgres via docker compose"
	@echo "  make db-down         - stop postgres/backend/frontend compose stack"
	@echo "  make migrate         - run alembic migrations"
	@echo "  make demo-seed       - load demo data"
	@echo "  make backend         - run FastAPI dev server"
	@echo "  make frontend        - run Next.js dev server"
	@echo "  make lint            - run frontend lint"
	@echo "  make build           - build frontend"

setup-backend:
	cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

setup-frontend:
	cd frontend && npm install

db-up:
	docker compose -f infrastructure/docker-compose.yml up -d db

db-down:
	docker compose -f infrastructure/docker-compose.yml down

migrate:
	cd backend && alembic upgrade head

demo-seed:
	cd backend && python3 scripts/load_demo_data.py

backend:
	cd backend && uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

lint:
	cd frontend && npm run lint

build:
	cd frontend && npm run build

# Makefile for Bourse ALPE development
.PHONY: help install dev up down logs shell-backend shell-frontend db-shell migrate seed seed-articles seed-sales seed-payouts seed-closure seed-all test test-backend-mariadb check-version lint clean

# Default target
help:
	@echo "Bourse ALPE - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install      Install all dependencies (backend + frontend)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start all services (docker-compose up)"
	@echo "  make dev-tools    Start with tools (phpMyAdmin, MailHog)"
	@echo "  make up           Start services in background"
	@echo "  make down         Stop all services"
	@echo "  make logs         Show logs (all services)"
	@echo "  make logs-backend Show backend logs"
	@echo "  make logs-frontend Show frontend logs"
	@echo ""
	@echo "Shell access:"
	@echo "  make shell-backend  Open shell in backend container"
	@echo "  make shell-frontend Open shell in frontend container"
	@echo "  make db-shell       Open MySQL shell"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        Run database migrations"
	@echo "  make migrate-new    Create new migration (NAME=description)"
	@echo "  make seed           Populate database with E2E test data"
	@echo "  make seed-articles  Promote articles to ON_SALE with barcodes"
	@echo "  make seed-sales     Create sample sales"
	@echo "  make seed-payouts   Create payout records"
	@echo "  make seed-closure   Mark all payouts PAID (for closure test)"
	@echo "  make seed-all       Run seed + articles + sales + payouts"
	@echo ""
	@echo "Testing:"
	@echo "  make test           Run all tests"
	@echo "  make test-backend   Run backend tests (SQLite)"
	@echo "  make test-backend-mariadb  Run backend tests against MariaDB"
	@echo "  make check-version  Check all version files agree"
	@echo "  make test-frontend  Run frontend tests"
	@echo ""
	@echo "Code quality:"
	@echo "  make lint           Run linters"
	@echo "  make format         Format code"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          Remove containers, volumes, and cache"

# ============================================
# Setup
# ============================================

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements-dev.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Done!"

# ============================================
# Development
# ============================================

dev:
	docker-compose up --build

dev-tools:
	docker-compose --profile tools up --build

up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# ============================================
# Shell access
# ============================================

shell-backend:
	docker-compose exec backend /bin/bash

shell-frontend:
	docker-compose exec frontend /bin/sh

db-shell:
	docker-compose exec db mysql -u bourse -pbourse_dev bourse_dev

# ============================================
# Database
# ============================================

migrate:
	docker-compose exec backend alembic upgrade head

migrate-new:
	docker-compose exec backend alembic revision --autogenerate -m "$(NAME)"

seed:
	docker-compose exec backend python scripts/seed.py

seed-articles:
	docker-compose exec backend python scripts/seed_articles.py

seed-sales:
	docker-compose exec backend python scripts/seed_sales.py

seed-payouts:
	docker-compose exec backend python scripts/seed_payouts.py

seed-closure:
	docker-compose exec backend python scripts/seed_closure.py

seed-all: seed seed-articles seed-sales seed-payouts

# ============================================
# Testing
# ============================================

test: test-backend test-frontend

test-backend:
	docker-compose exec backend pytest

# Same suite against MariaDB instead of the default in-memory SQLite. Production runs
# on MariaDB, and SQLite silently accepts things it rejects (column precision, quoted
# defaults). Slower, so it is a separate target rather than the default.
test-backend-mariadb:
	docker compose up -d db
	docker compose exec -T db mariadb -uroot -proot_password -e "CREATE DATABASE IF NOT EXISTS bourse_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON bourse_test.* TO 'bourse'@'%'; FLUSH PRIVILEGES;"
	docker compose run --rm -e TEST_DATABASE_URL="mysql+aiomysql://bourse:bourse_dev@db:3306/bourse_test" backend pytest

test-frontend:
	docker-compose exec frontend npm test

# Same check CI runs: every file carrying the version number must agree.
check-version:
	bash scripts/check-version-consistency.sh

# ============================================
# Code quality
# ============================================

lint:
	@echo "Linting backend..."
	cd backend && ruff check .
	@echo "Linting frontend..."
	cd frontend && npm run lint

format:
	@echo "Formatting backend..."
	cd backend && ruff format .
	@echo "Formatting frontend..."
	cd frontend && npm run format

# ============================================
# Cleanup
# ============================================

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f
	rm -rf backend/.cache
	rm -rf frontend/node_modules/.cache

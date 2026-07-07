# Makefile for Campus Connect Production Operations

# Variables
COMPOSE_CMD = docker compose -f compose.yml -f compose.prod.yml

.PHONY: help up down restart status logs logs-app pull update-app migrate db-shell redis-shell prune backup backup-offsite restore-list restore-latest verify-backup

help:
	@echo "Campus Connect Production Operations"
	@echo "------------------------------------"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  up             Start all production services in the background"
	@echo "  down           Stop and remove all production services"
	@echo "  restart        Restart all production services"
	@echo "  status         View the status of running containers"
	@echo "  logs           View logs for all services (follow)"
	@echo "  logs-app       View logs for the app service (follow)"
	@echo "  pull           Pull the latest Docker images"
	@echo "  update-app     Update app and worker services to latest, restart nginx"
	@echo "  migrate        Run database migrations"
	@echo "  db-shell       Open an interactive PostgreSQL shell"
	@echo "  redis-shell    Open an interactive Redis shell"
	@echo "  prune          Remove all unused Docker resources (images, networks, volumes)"
	@echo "  backup         Run a local backup (DB, MinIO, Redis)"
	@echo "  backup-offsite Run a backup and sync it offsite"
	@echo "  restore-list   List all available backups"
	@echo "  restore-latest Restore from the most recent backup"
	@echo "  verify-backup  Verify the integrity of the latest backup"

up:
	$(COMPOSE_CMD) up -d

down:
	$(COMPOSE_CMD) down

restart:
	$(COMPOSE_CMD) restart

status:
	$(COMPOSE_CMD) ps

logs:
	$(COMPOSE_CMD) logs -f

logs-app:
	$(COMPOSE_CMD) logs -f app-prod

pull:
	$(COMPOSE_CMD) pull

update-app:
	$(COMPOSE_CMD) pull app-prod worker-prod migrator-prod
	$(COMPOSE_CMD) up -d app-prod worker-prod
	$(COMPOSE_CMD) restart nginx-prod

migrate:
	$(COMPOSE_CMD) run --rm migrator-prod

db-shell:
	docker exec -it campus_connect_db psql -U connect -d campus_connect

redis-shell:
	docker exec -it campus_connect_redis redis-cli

prune:
	docker system prune -af --volumes

backup:
	./backup/backup.sh

backup-offsite:
	./backup/backup.sh --offsite

restore-list:
	./backup/restore.sh --list

restore-latest:
	./backup/restore.sh --latest

verify-backup:
	./backup/verify.sh --latest

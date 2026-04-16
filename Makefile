.PHONY: help help-users create-user create-admin block-user unblock-user delete-user db-generate migrate migrate-deploy docker-up docker-down docker-logs

BACKEND := backend
FRONTEND := frontend

help:
	@echo "Docker (из корня репозитория):"
	@echo "  make docker-up         — собрать и поднять БД + backend + frontend (Nginx)"
	@echo "  make docker-down       — остановить и удалить контейнеры"
	@echo "  make docker-logs       — логи всех сервисов"
	@echo ""
	@echo "Database (Prisma, from ./$(BACKEND)):"
	@echo "  make db-generate      	— generate Prisma client"
	@echo "  make migrate          	— prisma migrate dev (локальная разработка)"
	@echo "  make migrate-deploy   	— prisma migrate deploy (прод / CI)"
	@echo "  make migrate NAME=foo 	— migrate dev с именем миграции (опционально)"
	@echo ""
	@echo "Users: make help-users"

help-users:
	@echo "Users:"
	@echo "  make create-user EMAIL=user@example.com PASS=password ?ROLE=user      — create user"
	@echo "  make create-admin EMAIL=admin@example.com PASS=password               — create admin"
	@echo "  make block-user EMAIL=user@example.com ID=123                         — block user"
	@echo "  make unblock-user EMAIL=user@example.com ID=123                       — unblock user"
	@echo "  make delete-user EMAIL=user@example.com ID=123                        — delete user"
	@echo "  make up-role-user-to-admin EMAIL=user@example.com ID=123              — up role user to admin"
	@echo "  make down-role-user-to-user EMAIL=user@example.com ID=123             — down role user to user"

create-user:
	cd $(BACKEND) && EMAIL="$(EMAIL)" PASS="$(PASS)" ROLE="$(if $(ROLE),$(ROLE),user)" npx tsx scripts/create-user.ts

create-admin:
	cd $(BACKEND) && EMAIL="$(EMAIL)" PASS="$(PASS)" ROLE="admin" npx tsx scripts/create-user.ts

up-role-user-to-admin:
	cd $(BACKEND) && $(if $(EMAIL),EMAIL="$(EMAIL)",) $(if $(ID),ID="$(ID)",) npx tsx scripts/up-role-user-to-admin.ts

down-role-user-to-user:
	cd $(BACKEND) && $(if $(EMAIL),EMAIL="$(EMAIL)",) $(if $(ID),ID="$(ID)",) npx tsx scripts/down-role-user-to-user.ts

block-user:
	cd $(BACKEND) && $(if $(EMAIL),EMAIL="$(EMAIL)",) $(if $(ID),ID="$(ID)",) npx tsx scripts/block-user.ts

unblock-user:
	cd $(BACKEND) && $(if $(EMAIL),EMAIL="$(EMAIL)",) $(if $(ID),ID="$(ID)",) npx tsx scripts/unblock-user.ts

delete-user:
	cd $(BACKEND) && $(if $(EMAIL),EMAIL="$(EMAIL)",) $(if $(ID),ID="$(ID)",) npx tsx scripts/delete-user.ts

db-generate:
	cd $(BACKEND) && npx prisma generate

migrate:
	cd $(BACKEND) && npx prisma migrate dev $(if $(NAME),--name $(NAME),)

migrate-deploy:
	cd $(BACKEND) && npx prisma migrate deploy

start-backend:
	cd $(BACKEND) && npm run dev

start-frontend:
	cd $(FRONTEND) && npm run dev

stop:
	kill $(shell ps aux | grep "npm run dev" | grep -v grep | awk '{print $2}')

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f


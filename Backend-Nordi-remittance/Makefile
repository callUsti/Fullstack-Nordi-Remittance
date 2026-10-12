# ============================================================================
#  Nordi Remittance Backend — Makefile
#  Runtime: Node.js | DB: MongoDB 7.x (Mongoose) | Cache: Redis | Queue: BullMQ
#  Streaming: Kafka (KRaft) | K8s: kubectl | IaC: Terraform
# ============================================================================

.PHONY: help dev start clean install lint lint-fix typecheck validate \
        test test-run test-watch test-coverage test-ui \
        db-seed db-indexes db-status db-shell db-drop-stale-index \
        docker-up docker-down docker-rebuild docker-logs docker-ps \
        docker-up-infra docker-clean docker-shell \
        redis-cli redis-flush redis-monitor redis-info redis-keys \
        mongo-shell mongo-status mongo-dump mongo-restore \
        kafka-init kafka-start kafka-stop kafka-restart kafka-status kafka-logs \
        kafka-topics kafka-create-topics kafka-describe kafka-console kafka-clean kafka-setup \
        queue-status queue-flush \
        k8s-apply k8s-delete k8s-status k8s-logs k8s-port-forward \
        k8s-restart k8s-rollout-status k8s-describe k8s-exec \
        tf-init tf-plan tf-apply tf-destroy tf-output tf-fmt tf-validate \
        build build-no-cache docker-tag docker-push \
        health health-ready health-detailed metrics api-info \
        check-env gen-env logs-tail

# ─────────────── CONFIG ───────────────

APP_NAME   := nordi-remittance
PORT       := 3000
API_URL    := http://localhost:$(PORT)
K8S_NS     := nordi
MONGO_CONTAINER := remit-mongo
MONGO_DB        := remit

# Colors
CYAN    := \033[36m
GREEN   := \033[32m
YELLOW  := \033[33m
RED     := \033[31m
RESET   := \033[0m
BOLD    := \033[1m

# ============================================================================
#  HELP
# ============================================================================

help: ## Show all available commands
	@echo ""
	@echo "$(BOLD)$(CYAN)  Nordi Remittance Backend — Command Reference$(RESET)"
	@echo "$(CYAN)  ──────────────────────────────────────────────$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'
	@echo ""

.DEFAULT_GOAL := help

# ============================================================================
#  DEVELOPMENT
# ============================================================================

install: ## Install all dependencies with npm
	npm install

dev: kafka-start ## Start dev server with hot-reload (tsx + nodemon) + Kafka
	npm run dev

start: ## Start production server
	npm run start

start-dev: ## Start dev server without nodemon
	npm run start:dev

watch: ## Start dev server in watch mode
	npm run dev:hot

# Windows: clean uses PowerShell Remove-Item (replaces: rm -rf dist coverage node_modules/.cache)
clean: ## Remove build artifacts and caches
	@powershell -NoProfile -Command "'dist','coverage','node_modules/.cache' | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }; Write-Host '[OK] Cleaned' -ForegroundColor Green"

reinstall: clean install ## Clean install

# ============================================================================
#  CODE QUALITY
# ============================================================================

lint: ## Run ESLint on all files
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

typecheck: ## Run TypeScript type checking
	npm run typecheck

validate: ## Run typecheck + lint + tests
	npm run validate

# ============================================================================
#  TESTING
# ============================================================================

test: ## Run tests once and exit
	npm run test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage report
	npm run test:coverage

test-ui: ## Open Vitest UI
	npm run test:ui

# Windows: set env var inline via PowerShell (replaces: NODE_ENV=test npx vitest run --no-coverage)
test-quick: ## Run tests without coverage (faster)
	@powershell -NoProfile -Command "$$env:NODE_ENV='test'; npx vitest run --no-coverage"

# ============================================================================
#  DATABASE (MongoDB 7.x — Mongoose)
# ============================================================================

db-seed: ## Seed database (creates super admin + defaults)
	npm run db:seed

db-indexes: ## Create all MongoDB indexes
	npm run db:create-indexes

db-verify: ## Verify query performance and index coverage
	npm run db:verify-performance

# Windows: 2>NUL replaces 2>/dev/null; && / || work the same in cmd.exe (replaces: docker compose exec mongo mongosh ... 2>/dev/null && echo OK || echo FAIL)
db-status: ## Ping MongoDB and print connection info
	@docker compose exec $(MONGO_CONTAINER) mongosh --eval "db.adminCommand('ping')" --quiet $(MONGO_DB) 2>NUL && echo [OK] MongoDB is up || echo [FAIL] MongoDB not reachable

db-shell: ## Open a mongosh shell in the running container
	docker compose exec $(MONGO_CONTAINER) mongosh $(MONGO_DB)

mongo-shell: db-shell ## Alias for db-shell

mongo-status: db-status ## Alias for db-status

# Windows: Get-Date replaces date +%Y%m%d-%H%M%S; New-Item -p replaces mkdir -p (replaces: mkdir -p backups && docker cp ...:/tmp/dump ./backups/dump-$(date ...))
mongo-dump: ## Dump the database to ./backups/
	@powershell -NoProfile -Command "\
		New-Item -ItemType Directory -Force -Path 'backups' | Out-Null; \
		docker compose exec $(MONGO_CONTAINER) mongodump --db $(MONGO_DB) --out /tmp/dump; \
		$$ts = Get-Date -Format 'yyyyMMdd-HHmmss'; \
		$$cid = (docker compose ps -q $(MONGO_CONTAINER)); \
		docker cp $${cid}:/tmp/dump ./backups/dump-$$ts; \
		Write-Host '[OK] Dump saved to ./backups/' -ForegroundColor Green"

mongo-restore: ## Restore latest dump (usage: make mongo-restore dump=backups/dump-20260101-120000)
	docker compose exec $(MONGO_CONTAINER) mongorestore \
		--db $(MONGO_DB) --drop /tmp/restore
	@echo "$(YELLOW)⚠ Restore requires: docker cp <dump> container:/tmp/restore first$(RESET)"

db-drop-stale-index: ## Drop the stale eventId_1 index from securityevents (run once if seeing E11000 errors)
	npx tsx scripts/drop-stale-index.ts

# ============================================================================
#  DOCKER COMPOSE
# ============================================================================

docker-up: ## Start all services (app + infra + kafka) in detached mode
	docker compose up -d

# Quick start URL summary after docker-up
	@echo ""
	@echo "$(GREEN)✓ Stack running:$(RESET)"
	@echo "  API:       http://localhost:$(PORT)"
	@echo "  Kafka UI:  http://localhost:8090"
	@echo "  Mongo UI:  http://localhost:8081"

docker-up-infra: ## Start only infrastructure (mongo, redis, kafka) — no app
	docker compose up -d mongo redis kafka kafka-ui
	@echo "$(GREEN)✓ Infrastructure ready (mongo, redis, kafka + Kafka UI on :8090)$(RESET)"

docker-down: ## Stop all running services
	docker compose down

docker-rebuild: ## Rebuild and restart app container
	docker compose up -d --build app

docker-logs: ## Tail logs from all containers
	docker compose logs -f --tail=100

docker-logs-app: ## Tail logs from app container only
	docker compose logs -f --tail=100 app

docker-logs-db: ## Tail logs from MongoDB container
	docker compose logs -f --tail=50 mongo

docker-ps: ## List running containers with status
	docker compose ps

docker-shell: ## Open a shell inside the running app container
	docker compose exec api sh

docker-clean: ## Stop everything, remove volumes (destructive)
	docker compose down -v --remove-orphans
	@echo "$(YELLOW)⚠ Volumes removed — data is gone$(RESET)"

docker-restart: docker-down docker-up ## Restart all services

docker-prod: ## Start production stack (from repo root compose.prod)
	cd ../.. && docker compose -f docker-compose.prod.yml up -d --build
	@echo "$(GREEN)✓ Production stack started$(RESET)"

docker-prod-down: ## Stop production stack
	cd ../.. && docker compose -f docker-compose.prod.yml down

# ============================================================================
#  REDIS
# ============================================================================

redis-cli: ## Open Redis CLI connected to local instance
	docker compose exec redis redis-cli

redis-flush: ## Flush all Redis data (destructive)
	docker compose exec redis redis-cli FLUSHALL
	@echo "$(YELLOW)⚠ Redis flushed$(RESET)"

redis-monitor: ## Watch all Redis commands in real time
	docker compose exec redis redis-cli MONITOR

redis-info: ## Show Redis server info and memory usage
	docker compose exec redis redis-cli INFO memory | head -20

redis-keys: ## List all keys in Redis (dev only)
	docker compose exec redis redis-cli KEYS '*'

# ============================================================================
#  KAFKA (Docker-based — KRaft mode, running in container)
#  Broker: kafka:9092 (inside Docker) | localhost:9092 (from host)
#  UI: http://localhost:8090
#  For native binary usage, install Kafka locally and set KAFKA_BROKERS=localhost:9092
# ============================================================================

kafka-ui: ## Open Kafka UI in browser (http://localhost:8090)
	@echo "$(CYAN)Opening Kafka UI at http://localhost:8090$(RESET)"
	@start http://localhost:8090 2>NUL || echo "Visit http://localhost:8090"

kafka-topics-docker: ## List all topics via Docker container
	docker compose exec kafka /opt/kafka/bin/kafka-topics.sh \
		--bootstrap-server localhost:9092 --list

# ── macOS / Linux paths (commented out) ──────────────────────────────────────
# KAFKA_CONFIG     := /usr/local/kafka/config/server.properties
# KAFKA_LOG_DIR    := /tmp/kraft-combined-logs
# KAFKA_STORAGE    := kafka-storage.sh
# KAFKA_SERVER     := kafka-server-start.sh
# KAFKA_SERVER_STOP:= kafka-server-stop.sh
# KAFKA_TOPICS_CMD := kafka-topics.sh
# KAFKA_CONSOLE_CMD:= kafka-console-consumer.sh

# ── Windows paths (C:\kafka installed, bin\windows in PATH) ──────────────────
KAFKA_HOME        := C:\kafka
KAFKA_CONFIG      := $(KAFKA_HOME)\config\server.properties
# log.dirs in server.properties is set to C:/kafka/kraft-combined-logs
KAFKA_LOG_DIR     := $(KAFKA_HOME)\kraft-combined-logs
KAFKA_BROKER_LOG  := $(KAFKA_HOME)\logs
KAFKA_STORAGE     := kafka-storage.bat
KAFKA_SERVER      := kafka-server-start.bat
KAFKA_SERVER_STOP := kafka-server-stop.bat
KAFKA_TOPICS_CMD  := kafka-topics.bat
KAFKA_CONSOLE_CMD := kafka-console-consumer.bat
KAFKA_BOOTSTRAP   := localhost:9092
KAFKA_SCRIPTS_DIR := scripts

NORDI_TOPICS := nordi.transaction.initiated nordi.transaction.processed \
	nordi.transaction.completed nordi.transaction.failed \
	nordi.kyc.submitted nordi.kyc.verified nordi.kyc.rejected \
	nordi.security.fraud_alert \
	nordi.user.registered nordi.user.login nordi.user.deleted \
	nordi.notifications.push nordi.notifications.email nordi.notifications.sms \
	nordi.dlq

kafka-init: ## Format KRaft storage — clears stale data first, then formats fresh
	@echo "$(CYAN)Clearing any stale KRaft storage...$(RESET)"
	@powershell -NoProfile -Command "Remove-Item -Recurse -Force '$(KAFKA_LOG_DIR)' -ErrorAction SilentlyContinue; New-Item -ItemType Directory -Force -Path '$(KAFKA_LOG_DIR)' | Out-Null"
	@echo "$(CYAN)Generating cluster UUID and formatting KRaft storage...$(RESET)"
	$(eval CLUSTER_ID := $(shell $(KAFKA_STORAGE) random-uuid))
	$(KAFKA_STORAGE) format -t $(CLUSTER_ID) --standalone -c $(KAFKA_CONFIG)
	@echo "$(GREEN)✓ KRaft storage formatted with cluster ID: $(CLUSTER_ID)$(RESET)"

kafka-start: ## Start Kafka broker (KRaft mode, background)
	@powershell -NoProfile -ExecutionPolicy Bypass -File $(KAFKA_SCRIPTS_DIR)\kafka-start.ps1

kafka-stop: ## Stop Kafka broker
	@echo "$(CYAN)Stopping Kafka...$(RESET)"
	@$(KAFKA_SERVER_STOP) 2>NUL || echo "$(YELLOW)⚠ Kafka was not running$(RESET)"
	@echo "$(GREEN)✓ Kafka stopped$(RESET)"

kafka-restart: kafka-stop kafka-start ## Restart Kafka broker

kafka-status: ## Check if Kafka is running
	@powershell -NoProfile -ExecutionPolicy Bypass -File $(KAFKA_SCRIPTS_DIR)\kafka-status.ps1

kafka-logs: ## Tail Kafka server logs
	@powershell -NoProfile -Command "Get-Content -Wait -Tail 50 '$(KAFKA_BROKER_LOG)\server.log'"

kafka-topics: ## List all Kafka topics
	$(KAFKA_TOPICS_CMD) --bootstrap-server $(KAFKA_BOOTSTRAP) --list

# Windows: PowerShell foreach loop in kafka-create-topics.ps1 (replaces bash: for topic in $(NORDI_TOPICS); do kafka-topics.sh ... done)
kafka-create-topics: ## Create all Nordi Kafka topics
	@powershell -NoProfile -ExecutionPolicy Bypass -File $(KAFKA_SCRIPTS_DIR)\kafka-create-topics.ps1 -Bootstrap $(KAFKA_BOOTSTRAP)

kafka-describe: ## Describe a Kafka topic (usage: make kafka-describe topic=nordi.user.registered)
	$(KAFKA_TOPICS_CMD) --bootstrap-server $(KAFKA_BOOTSTRAP) --describe --topic $(topic)

kafka-console: ## Consume messages from a topic (usage: make kafka-console topic=nordi.transaction.initiated)
	$(KAFKA_CONSOLE_CMD) --bootstrap-server $(KAFKA_BOOTSTRAP) --topic $(topic) --from-beginning

kafka-clean: ## Delete KRaft storage (destructive — requires kafka-init again)
	@echo "$(YELLOW)⚠ Removing Kafka KRaft storage at $(KAFKA_LOG_DIR)$(RESET)"
	@powershell -NoProfile -Command "Remove-Item -Recurse -Force '$(KAFKA_LOG_DIR)' -ErrorAction SilentlyContinue"
	@echo "$(GREEN)✓ Kafka storage cleaned — run 'make kafka-init' before next start$(RESET)"

kafka-setup: kafka-init kafka-start kafka-create-topics ## One-liner: init + start + create topics (first time)

# ============================================================================
#  KUBERNETES
# ============================================================================

k8s-apply: ## Apply all K8s manifests to cluster
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/secrets.yaml
	kubectl apply -f k8s/deployment.yaml
	kubectl apply -f k8s/service.yaml

k8s-delete: ## Delete all K8s resources in the namespace
	kubectl delete -f k8s/ --ignore-not-found

k8s-status: ## Show pods, services, and deployments in namespace
	@echo "$(CYAN)── Pods ──$(RESET)"
	kubectl get pods -n $(K8S_NS)
	@echo "\n$(CYAN)── Services ──$(RESET)"
	kubectl get svc -n $(K8S_NS)
	@echo "\n$(CYAN)── Deployments ──$(RESET)"
	kubectl get deploy -n $(K8S_NS)

k8s-logs: ## Tail logs from the app deployment
	kubectl logs -f -n $(K8S_NS) -l app=$(APP_NAME) --tail=100

k8s-port-forward: ## Forward local port to K8s service (localhost:5000)
	kubectl port-forward -n $(K8S_NS) svc/$(APP_NAME) $(PORT):$(PORT)

k8s-restart: ## Restart the deployment (rolling)
	kubectl rollout restart deployment/$(APP_NAME) -n $(K8S_NS)

k8s-rollout-status: ## Watch rollout status
	kubectl rollout status deployment/$(APP_NAME) -n $(K8S_NS)

k8s-describe: ## Describe pods for debugging
	kubectl describe pods -n $(K8S_NS) -l app=$(APP_NAME)

k8s-exec: ## Open a shell in the running K8s pod
	kubectl exec -it -n $(K8S_NS) $$(kubectl get pod -n $(K8S_NS) -l app=$(APP_NAME) -o jsonpath='{.items[0].metadata.name}') -- sh

# ============================================================================
#  TERRAFORM
# ============================================================================

tf-init: ## Initialize Terraform working directory
	cd terraform && terraform init

tf-plan: ## Preview infrastructure changes
	cd terraform && terraform plan

tf-apply: ## Apply infrastructure changes
	cd terraform && terraform apply

tf-destroy: ## Destroy all managed infrastructure (destructive)
	cd terraform && terraform destroy

tf-output: ## Show Terraform outputs
	cd terraform && terraform output

tf-fmt: ## Format Terraform files
	cd terraform && terraform fmt -recursive

tf-validate: ## Validate Terraform configuration
	cd terraform && terraform validate

# ============================================================================
#  HEALTH & DIAGNOSTICS
# ============================================================================

health: ## Hit the health endpoint
	@curl -sf $(API_URL)/health | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d),null,2)))" 2>/dev/null || echo "$(RED)✗ Server not reachable at $(API_URL)$(RESET)"

health-ready: ## Check readiness probe
	@curl -sf $(API_URL)/health/ready | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d),null,2)))" 2>/dev/null || echo "$(RED)✗ Not ready$(RESET)"

health-detailed: ## Full health check with all service statuses
	@curl -sf $(API_URL)/health/detailed | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d),null,2)))" 2>/dev/null || echo "$(RED)✗ Not reachable$(RESET)"

metrics: ## Fetch Prometheus metrics
	@curl -sf $(API_URL)/metrics | head -40

api-info: ## Show API version and available endpoints
	@curl -sf $(API_URL)/api/v1 | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d),null,2)))" 2>/dev/null || echo "$(RED)✗ Not reachable$(RESET)"

# ============================================================================
#  ENVIRONMENT
# ============================================================================

# Windows: check-env.ps1 replaces bash: test -f .env && grep -q KEY .env && echo OK || echo FAIL
check-env: ## Validate required environment variables are set
	@powershell -NoProfile -ExecutionPolicy Bypass -File $(KAFKA_SCRIPTS_DIR)\check-env.ps1

# Windows: Test-Path + Copy-Item replaces bash: test -f .env && echo skip || cp .env.example .env
gen-env: ## Generate .env from .env.example (won't overwrite existing)
	@powershell -NoProfile -Command "if (Test-Path '.env') { Write-Host '[SKIP] .env already exists' -ForegroundColor Yellow } else { Copy-Item '.env.example' '.env'; Write-Host '[OK] .env created from .env.example' -ForegroundColor Green }"

# ============================================================================
#  BUILD & DEPLOY
# ============================================================================

build: ## Build TypeScript to dist/
	npm run build

build-check: typecheck lint test ## Full build check (typecheck + lint + test)
	@echo "$(GREEN)✓ Build check passed$(RESET)"

docker-image: ## Build production Docker image
	docker build -t $(APP_NAME)-api:latest .

docker-image-nc: ## Build Docker image without cache
	docker build --no-cache -t $(APP_NAME)-api:latest .

docker-tag: ## Tag image for registry (usage: make docker-tag registry=ghcr.io/org)
	docker tag $(APP_NAME)-api:latest $(registry)/$(APP_NAME)-api:latest

docker-push: ## Push image to registry (usage: make docker-push registry=ghcr.io/org)
	docker push $(registry)/$(APP_NAME)-api:latest

# ============================================================================
#  LOGS & MONITORING
# ============================================================================

# Windows: Get-Content -Wait replaces tail -f; Get-ChildItem replaces ls/glob (replaces: tail -f logs/*.log)
logs-tail: ## Tail application logs in dev
	@powershell -NoProfile -Command "$$logs = Get-ChildItem logs\*.log -ErrorAction SilentlyContinue; if ($$logs) { Get-Content -Wait -Tail 50 $$logs[-1].FullName } else { Write-Host '[WARN] No log files found - start the server first' -ForegroundColor Yellow }"

ports: ## Check what's running on key ports
	@powershell -NoProfile -ExecutionPolicy Bypass -File $(KAFKA_SCRIPTS_DIR)\ports.ps1 -ApiPort $(PORT)

kill-port: ## Kill process on the API port
	@powershell -NoProfile -ExecutionPolicy Bypass -File $(KAFKA_SCRIPTS_DIR)\kill-port.ps1 -Port $(PORT)

# ============================================================================
#  ML SERVICE
# ============================================================================

ml-start: ## Start the ML service (via root docker-compose)
	@echo "$(CYAN)Starting ML service...$(RESET)"
	cd ../.. && docker compose up -d ml
	@echo "$(GREEN)✓ ML service running at http://localhost:8000$(RESET)"

ml-stop: ## Stop the ML service
	cd ../.. && docker compose stop ml
	@echo "$(GREEN)✓ ML service stopped$(RESET)"

ml-logs: ## Tail ML service logs
	cd ../.. && docker compose logs -f --tail=100 ml

ml-health: ## Check ML service health endpoint
	@curl -sf http://localhost:8000/health | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d),null,2)))" 2>/dev/null \
		|| echo "$(RED)✗ ML service not reachable at :8000$(RESET)"

ml-shell: ## Open a shell inside the ML container
	cd ../.. && docker compose exec ml bash

# ============================================================================
#  BULLMQ / QUEUE
# ============================================================================

queue-status: ## List active BullMQ queue keys in Redis
	@echo "$(CYAN)BullMQ queue keys:$(RESET)"
	@docker compose exec redis redis-cli KEYS "nordi-*" 2>/dev/null | sort || echo "$(YELLOW)Redis not accessible$(RESET)"

# Windows: Read-Host replaces read -p; ForEach-Object DEL replaces xargs DEL (replaces: read -p && redis-cli --scan ... | xargs ... DEL)
queue-flush: ## Flush all BullMQ queues - DESTRUCTIVE
	@powershell -NoProfile -Command "\
		$$c = Read-Host 'WARNING: This deletes all BullMQ jobs. Continue? [y/N]'; \
		if ($$c -eq 'y') { \
			$$keys = docker compose exec redis redis-cli --scan --pattern 'nordi-*'; \
			if ($$keys) { $$keys | ForEach-Object { docker compose exec redis redis-cli DEL $$_ } }; \
			Write-Host '[OK] Queues flushed' -ForegroundColor Green \
		} else { Write-Host '[SKIP] Aborted' -ForegroundColor Yellow }"

# ============================================================================
#  COMPOUND / WORKFLOW COMMANDS
# ============================================================================

setup: install db-indexes ## First-time project setup (install + create indexes)
	@echo "$(GREEN)✓ Setup complete. Run 'make dev' to start.$(RESET)"

infra: docker-up-infra kafka-start ## Start all infrastructure (MongoDB + Redis + Kafka)
	@echo "$(GREEN)✓ Infrastructure ready (mongo, redis, kafka)$(RESET)"

fresh: docker-up-infra kafka-start db-seed db-indexes ## Fresh start: infra + Kafka + seed + indexes
	@echo "$(GREEN)✓ Fresh environment ready$(RESET)"

deploy-k8s: build docker-image k8s-apply ## Build and deploy to Kubernetes
	@echo "$(GREEN)✓ Deployed to Kubernetes$(RESET)"

ci: lint typecheck test ## CI pipeline: lint + typecheck + test
	@echo "$(GREEN)✓ CI checks passed$(RESET)"

precommit: lint-fix typecheck test-quick ## Pre-commit checks
	@echo "$(GREEN)✓ Pre-commit checks passed$(RESET)"

# Windows: Remove-Item -Recurse replaces rm -rf (replaces: rm -rf node_modules)
nuke: docker-clean clean ## Nuclear option: remove everything (containers, volumes, node_modules)
	@powershell -NoProfile -Command "Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue; Write-Host '[DONE] Everything destroyed. Run make setup to rebuild.' -ForegroundColor Red"

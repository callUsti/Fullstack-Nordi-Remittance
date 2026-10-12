# ==============================================================================
# Nordi Remittance — Monorepo Makefile (Turborepo + pnpm)
# ==============================================================================

.PHONY: help install dev dev-mobile dev-website mobile mobile-clean mobile-android \
        mobile-ios mobile-web website build build-website build-mobile \
        typecheck typecheck-mobile typecheck-website typecheck-shared lint clean

# Default target
.DEFAULT_GOAL := help

help:
	@echo "================================================================================"
	@echo " Nordi Remittance Monorepo Commands"
	@echo "================================================================================"
	@echo " Development (Turbo):"
	@echo "   make dev              - Run both Mobile and Website concurrently via Turbo"
	@echo "   make dev-mobile       - Run Mobile app via Turbo filter"
	@echo "   make dev-website      - Run Website via Turbo filter"
	@echo ""
	@echo " Development (Direct):"
	@echo "   make mobile           - Start Expo Metro bundler directly"
	@echo "   make mobile-clean     - Start Expo Metro bundler with cleared cache"
	@echo "   make mobile-android   - Start Expo and open Android emulator"
	@echo "   make mobile-ios       - Start Expo and open iOS simulator"
	@echo "   make mobile-web       - Start Expo for Web"
	@echo "   make website          - Start Vite dev server directly"
	@echo ""
	@echo " Build & Typecheck:"
	@echo "   make typecheck        - Typecheck all packages (shared, mobile, website)"
	@echo "   make typecheck-mobile - Typecheck mobile app only"
	@echo "   make typecheck-web    - Typecheck website only"
	@echo "   make typecheck-shared - Typecheck @nordi/shared package only"
	@echo "   make build            - Build all packages"
	@echo "   make build-website    - Build website production bundle (Vite)"
	@echo "   make build-mobile     - Build mobile bundles (Expo export)"
	@echo ""
	@echo " Workspace Management:"
	@echo "   make install          - Install workspace dependencies with pnpm"
	@echo "   make lint             - Run linter across all packages"
	@echo "   make clean            - Clean build outputs and Turbo cache"
	@echo "================================================================================"

# ==============================================================================
# Workspace Setup
# ==============================================================================
install:
	pnpm install

# ==============================================================================
# Development (Turborepo Orchestration)
# ==============================================================================
# Spin up both Mobile and Website concurrently
dev:
	pnpm dev

# Spin up Mobile only via Turbo
dev-mobile:
	pnpm dev:mobile

# Spin up Website only via Turbo
dev-website:
	pnpm dev:website

# ==============================================================================
# Direct App Runners
# ==============================================================================
# Mobile (Expo)
mobile:
	pnpm --filter=nordi-remitwave start

mobile-clean:
	pnpm --filter=nordi-remitwave exec expo start -c

mobile-android:
	pnpm --filter=nordi-remitwave android

mobile-ios:
	pnpm --filter=nordi-remitwave ios

mobile-web:
	pnpm --filter=nordi-remitwave web

# Website (Vite)
website:
	pnpm --filter=remitwave dev

# ==============================================================================
# Typechecking
# ==============================================================================
typecheck:
	pnpm typecheck

typecheck-mobile:
	pnpm --filter=nordi-remitwave typecheck

typecheck-website:
	pnpm --filter=remitwave typecheck

typecheck-shared:
	pnpm --filter=@nordi/shared typecheck

# ==============================================================================
# Production Builds
# ==============================================================================
build:
	pnpm build

build-website:
	pnpm --filter=remitwave build

build-mobile:
	pnpm --filter=nordi-remitwave build:android

# ==============================================================================
# Utilities
# ==============================================================================
lint:
	pnpm lint

clean:
	pnpm clean

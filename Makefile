.PHONY: help install build start dev test lint format typecheck proto clean docker-build docker-run

# Default target
help:
	@echo "Available targets:"
	@echo "  install       - Install dependencies"
	@echo "  build         - Build the project"
	@echo "  start         - Start the bot (production)"
	@echo "  dev           - Build and start in development mode"
	@echo "  test          - Run tests with coverage"
	@echo "  test:watch    - Run tests in watch mode"
	@echo "  test:ui       - Run tests with UI"
	@echo "  lint          - Run Biome linter"
	@echo "  lint:fix      - Run Biome linter and fix issues"
	@echo "  format        - Format code with Biome"
	@echo "  format:check  - Check code formatting"
	@echo "  check         - Run Biome check (lint + format)"
	@echo "  check:fix     - Run Biome check and fix issues"
	@echo "  typecheck     - Run TypeScript type checking"
	@echo "  proto         - Generate protobuf types"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"

install:
	pnpm install --frozen-lockfile

build:
	pnpm build

start:
	pnpm start

dev:
	pnpm dev

test:
	pnpm test

test:watch:
	pnpm test:watch

test:ui:
	pnpm test:ui

lint:
	pnpm lint

lint:fix:
	pnpm lint:fix

format:
	pnpm format

format:check:
	pnpm format:check

check:
	pnpm check

check:fix:
	pnpm check:fix

typecheck:
	pnpm typecheck

proto:
	pnpm proto:generate

clean:
	rm -rf dist coverage reports

docker-build:
	docker build -t nrp-time-bot:latest .

docker-run:
	docker run --rm -it --env-file .env nrp-time-bot:latest

# Development workflow
dev-setup: install proto build

ci: check typecheck test build

# Release
release:
	pnpm release
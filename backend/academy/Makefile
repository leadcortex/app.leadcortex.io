# ═══════════════════════════════════════════════════════════════════════════
# LeadCortex Academy — Makefile
# ═══════════════════════════════════════════════════════════════════════════
#
# Cibles principales :
#
#	make help          Affiche cette aide
#	make build         Compile les deux binaires (server + cli)
#	make run           Compile puis lance le serveur HTTP
#	make test          Lance les tests unitaires
#	make test-race     Lance les tests avec -race
#	make cover         Couverture de tests dans coverage.html
#	make lint          go vet + gofmt
#	make fmt           Formate tout le code
#	make tidy          go mod tidy (met à jour go.sum)
#	make validate      Valide les programmes YAML
#	make clean         Supprime les binaires et fichiers de couverture
#
# Variables surchargeables :
#
#	make build VERSION=1.2.3
#	make run   ADDR=:9090 ENV=staging
#
# ═══════════════════════════════════════════════════════════════════════════

SHELL := /bin/bash

# ─── Chemins ─────────────────────────────────────────────────────────────
BIN_DIR      := bin
SERVER_BIN   := $(BIN_DIR)/academy-server
CLI_BIN      := $(BIN_DIR)/academy-cli
CONTENT_DIR  := content
COVER_FILE   := coverage.out
COVER_HTML   := coverage.html

# ─── Paramètres surchargeables ───────────────────────────────────────────
ENV         ?= development
ADDR        ?= :8080
LOG_LEVEL   ?= info
LOG_FORMAT  ?= console
GOFLAGS     ?=

# ─── Métadonnées de build ────────────────────────────────────────────────
VERSION     ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT      ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "none")
BUILD_DATE  ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

VERSION_PKG := github.com/leadcortex/academy/internal/version
LDFLAGS     := -X '$(VERSION_PKG).Version=$(VERSION)' \
               -X '$(VERSION_PKG).Commit=$(COMMIT)' \
               -X '$(VERSION_PKG).BuildDate=$(BUILD_DATE)'

# ─── Cibles ──────────────────────────────────────────────────────────────
.DEFAULT_GOAL := help

.PHONY: help build build-server build-cli run test test-race cover lint fmt tidy validate clean

help: ## Affiche cette aide
	@echo ""
	@echo "LeadCortex Academy — cibles disponibles :"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| grep -v '^\.' \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables surchargeables :"
	@echo "  VERSION     = $(VERSION)"
	@echo "  COMMIT      = $(COMMIT)"
	@echo "  ENV         = $(ENV)"
	@echo "  ADDR        = $(ADDR)"
	@echo "  CONTENT_DIR = $(CONTENT_DIR)"
	@echo ""

# ─── Build ───────────────────────────────────────────────────────────────
build: build-server build-cli ## Compile les deux binaires

build-server: ## Compile academy-server
	@mkdir -p $(BIN_DIR)
	@echo "→ build $(SERVER_BIN) (version=$(VERSION) commit=$(COMMIT))"
	@go build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(SERVER_BIN) ./cmd/academy-server

build-cli: ## Compile academy-cli
	@mkdir -p $(BIN_DIR)
	@echo "→ build $(CLI_BIN) (version=$(VERSION) commit=$(COMMIT))"
	@go build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(CLI_BIN) ./cmd/academy-cli

# ─── Run ─────────────────────────────────────────────────────────────────
run: build-server ## Compile et lance le serveur HTTP
	@echo "→ lancement academy-server (env=$(ENV) addr=$(ADDR))"
	@$(SERVER_BIN) \
		-env $(ENV) \
		-addr $(ADDR) \
		-content $(CONTENT_DIR) \
		-log-level $(LOG_LEVEL) \
		-log-format $(LOG_FORMAT)

# ─── Tests ───────────────────────────────────────────────────────────────
test: ## Lance tous les tests
	@echo "→ go test ./..."
	@go test $(GOFLAGS) ./...

test-race: ## Lance les tests avec le détecteur de race
	@echo "→ go test -race ./..."
	@go test $(GOFLAGS) -race ./...

cover: ## Génère coverage.out et coverage.html
	@echo "→ couverture de tests"
	@go test $(GOFLAGS) -coverprofile=$(COVER_FILE) -covermode=atomic ./...
	@go tool cover -html=$(COVER_FILE) -o $(COVER_HTML)
	@go tool cover -func=$(COVER_FILE) | tail -n 1
	@echo "→ rapport HTML : $(COVER_HTML)"

# ─── Qualité ─────────────────────────────────────────────────────────────
lint: ## go vet + gofmt (vérifie que rien n'est à reformater)
	@echo "→ go vet ./..."
	@go vet $(GOFLAGS) ./...
	@echo "→ gofmt (vérification)"
	@unformatted=$$(gofmt -l .); \
	if [ -n "$$unformatted" ]; then \
		echo "Fichiers non formatés :"; \
		echo "$$unformatted"; \
		exit 1; \
	fi
	@echo "✓ lint OK"

fmt: ## Formate tout le code source
	@echo "→ gofmt -w ."
	@gofmt -w .

# ─── Modules ─────────────────────────────────────────────────────────────
tidy: ## Nettoie go.mod / go.sum
	@echo "→ go mod tidy"
	@go mod tidy

# ─── Contenu ─────────────────────────────────────────────────────────────
validate: build-cli ## Valide les programmes YAML
	@echo "→ validation du contenu dans $(CONTENT_DIR)"
	@$(CLI_BIN) validate --dir $(CONTENT_DIR)

# ─── Clean ───────────────────────────────────────────────────────────────
clean: ## Supprime les binaires et fichiers de couverture
	@echo "→ clean"
	@rm -rf $(BIN_DIR)
	@rm -f $(COVER_FILE) $(COVER_HTML)
	@echo "✓ clean OK"
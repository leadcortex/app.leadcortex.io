.PHONY: help build build-server build-cli run test test-cover lint fmt clean tidy validate-content

BIN_DIR := ./bin
SERVER_BIN := $(BIN_DIR)/academy-server
CLI_BIN := $(BIN_DIR)/academy-cli

help:
	@echo "Commandes disponibles :"
	@echo "  make build           — compile serveur + CLI"
	@echo "  make build-server    — compile uniquement le serveur"
	@echo "  make build-cli       — compile uniquement la CLI"
	@echo "  make run             — lance le serveur en mode dev"
	@echo "  make test            — lance tous les tests"
	@echo "  make test-cover      — tests + rapport de couverture"
	@echo "  make lint            — go vet + golangci-lint (si installé)"
	@echo "  make fmt             — gofmt sur tout le code"
	@echo "  make tidy            — go mod tidy"
	@echo "  make validate-content — valide tous les YAML de content/"
	@echo "  make clean           — supprime bin/ et les artefacts"

build: build-server build-cli

build-server:
	@mkdir -p $(BIN_DIR)
	go build -ldflags="-s -w" -o $(SERVER_BIN) ./cmd/academy-server

build-cli:
	@mkdir -p $(BIN_DIR)
	go build -ldflags="-s -w" -o $(CLI_BIN) ./cmd/academy-cli

run:
	go run ./cmd/academy-server --dev

test:
	go test -race -count=1 ./...

test-cover:
	go test -race -count=1 -coverprofile=coverage.txt -covermode=atomic ./...
	go tool cover -html=coverage.txt -o coverage.html

lint:
	go vet ./...
	@command -v golangci-lint >/dev/null 2>&1 && golangci-lint run || echo "golangci-lint non installé, go vet suffit pour cette session"

fmt:
	gofmt -s -w .

tidy:
	go mod tidy

validate-content:
	go run ./cmd/academy-cli validate --dir ./content

clean:
	rm -rf $(BIN_DIR) coverage.txt coverage.html
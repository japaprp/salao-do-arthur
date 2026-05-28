# Makefile - Barbearia do Artur
# Comandos comuns para desenvolvimento e deploy

.PHONY: help build up down restart logs clean dev prod migrate test lint format

# Cores para output
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(BLUE)Barbearia do Artur - Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

## Desenvolvimento
dev: ## Inicia ambiente de desenvolvimento
	@echo "$(BLUE)🚀 Iniciando ambiente de desenvolvimento...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Ambiente iniciado!$(NC)"
	@echo "$(YELLOW)📊 Serviços disponíveis:$(NC)"
	@echo "  - API: http://localhost:3000"
	@echo "  - Swagger: http://localhost:3000/api/docs"
	@echo "  - PgAdmin: http://localhost:8080 (admin@salao.com / admin123)"
	@echo "  - Redis Commander: http://localhost:8081"

dev-tools: ## Inicia ambiente com ferramentas de desenvolvimento
	@echo "$(BLUE)🛠️  Iniciando ambiente com ferramentas de desenvolvimento...$(NC)"
	docker-compose --profile dev-tools up -d
	@echo "$(GREEN)✅ Ambiente com ferramentas iniciado!$(NC)"

up: ## Inicia todos os serviços
	@echo "$(BLUE)🚀 Iniciando serviços...$(NC)"
	docker-compose up -d

down: ## Para todos os serviços
	@echo "$(BLUE)🛑 Parando serviços...$(NC)"
	docker-compose down

restart: ## Reinicia todos os serviços
	@echo "$(BLUE)🔄 Reiniciando serviços...$(NC)"
	docker-compose restart

logs: ## Mostra logs dos serviços
	docker-compose logs -f

logs-backend: ## Mostra logs apenas do backend
	docker-compose logs -f backend

## Banco de dados
migrate: ## Executa migrações do Prisma
	@echo "$(BLUE)🗄️  Executando migrações do banco...$(NC)"
	docker-compose --profile migrate up prisma-migrate
	@echo "$(GREEN)✅ Migrações executadas!$(NC)"

db-reset: ## Reseta o banco de dados
	@echo "$(BLUE)💥 Resetando banco de dados...$(NC)"
	docker-compose down -v
	docker-compose up -d postgres redis
	@echo "$(GREEN)✅ Banco resetado!$(NC)"

## Build e Deploy
build: ## Build das imagens Docker
	@echo "$(BLUE)🔨 Fazendo build das imagens...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✅ Build concluído!$(NC)"

prod: ## Inicia ambiente de produção
	@echo "$(BLUE)🏭 Iniciando ambiente de produção...$(NC)"
	docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)✅ Ambiente de produção iniciado!$(NC)"

## Desenvolvimento Local (sem Docker)
install: ## Instala dependências do backend
	@echo "$(BLUE)📦 Instalando dependências...$(NC)"
	cd backend && npm install

start: ## Inicia o backend localmente
	@echo "$(BLUE)🚀 Iniciando backend localmente...$(NC)"
	cd backend && npm run start:dev

test: ## Executa testes
	@echo "$(BLUE)🧪 Executando testes...$(NC)"
	cd backend && npm run test

lint: ## Executa linting
	@echo "$(BLUE)🔍 Executando linting...$(NC)"
	cd backend && npm run lint

format: ## Formata o código
	@echo "$(BLUE)💅 Formatando código...$(NC)"
	cd backend && npm run format

## Limpeza
clean: ## Remove containers, volumes e imagens
	@echo "$(BLUE)🧹 Limpando ambiente Docker...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

clean-all: ## Limpeza completa incluindo imagens
	@echo "$(BLUE)🧹 Limpando tudo...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -a -f --volumes
	@echo "$(GREEN)✅ Limpeza completa concluída!$(NC)"

## Utilitários
status: ## Mostra status dos serviços
	@echo "$(BLUE)📊 Status dos serviços:$(NC)"
	docker-compose ps

shell-backend: ## Acessa shell do container backend
	docker-compose exec backend sh

shell-db: ## Acessa shell do PostgreSQL
	docker-compose exec postgres psql -U salao -d barbearia_do_artur
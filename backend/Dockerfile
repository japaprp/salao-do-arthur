# Backend Dockerfile - Salão da Lu

FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat curl

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Stage de desenvolvimento
FROM base AS development
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Stage de build
FROM base AS builder
COPY . .
RUN npm install
RUN npm run build

# Stage de produção
FROM node:20-alpine AS production
WORKDIR /app

# Copiar arquivos necessários
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production


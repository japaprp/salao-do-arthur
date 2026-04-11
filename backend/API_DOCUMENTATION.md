# API Salão da Lu - Documentação de Endpoints

## Visão Geral

API RESTful para o sistema Salão da Lu, implementada em NestJS com autenticação JWT e arquitetura multi-tenant.

## Autenticação

Todos os endpoints (exceto `/auth/login` e `/auth/register`) requerem autenticação via Bearer Token no header `Authorization`.

## Endpoints

### Auth

#### POST /api/auth/login
Login de usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "jwt.token.here",
  "tokenType": "Bearer",
  "expiresIn": "2h"
}
```

#### POST /api/auth/register
Registro de novo usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+5511999999999",
  "password": "password123",
  "name": "João Silva",
  "role": "CLIENT",
  "organizationName": "Salão da Lu" // opcional, cria tenant se não informado
}
```

#### GET /api/auth/profile
Retorna perfil do usuário autenticado.

### Health

#### GET /api/health
Verifica saúde da aplicação.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Professionals

#### GET /api/professionals
Lista profissionais do tenant.

#### GET /api/professionals/:id
Busca profissional por ID.

#### POST /api/professionals
Cria novo profissional.

**Request Body:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "specialty": "Cabelereiro",
  "commissionPercent": 40.0
}
```

#### PUT /api/professionals/:id
Atualiza profissional.

#### DELETE /api/professionals/:id
Remove profissional (soft delete).

### Clients

#### GET /api/clients
Lista clientes do tenant.

#### GET /api/clients/:id
Busca cliente por ID com histórico.

#### POST /api/clients
Cria novo cliente.

**Request Body:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "favoriteProfessionalId": "uuid" // opcional
}
```

#### PUT /api/clients/:id
Atualiza cliente.

#### DELETE /api/clients/:id
Remove cliente.

### Services

#### GET /api/services
Lista serviços ativos do tenant.

#### GET /api/services/:id
Busca serviço por ID.

#### POST /api/services
Cria novo serviço.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "name": "Corte de Cabelo",
  "description": "Corte masculino completo",
  "durationMinutes": 60,
  "price": 50.00,
  "bufferBeforeMinutes": 15,
  "bufferAfterMinutes": 15
}
```

#### PUT /api/services/:id
Atualiza serviço.

#### DELETE /api/services/:id
Remove serviço (soft delete).

### Appointments

#### GET /api/appointments
Lista agendamentos do tenant.

#### GET /api/appointments/:id
Busca agendamento por ID.

#### POST /api/appointments
Cria novo agendamento.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "clientId": "uuid",
  "professionalId": "uuid",
  "serviceId": "uuid",
  "scheduledAt": "2024-01-01T14:00:00.000Z",
  "durationMinutes": 60,
  "notes": "Cliente prefere corte curto"
}
```

#### PUT /api/appointments/:id
Atualiza agendamento.

#### PUT /api/appointments/:id/status
Atualiza status do agendamento.

**Request Body:**
```json
{
  "status": "CHECKED_IN"
}
```

#### POST /api/appointments/:id/checkin
Faz check-in do agendamento.

#### POST /api/appointments/:id/start
Inicia atendimento.

#### POST /api/appointments/:id/complete
Finaliza atendimento.

#### DELETE /api/appointments/:id
Cancela agendamento.

## Status Codes

- `200` - Sucesso
- `201` - Criado
- `400` - Bad Request
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `409` - Conflito
- `500` - Erro interno

## Validação

Todos os endpoints validam dados de entrada usando class-validator. Campos obrigatórios são marcados e tipos são validados automaticamente.

## Multi-tenant

Todos os recursos são isolados por tenant. O tenant é identificado via JWT token do usuário autenticado.
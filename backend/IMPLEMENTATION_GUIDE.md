# 🚀 Guia de Implementação Backend - Salão da Lu

## Setup Inicial

### 1. Instalar Dependências
```bash
cd backend
npm install

# As dependências de segurança já estão no package.json:
# - @nestjs/throttler (rate limiting)
# - helmet (security headers)
# - winston (logging)
# - winston-daily-rotate-file (log rotation)
```

### 2. Compilação e Build
```bash
# Type check
npm run build

# Lint
npm run lint:check

# Format
npm run format:check
```

### 3. Testes
```bash
# Rodar testes
npm run test

# Com cobertura
npm run test:cov

# Watch mode
npm run test:watch
```

---

## 🔒 Ativar Rate Limiting

Rate limiting protege contra DDoS e abuso de API.

### Passo 1: Descomente em `src/app.module.ts`
```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // DESCOMENTE ISTO:
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 100 },    // 100 req/min
      { name: 'auth', ttl: 900000, limit: 5 },        // 5 req/15min para login
      { name: 'api', ttl: 60000, limit: 500 },        // 500 req/min para API
    ]),
    // ... resto dos imports
  ],
  providers: [
    // DESCOMENTE ISTO:
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Passo 2: Testar Rate Limiting
```bash
# Terminal 1: Rodar app
npm run start:dev

# Terminal 2: Testar limite global
for i in {1..105}; do
  curl http://localhost:3000/api/health
  echo "Request $i"
done

# Deve receber "429 Too Many Requests" na request 101+
```

---

## 🔐 RLS + Tenant Context

Para garantir isolamento de tenant no banco:

### Passo 1: Aplicar Policies SQL
```bash
cd database
psql -U postgres -d salao_da_lu < rls_policies.sql
```

### Passo 2: Usar TenantContextService em Services
```typescript
import { TenantContextService } from '../common/services/tenant-context.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  async create(tenantId: string, dto: CreateClientDto) {
    return this.tenantContext.executeInTenantContext(tenantId, () =>
      this.prisma.clients.create({
        data: {
          ...dto,
          tenant_id: tenantId,
        },
      }),
    );
  }
}
```

### Passo 3: Usar @Tenant() Decorator em Controllers
```typescript
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Tenant() tenantId: string) {
    return this.clientsService.findByTenant(tenantId);
  }
}
```

---

## 📊 Logging com Winston

Logs são salvos em 3 arquivos:

```
logs/
├── app-2026-04-10.log        # Todos os logs
├── error-2026-04-10.log      # Apenas erros
└── audit-2026-04-10.log      # Auditoria (rotação 90 dias)
```

### Usar Logger
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Algo aconteceu');
    this.logger.warn('Cuidado!');
    this.logger.error('Erro!');
    this.logger.debug('Debug info');
  }
}
```

---

## 🧪 Estratégia de Testes

### Testes Unitários
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  it('should return access token on valid credentials', async () => {
    // Arrange, Act, Assert
  });
});
```

**Meta: 70% de cobertura**
```bash
npm run test:cov
# Gera coverage/index.html
```

### Testes de Integração
```bash
# Com banco de dados de teste
TEST_DATABASE_URL=postgresql://... npm run test:e2e
```

---

## 🔍 Security Checklist

- [ ] Helmet habilitado (`main.ts`)
- [ ] Throttler ativado (rate limiting)
- [ ] CORS configurado corretamente (`.env`)
- [ ] JWT secret em env var (não em código)
- [ ] RLS policies aplicadas no banco
- [ ] TenantContextService usado em todos services
- [ ] Validação de input com class-validator
- [ ] Logs sem dados sensíveis
- [ ] HTTPS habilitado em produção
- [ ] Backup do banco antes de RLS

---

## 🚀 Deploy Checklist

```bash
# 1. Build
npm run build

# 2. Test
npm run test:cov

# 3. Lint
npm run lint:check

# 4. Database
npm run prisma:migrate

# 5. Run
npm run start:prod
```

---

## 📚 Arquivos Principais

| Arquivo | Propósito |
|---------|-----------|
| `src/app.module.ts` | Módulo raiz com imports |
| `src/main.ts` | Bootstrap com Helmet |
| `src/common/config/http-security.config.ts` | CORS + headers de segurança |
| `src/common/middleware/security.middleware.ts` | Tenant context middleware |
| `src/modules/auth/auth.service.spec.ts` | Exemplo de teste |
| `jest.config.ts` | Configuração Jest |

---

## 🆘 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill process
lsof -ti:3000 | xargs kill -9

# Ou usar porta diferente
PORT=3001 npm run start:dev
```

### "RLS não funciona"
```sql
-- Verificar se policies foram aplicadas
SELECT * FROM pg_policies LIMIT 5;

-- Deve retornar 4+ linhas
```

### "Tests failing"
```bash
# Limpar cache
npm run test -- --clearCache

# Rodar novamente
npm run test:cov
```

### "Helmet conflictando com CORS"
```
Helmet já está em main.ts, remover duplicatas
```

---

## 📞 Próximos Passos

1. ✅ Dependências instaladas
2. ✅ Helmet integrado
3. 🔲 Rate limiting ativado (descomente app.module.ts)
4. 🔲 RLS policies aplicadas no banco
5. 🔲 Teste de compilação: `npm run build`
6. 🔲 Teste de testes: `npm run test`

---

**Quer começar? Rode:**
```bash
npm run start:dev
```

**Swagger disponível em:** http://localhost:3000/api/docs

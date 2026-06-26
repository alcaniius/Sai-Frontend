# SAI Backend - Patrones y Convenciones

## Estructura de un Módulo

Cada módulo NestJS sigue esta estructura:
```
src/modules/<nombre>/
├── <nombre>.module.ts          # Módulo NestJS
├── <nombre>.controller.ts      # Controlador con RBAC
├── <nombre>.service.ts         # Lógica de negocio
├── <nombre>.service.spec.ts    # Tests unitarios
└── dto/                        # DTOs de validación
    ├── create-<entity>.dto.ts
    └── update-<entity>.dto.ts
```

## Módulos Existentes

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| `auth` | ✅ Completo | JWT + refresh tokens + Passport |
| `users` | ✅ Completo | CRUD con RBAC |
| `documents` | ✅ Completo | CRUD + versiones + aprobaciones |
| `environmental` | ✅ Completo | Aspectos + PMA + ANLA |
| `automation` | ✅ Completo | BullMQ + PDF generation |
| `quality` | ⏳ Vacío | ISO 9001 (Fase 4) |
| `education` | ⏳ Vacío | LMS (Fase 4) |
| `dashboard` | ⏳ Vacío | Real-time (Fase 5) |

## Prisma v7 - CRÍTICO

Prisma 7 **NO usa `url`** en el schema. Usa adapter:

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  // SIN url aquí — se pasa via adapter
}
```

```typescript
// prisma.service.ts - usa PrismaPg adapter
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
```

**Dependencias requeridas**: `@prisma/adapter-pg` + `pg` (NO url en schema)

## Seguridad Implementada

### main.ts
```typescript
app.use(helmet());                    // Security headers
app.setGlobalPrefix('api/v1');        // Prefijo global
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
// CORS dinámico desde CORS_ORIGINS env var
```

### Rate Limiting (app.module.ts)
```typescript
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },    // brute force
  { name: 'medium', ttl: 10000, limit: 20 },  // uso normal
  { name: 'long', ttl: 60000, limit: 100 },   // operaciones pesadas
])
```

### RBAC Pattern
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('ruta')
export class MiController {
  @Post()
  @Roles('ADMIN', 'MANAGER')   // Solo ADMIN y MANAGER
  create(@Body() dto: CreateDto) { ... }

  @Get()
  // Sin @Roles = todos los autenticados
  findAll() { ... }
}
```

**Roles**: `ADMIN`, `MANAGER`, `USER`, `AUDITOR`

## Permisos RBAC por Endpoint

| Endpoint | ADMIN | MANAGER | USER | AUDITOR |
|----------|-------|---------|------|---------|
| `/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/users` CRUD | ✅ | Read | ❌ | ❌ |
| `/documents` | Full | CRUD+approve | Create/Read | Read |
| `/environmental/aspects` | Full | CRUD | Read | Read |
| `/environmental/pma` | Full | CRUD | Read | ❌ |
| `/environmental/anla` | Full | CRUD | ❌ | ❌ |

## Auth Flow
1. `POST /auth/register` → crea usuario con rol `USER` (hardcoded, no self-assign)
2. `POST /auth/login` → devuelve `{ user, accessToken, refreshToken }`
3. `POST /auth/refresh` → rota refresh token
4. JWT secrets via `ConfigService.getOrThrow()` (NO `process.env` directo)

## Automation Module (BullMQ)
```typescript
// Cola de PDFs con Redis
BullModule.forRoot({ connection: { host, port } })
BullModule.registerQueue({ name: 'pdf-generation' })

// Jobs: generate-pma-pdf, generate-anla-pdf
// Retry: 3 intentos, backoff exponencial 5s
// PDF library: pdf-lib (NO Puppeteer)
// Storage: MinIO via nestjs-s3
```

## Env Vars Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sai_db?schema=public
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGINS=http://localhost:3002
REDIS_HOST=localhost
REDIS_PORT=6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=minio_password
PORT=3001
API_PREFIX=api/v1
DEFAULT_TENANT_HEADER=x-tenant-id
```

## Quirks Críticos
1. **Prisma v7**: Necesita adapter `@prisma/adapter-pg` + `pg`, NO url en schema
2. **Zod v4**: Usar `message` en lugar de `required_error` en enum validation
3. **Self-role-assignment**: `register()` siempre asigna `role: 'USER'`
4. **Automation Module**: Usa `process.env` directo en vez de ConfigService (technical debt)
5. **Multi-tenant**: Middleware `TenantMiddleware` extrae tenant de header configurable

## Testing
```bash
cd backend
npx jest --coverage           # 42 unit tests
npx jest --config ./test/jest-e2e.json  # 14 e2e tests
```

### Mock de Prisma
```typescript
// prisma.service.mock.ts
import { PrismaService } from './prisma.service';
export const mockPrismaService = {
  user: { findUnique: jest.fn(), create: jest.fn(), ... },
  document: { ... },
  environmentalAspect: { ... },
  // etc
};
```

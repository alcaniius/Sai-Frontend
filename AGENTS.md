# SAI - Agent Instructions

## Quick Start

```bash
# Backend
cd backend && pnpm install && pnpm start:dev          # http://localhost:3001

# Frontend  
cd Frontend && pnpm install && pnpm dev               # http://localhost:3002
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `cd backend && pnpm start:dev` | Start backend |
| `cd Frontend && pnpm dev` | Start frontend |
| `cd backend && npx jest --coverage` | Run backend tests (42 unit + 14 e2e) |
| `cd Frontend && npx vitest run` | Run frontend tests (12 tests) |
| `cd backend && pnpm build` | Build backend |
| `cd Frontend && npx next build` | Build frontend |
| `cd backend && pnpm prisma generate` | Generate Prisma client |
| `cd backend && pnpm prisma migrate dev` | Run migrations |

## Ports
- **Backend API**: `3001`
- **Frontend**: `3002` (Dokploy uses 3000)
- **MinIO**: `9000/9001`
- **PostgreSQL**: `5432`

## Critical Quirks

### Prisma v7
- Requires adapter: `@prisma/adapter-pg` + `pg` (NOT url in schema)
- Use `PrismaPg` adapter in `prisma.service.ts`

### Zod v4
- Use `message` instead of `required_error` for enum validation:
  ```typescript
  z.enum(['LOW', 'MEDIUM'], { message: 'Required' })  // ✅
  z.enum(['LOW', 'MEDIUM'], { required_error: '...' }) // ❌
  ```

### Forms
- Import from `react-hook-form`, NOT `react-form`
- Use `zodResolver` from `@hookform/resolvers/zod`

## Project Structure

```
SAI/
├── backend/           # NestJS 11 + Prisma 7
│   ├── src/modules/  # auth, users, documents, environmental
│   ├── prisma/       # schema.prisma
│   └── test/         # e2e tests
├── Frontend/         # Next.js 16 + React 19
│   ├── src/app/     # App Router pages
│   ├── src/lib/     # api.ts, services.ts
│   └── src/store/   # Zustand authStore
└── docker-compose.yml
```

## Testing

- **Backend**: Jest (`npx jest --coverage`) — 42 unit + 14 e2e passing
- **Frontend**: Vitest (`npx vitest run`) — 12 tests passing
- Run both before any PR/commit

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate>
CORS_ORIGINS=http://localhost:3002
BCRYPT_SALT_ROUNDS=10
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Known Issues Fixed

- `AspectForm.tsx` import error → use `react-hook-form`
- Users update empty body → now passes `@Body()` correctly
- Tenant header configurable via `DEFAULT_TENANT_HEADER` env

## Security

- Helmet enabled in `main.ts`
- Rate limiting: `@nestjs/throttler` (short/medium/long profiles)
- CORS dynamic from `CORS_ORIGINS` env var
- RBAC via `@Roles()` decorator + RolesGuard

## RBAC Roles

| Role | Access |
|------|--------|
| ADMIN | Full system |
| MANAGER | Users + Docs + Environmental CRUD |
| USER | Create/read docs, read environmental |
| AUDITOR | Read-only |

## References

- Full docs: `README.md`, `ESTADO.md`, `QUICKSTART.md`
- Backend: `backend/README.md`
- Frontend: `Frontend/README.md`

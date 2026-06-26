# SAI - DevOps, Docker y Despliegue

## Docker Compose (Raíz: `docker-compose.yml`)

### Servicios

| Servicio | Imagen | Puerto | Propósito |
|----------|--------|--------|-----------|
| `postgres` | postgres:16-alpine | 5432 | Base de datos |
| `redis` | redis:7-alpine | 6379 | Rate limiting + BullMQ queues |
| `minio` | minio/minio:latest | 9000/9001 | Almacenamiento S3 (documentos, PDFs) |
| `backend` | Build desde `./backend` | 3001 | API NestJS |
| `frontend` | Build desde `./Frontend` | 3002 | Web Next.js |

### Dependencias
```
frontend → backend → postgres + redis
backend → minio
```

### Health Checks
- **postgres**: `pg_isready -U sai_user` (cada 10s)
- **redis**: `redis-cli ping` (cada 10s)
- **minio**: `curl http://localhost:9000/minio/health/live` (cada 30s)
- **backend**: `curl http://localhost:3001/api/v1/health` (cada 30s)

### Volumes
- `postgres_data` — datos persistentes de PostgreSQL
- `redis_data` — datos persistentes de Redis
- `minio_data` — archivos almacenados en MinIO

### Red
- `sai-network` — bridge network compartida

## Variables de Entorno de Producción

```env
# Generar con: openssl rand -base64 32
POSTGRES_USER=sai_user
POSTGRES_PASSWORD=<CAMBIAR_EN_PRODUCCION>
JWT_SECRET=<GENERAR>
JWT_REFRESH_SECRET=<GENERAR>
MINIO_ACCESS_KEY=<CAMBIAR>
MINIO_SECRET_KEY=<CAMBIAR>
CORS_ORIGINS=https://tu-dominio.com
FRONTEND_URL=https://tu-dominio.com
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api/v1
```

## Despliegue en Dokploy

1. Push a GitHub
2. En Dokploy Dashboard: crear proyecto → conectar repo → seleccionar `docker-compose.yml`
3. Configurar env vars con secretos seguros
4. Push a `main` = deploy automático

### Notas Dokploy
- Puerto 3000 **ocupado** por Dokploy → Frontend usa 3002
- Backend Dockerfile: multi-stage (builder + runner)
- Frontend Dockerfile: standalone output de Next.js

## Comandos Docker Útiles

```bash
# Levantar infraestructura local (solo DB + Redis + MinIO)
cd backend && docker compose up -d

# Levantar todo el stack
docker compose up -d

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild
docker compose up -d --build

# Limpiar todo
docker compose down -v
```

## Backend Dockerfile
- Multi-stage: `node:20-alpine` → build → run
- `pnpm install` + `pnpm build` + `prisma generate`
- Producción: `node dist/main`

## Frontend Dockerfile
- Multi-stage: `node:20-alpine` → build → standalone
- `next build` con output: standalone
- Puerto configurable via env

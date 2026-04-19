# 🚀 SAI - Guía de Inicio Rápido

## ⚠️ Requisitos Previos

- Node.js 20+
- pnpm (`corepack enable pnpm`)
- Docker Desktop (para PostgreSQL, Redis, MinIO)

---

## 📦 Instalación

### Backend

```bash
cd backend

# Instalar dependencias
pnpm install

# Generar Prisma Client
pnpm prisma generate

# Levantar infraestructura
docker compose up -d

# Ejecutar migraciones
pnpm prisma migrate dev --name init

# Iniciar servidor de desarrollo
pnpm start:dev
```

**Backend**: http://localhost:3001  
**Health Check**: http://localhost:3001/api/v1/health

### Frontend

```bash
cd Frontend

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

**Frontend**: http://localhost:3002

---

## 🧪 Testing

### Backend (42 tests unitarios + 14 e2e)

```bash
cd backend

# Tests unitarios con coverage
npx jest --coverage

# Tests e2e
npx jest --config ./test/jest-e2e.json
```

**Resultado esperado**: 42 passed, 14 passed

### Frontend (12 tests)

```bash
cd Frontend

# Tests con vitest
npx vitest run
```

**Resultado esperado**: 12 passed

---

## 🏗️ Build

### Backend

```bash
cd backend
pnpm build
```

### Frontend

```bash
cd Frontend
npx next build
```

---

## 📋 Comandos Útiles

```bash
# Backend
cd backend
pnpm start:dev           # Desarrollo
pnpm prisma studio       # UI de base de datos
pnpm lint                # Linting

# Frontend
cd Frontend
pnpm dev                # Desarrollo
npx next build          # Producción
npx vitest run          # Tests
```

---

## 🔐 Variables de Entorno

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://sai_user:PASSWORD@localhost:5432/sai_db?schema=public"

# JWT (GENERAR CON: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_secure_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# Redis (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=minio_password

# App
PORT=3001
NODE_ENV=development
API_PREFIX=api/v1

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3002

# Multi-tenant
DEFAULT_TENANT_HEADER=x-tenant-id
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=SAI - Sistema Ambiental Integrado
```

---

## ✅ Lo que está implementado

### Backend
- [x] Autenticación JWT con refresh tokens
- [x] Sistema de roles (ADMIN, MANAGER, USER, AUDITOR)
- [x] Multi-tenant (header `X-Tenant-ID` o subdominio)
- [x] CRUD de usuarios (protegido por RBAC)
- [x] CRUD de documentos con versiones y aprobaciones
- [x] Módulo ambiental (aspectos, PMAs, ANLA)
- [x] Helmet (security headers)
- [x] Rate Limiting (@nestjs/throttler)
- [x] CORS dinámico

### Frontend
- [x] Login con validación Zod
- [x] Registro con validación Zod
- [x] Dashboard con sidebar
- [x] Gestión de documentos
- [x] Módulo ambiental (matriz aspectos, PMAs, ANLA)
- [x] Autenticación con Zustand + persistencia

---

## 🔜 Siguientes Pasos (Fase 2)

1. **Automatización de Documentos**
   - Configurar BullMQ + Redis
   - Generador de PDFs asíncrono (Puppeteer)
   - Notificaciones por email

2. **Huella de Carbono**
   - Microservicio FastAPI/Python
   - Cálculos Scope 1, 2, 3

3. **Mejora de Tests**
   - Tests para controllers
   - Coverage target: 60%

---

## 🐛 Problemas Comunes

### "Prisma no puede conectar a la base de datos"
- Verificar que PostgreSQL esté corriendo
- Verificar `DATABASE_URL` en `.env`
- Si usa Docker: `docker compose up -d`

### "Frontend no puede conectar al backend"
- Verificar que backend esté en `http://localhost:3001`
- Revisar `NEXT_PUBLIC_API_URL` en `.env.local`
- Verificar CORS en `main.ts`

### "Error de tipos TypeScript"
- Ejecutar `pnpm build` para verificar
- Frontend: `npx next build`

---

## 📞 Soporte

- Tests fallan: ejecutar `npx jest --coverage` para ver coverage
- Build falla: revisar errores de TypeScript con `pnpm build`
- Docker issues: `docker compose logs -f`

---

**Documento creado**: Abril 2026  
**Última actualización**: Abril 15, 2026  
**Versión**: 1.2 - Fase 1 Completa + Tests
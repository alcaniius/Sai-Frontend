# SAI - Sistema Ambiental Integrado

## ¿Qué es?
Plataforma SaaS para automatizar la gestión ambiental, documental y educativa de empresas en Colombia, alineada con ISO 14001 e ISO 9001.

## Ruta del Proyecto
`C:\DEV\SAI`

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | NestJS | 11 |
| ORM | Prisma | 7 (con adapter-pg) |
| DB | PostgreSQL | 16 |
| Cache/Queue | Redis 7 + BullMQ | - |
| Storage | MinIO (S3) | latest |
| Frontend | Next.js | 16 |
| UI | React 19 + Tailwind CSS 4 | - |
| State | Zustand 5 | - |
| Forms | React Hook Form 7 + Zod 4 | - |
| Fetching | TanStack Query 5 + Axios | - |

## Arquitectura
```
Frontend (Next.js 16) ←→ Backend (NestJS 11) ←→ PostgreSQL 16
                                   ↕                    ↕
                                 Redis              MinIO (S3)
                            (throttler/queues)    (documentos)
```

## Estructura de Directorios

```
SAI/
├── backend/           # NestJS 11 + Prisma 7
│   ├── src/
│   │   ├── common/    # database, middleware, decorators, guards
│   │   └── modules/   # auth, users, documents, environmental, automation
│   ├── prisma/        # schema.prisma (20+ modelos)
│   └── test/          # e2e tests
├── Frontend/          # Next.js 16 + React 19
│   ├── src/app/       # App Router (auth, dashboard)
│   ├── src/components/# environmental, ui
│   ├── src/lib/       # api.ts, services.ts
│   └── src/store/     # Zustand authStore
├── app-movil/         # Flutter (Fase 3 - VACÍO)
├── docker-compose.yml # PostgreSQL + Redis + MinIO + Backend + Frontend
├── ESTADO.md          # Estado detallado del proyecto
├── QUICKSTART.md      # Guía de inicio rápido
└── DOKPLOY_GUIDE.md   # Guía de despliegue
```

## Fases del Proyecto

| Fase | Descripción | Estado |
|------|------------|--------|
| **Fase 1** | Fundamentos: Auth, RBAC, Docs, Tests, Security | ✅ COMPLETA |
| **Fase 2** | Núcleo Ambiental: Aspectos, PMA, ANLA, BullMQ, PDF | 🔄 ~70% |
| **Fase 3** | App Móvil Flutter | ⏳ PENDIENTE |
| **Fase 4** | LMS + Calidad (ISO 9001) | ⏳ PENDIENTE |
| **Fase 5** | Dashboard Real-time + Alertas | ⏳ PENDIENTE |

## Puertos
- **Backend**: 3001
- **Frontend**: 3002 (Dokploy usa 3000)
- **MinIO**: 9000/9001
- **PostgreSQL**: 5432
- **Redis**: 6379

## Comandos Clave
```bash
# Backend
cd backend && pnpm install && pnpm start:dev
cd backend && npx jest --coverage         # 42 unit + 14 e2e
cd backend && pnpm prisma generate
cd backend && pnpm prisma migrate dev

# Frontend
cd Frontend && pnpm install && pnpm dev
cd Frontend && npx vitest run             # 12 tests
```

## Responsables
- **Elaborado por**: Jaider Hernández Cardozo
- **Ing. Ambiental**: Yina Montero Villadiego

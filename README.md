# SAI - Sistema Ambiental Integrado

> Plataforma SaaS para automatizar la gestión ambiental, documental y educativa de empresas en Colombia, alineada con las normas ISO 14001 e ISO 9001.

## 📋 Tabla de Contenidos
- [Estado del Proyecto](#estado-del-proyecto)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Seguridad Implementada](#seguridad-implementada)
- [Testing](#testing)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Cómo Empezar](#cómo-empezar)
- [Próximos Pasos](#próximos-pasos)
- [Despliegue con Dokploy](#despliegue-con-dokploy)
- [Documentación Adicional](#documentación-adicional)

---

## Estado del Proyecto

### ✅ Fase 1 - Fundamentos (COMPLETADA)
- [x] Infraestructura base (NestJS + Next.js)
- [x] Autenticación JWT + RBAC
- [x] Sistema multi-tenant
- [x] Módulo de Gestión Documental
- [x] Frontend: Login, Registro, Dashboard
- [x] Frontend: Interfaz de gestión documental
- [x] Docker Compose para desarrollo local
- [x] Configuración para Dokploy
- [x] **Seguridad**: Helmet, Rate Limiting, CORS dinámico
- [x] **Testing**: 42 tests unitarios + 14 e2e (backend), 12 tests (frontend)

### 🔄 Fase 2 - Núcleo Ambiental (EN PROGRESO)
- [x] Matriz de aspectos e impactos (backend + frontend)
- [x] API de PMAs y Reportes ANLA
- [x] Generación automática de PMA (PDF async con BullMQ + pdf-lib)
- [ ] Huella de carbono (FastAPI)
- [ ] Cronograma de reportes ANLA con alertas (Nodemailer)

### 🔄 Fase 3 - App Móvil (PENDIENTE)
- [ ] App Flutter
- [ ] Formularios offline
- [ ] Geolocalización
- [ ] Informes de campo

### 🔄 Fase 4 - LMS y Calidad (PENDIENTE)
- [ ] Cursos y evaluaciones
- [ ] Certificados QR
- [ ] Auditorías
- [ ] No conformidades

### 🔄 Fase 5 - Dashboard y Automatización (PENDIENTE)
- [ ] Panel en tiempo real (WebSockets)
- [ ] Alertas automátas
- [ ] Búsqueda Elasticsearch
- [ ] Generación avanzada de documentos

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    SAI - Arquitectura                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐              ┌──────────────┐              │
│  │   Frontend   │              │   Backend    │              │
│  │  Next.js 16  │◄────────────►│  NestJS 11   │              │
│  │  React 19    │   REST API   │  TypeScript  │              │
│  └──────────────┘              └──────┬───────┘              │
│         │                             │                       │
│         │                             │                       │
│         ▼                             ▼                       │
│  ┌──────────────────────────────────────────────┐           │
│  │           PostgreSQL 16 (Multi-tenant)       │           │
│  │  Schema por organización + Row-Level Security│           │
│  └──────────────────────────────────────────────┘           │
│         │                             │                       │
│         ▼                             ▼                       │
│  ┌──────────────┐              ┌──────────────┐              │
│  │    Redis     │              │    MinIO     │              │
│  │  (Throttler) │              │   (S3 Docs)  │              │
│  └──────────────┘              └──────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Backend (`/backend`)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11 | Framework backend |
| TypeScript | 5 | Lenguaje principal |
| Prisma | 7 | ORM |
| PostgreSQL | 16 | Base de datos |
| Passport.js | - | Autenticación |
| JWT | - | Tokens de acceso |
| bcrypt | 6 | Hash de contraseñas |
| Redis | 7 | Rate Limiting |
| MinIO | latest | Almacenamiento S3 |
| Helmet | 8 | Security headers |

### Frontend (`/Frontend`)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16 | Framework React |
| React | 19 | UI library |
| Tailwind CSS | 4 | Estilos |
| Zustand | 5 | Estado global |
| TanStack Query | 5 | Fetching y caché |
| Recharts | 3 | Gráficas |
| React Hook Form | 7 | Formularios |
| Zod | 4 | Validación |
| Axios | 1 | HTTP client |
| Vitest | 4 | Testing |

---

## Seguridad Implementada

### ✅ Middleware de Seguridad
| Seguridad | Implementación | Archivo |
|-----------|---------------|---------|
| **Helmet** | HTTP security headers (CSP, X-Frame-Options, etc.) | `main.ts` |
| **Rate Limiting** | @nestjs/throttler: short (3/s), medium (20/10s), long (100/min) | `app.module.ts` |
| **CORS** | Dinámico por `CORS_ORIGINS`, validación por request | `main.ts` |
| **ValidationPipe** | whitelist, forbidNonWhitelisted, transform | `main.ts` |

### ✅ RBAC (Roles-Based Access Control)
| Endpoint | ADMIN | MANAGER | USER | AUDITOR |
|----------|-------|---------|------|---------|
| `/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/users` | CRUD | Read | - | - |
| `/documents` | CRUD | CRUD | Create/Read | Read |
| `/environmental/aspects` | CRUD | CRUD | Read | Read |
| `/environmental/pma` | CRUD | CRUD | Read | - |
| `/environmental/anla` | CRUD | CRUD | - | - |

### ✅ Fixes de Seguridad
- **Self-role-assignment**: Registro ya no permite asignar rol — siempre `USER`
- **JWT secrets**: Ahora usa `ConfigService.getOrThrow()` en lugar de `process.env` directo
- **Users update**: Pasa `@Body()` correctamente en vez de objeto vacío

---

## Testing

### Cobertura Backend (42 tests unitarios + 14 e2e)

| Servicio | Tests | Coverage Stmts |
|----------|-------|----------------|
| `auth.service.ts` | 8 | 98% |
| `documents.service.ts` | 10 | 100% |
| `environmental.service.ts` | 12 | 97% |
| `users.service.ts` | 6 | 100% |
| `app.controller.spec.ts` | 6 | 100% |
| **E2E** | 14 | - |

**Ejecutar tests:**
```bash
cd backend
npx jest --coverage
# 42 passed, 33% global (controllers/DTOs sin tests)
```

### Frontend (12 tests)

| Suite | Tests |
|-------|-------|
| `authStore.test.ts` | 4 |
| `api.test.ts` | 2 |
| `services.test.ts` | 6 |

**Ejecutar tests:**
```bash
cd Frontend
npx vitest run
# 12 passed
```

### Bugs Corregidos durante Testing
- `AspectForm.tsx`: import `react-form` → `react-hook-form`
- `AspectForm.tsx`: `z.enum` con `required_error` (Zod v4) → `message`
- `tenant.middleware.ts`: header hardcodeado → usa `DEFAULT_TENANT_HEADER` del `.env`
- `users.controller.ts`: update body pasado como `{}` → `@Body() updateUserDto`

---

## Estructura del Proyecto

```
SAI/
├── backend/                      # NestJS Backend
│   ├── src/
│   │   ├── common/              # Utilidades compartidas
│   │   │   ├── database/        # Prisma service
│   │   │   ├── middleware/      # Tenant middleware
│   │   │   ├── decorators/      # @Roles decorator
│   │   │   └── guards/          # RolesGuard
│   │   └── modules/
│   │       ├── auth/            # Autenticación JWT + RBAC
│   │       ├── users/           # CRUD usuarios
│   │       ├── documents/       # Gestión documental
│   │       ├── environmental/   # Módulo ambiental ISO 14001
│   │       ├── quality/         # Módulo 3: Calidad (Fase 4)
│   │       ├── education/       # Módulo 4: LMS (Fase 4)
│   │       ├── dashboard/       # Módulo 5: Dashboard (Fase 5)
│   │       └── automation/      # Módulo 6: Automatización (Fase 5)
│   ├── prisma/
│   │   └── schema.prisma        # Esquema de base de datos (15+ modelos)
│   ├── docker-compose.yml       # Infraestructura local
│   ├── Dockerfile               # Imagen para producción
│   ├── DOKPLOY.md              # Guía de despliegue
│   ├── jest.config.js          # Configuración de tests
│   └── test/
│       └── app.e2e-spec.ts     # Tests e2e
│
├── Frontend/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Rutas de autenticación
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── dashboard/      # Rutas del dashboard
│   │   │       ├── documents/
│   │   │       ├── environmental/
│   │   │       ├── quality/    (Fase 4)
│   │   │       ├── education/  (Fase 4)
│   │   │       └── indicators/ (Fase 5)
│   │   ├── components/
│   │   │   ├── environmental/   # Componentes módulo ambiental
│   │   │   └── ui/            # Componentes reutilizables
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios con interceptors
│   │   │   └── services.ts     # Servicios API
│   │   ├── store/
│   │   │   ├── authStore.ts    # Zustand auth
│   │   └── store/
│   │       └── authStore.test.ts  # Tests del store
│   ├── vitest.config.ts        # Configuración de tests
│   ├── vitest.setup.ts         # Setup de tests
│   ├── Dockerfile              # Imagen para producción
│   └── package.json
│
├── README.md                    # Este archivo
├── ESTADO.md                    # Estado detallado del proyecto
├── QUICKSTART.md                # Guía de inicio rápido
├── DOKPLOY_GUIDE.md            # Guía de despliegue en Dokploy
└── docker-compose.yml           # Orchestración completa
```

---

## Cómo Empezar

### 1. Requisitos Previos
- Node.js 20+
- pnpm (`corepack enable pnpm`)
- Docker Desktop (para PostgreSQL, Redis, MinIO)

### 2. Backend

```bash
cd backend

# Instalar dependencias
pnpm install

# Generar cliente de Prisma
pnpm prisma generate

# Levantar infraestructura
docker compose up -d

# Ejecutar migraciones
pnpm prisma migrate dev --name init

# Iniciar servidor de desarrollo
pnpm start:dev

# Ejecutar tests
npx jest --coverage
```

El backend estará en `http://localhost:3001`

### 3. Frontend

```bash
cd Frontend

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Ejecutar tests
npx vitest run

# Build de producción
npx next build
```

El frontend estará en `http://localhost:3002`

### 4. Endpoints Disponibles

#### Autenticación
```
POST /api/v1/auth/register   # Registro
POST /api/v1/auth/login    # Login
POST /api/v1/auth/refresh  # Refresh token
POST /api/v1/auth/logout   # Logout (auth required)
```

#### Usuarios (Admin/Manager)
```
GET    /api/v1/users        # Listar usuarios
GET    /api/v1/users/:id    # Obtener usuario
PATCH  /api/v1/users/:id    # Actualizar usuario
DELETE /api/v1/users/:id    # Eliminar usuario
```

#### Documentos (Auth + RBAC)
```
POST   /api/v1/documents           # Crear (USER+)
GET    /api/v1/documents           # Listar (todos)
GET    /api/v1/documents/:id       # Ver detalle
PATCH  /api/v1/documents/:id       # Actualizar (MANAGER+)
DELETE /api/v1/documents/:id       # Eliminar (ADMIN)
POST   /api/v1/documents/:id/versions    # Agregar versión (MANAGER+)
POST   /api/v1/documents/:id/approve     # Aprobar/Rechazar (MANAGER+)
```

#### Ambiental (Auth + RBAC)
```
# Aspectos
POST   /api/v1/environmental/aspects     # Crear (MANAGER+)
GET    /api/v1/environmental/aspects     # Listar (todos)
GET    /api/v1/environmental/aspects/:id # Ver detalle
PATCH  /api/v1/environmental/aspects/:id # Actualizar (MANAGER+)
DELETE /api/v1/environmental/aspects/:id # Eliminar (ADMIN)

# PMAs
POST /api/v1/environmental/pma # Crear (MANAGER+)
GET /api/v1/environmental/pma # Listar (todos)
POST /api/v1/environmental/pma/:id/generate-pdf # Generar PDF async (MANAGER+)
GET /api/v1/environmental/pma/:id/pdf # Obtener URL del PDF generado
GET /api/v1/environmental/jobs/:jobId # Estado del job de generación

# ANLA
POST /api/v1/environmental/anla # Crear (MANAGER+)
GET /api/v1/environmental/anla # Listar (todos)
POST /api/v1/environmental/anla/:id/generate-pdf # Generar PDF async (MANAGER+)
GET /api/v1/environmental/anla/:id/pdf # Obtener URL del PDF generado
```

---

## Próximos Pasos

### Fase 2 - Núcleo Ambiental (Prioridad: ALTA)

1. **Automatización de Documentos**
   - [ ] Cola de tareas con BullMQ + Redis
   - [ ] Generación asíncrona de PDFs (Puppeteer)
   - [ ] Plantillas Word (docxtemplater)
   - [ ] Notificaciones por email (Nodemailer)

2. **Huella de Carbono**
   - [ ] Microservicio FastAPI/Python
   - [ ] Cálculos Scope 1, 2, 3
   - [ ] Gráficas de tendencia

3. **Cronograma ANLA**
   - [ ] Alertas automátas por email
   - [ ] Reportes exportables

### Fase 3 - App Móvil

- [ ] Flutter + API NestJS
- [ ] Offline-first (Drift/SQLite)
- [ ] Geolocalización + Cámara
- [ ] Firebase Cloud Messaging

---

## Despliegue con Dokploy

### Pasos:

1. **Crear repositorio en GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: SAI with security + tests"
   git remote add origin <tu-repo>
   git push -u origin main
   ```

2. **Configurar en Dokploy**
   - Ir a Dokploy Dashboard
   - Crear nuevo proyecto
   - Conectar repositorio GitHub
   - Seleccionar `docker-compose.yml`

3. **Configurar variables de entorno**
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=<generar>
   JWT_REFRESH_SECRET=<generar>
   CORS_ORIGINS=http://localhost:3002,https://tu-dominio.com
   BCRYPT_SALT_ROUNDS=10
   ```

4. **Desplegar**
   - Push a `main` despliega automáticamente

---

## Documentación Adicional

| Documento | Ubicación |
|-----------|------------|
| **Estado del Proyecto** | `/ESTADO.md` |
| **Quickstart** | `/QUICKSTART.md` |
| **Guía Dokploy** | `/DOKPLOY_GUIDE.md` |
| **Backend** | `/backend/README.md` |
| **Frontend** | `/Frontend/README.md` |
| **Informe Técnico** | `/informe-sai.docx` |

---

## Roles del Sistema

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total al sistema |
| **MANAGER** | Gestión de usuarios, documentos, ambientales |
| **USER** | Acceso básico a documentos y métricas |
| **AUDITOR** | Solo lectura para auditorías |

---

## Multi-Tenant

Cada organización tiene:
- Schema aislado en PostgreSQL
- Usuarios propios
- Documentos y datos independientes
- Identificación por:
  - Header: `X-Tenant-ID` (configurable via `DEFAULT_TENANT_HEADER`)
  - Subdominio: `empresa.sai.co`

---

## Licencia

**Confidencial** - SAI 2026  
Elaborado por: Jaider Hernández Cardozo  
Fecha: Abril 2026

---

> ⚠️ **Nota**: El proyecto cuenta con 54 tests automatizados (42 backend + 12 frontend + 14 e2e). Antes de hacer cambios importantes, ejecuta los tests para verificar que no se rompa funcionalidad existente.
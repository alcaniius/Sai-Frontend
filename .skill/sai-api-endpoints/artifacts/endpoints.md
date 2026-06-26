# SAI - API Endpoints

**Base URL**: `http://localhost:3001/api/v1`
**Headers requeridos**: `Authorization: Bearer <token>`, `X-Tenant-ID: <orgId>`

## Auth (Público)

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| POST | `/auth/register` | Registro (siempre rol USER) | `{ email, password, firstName, lastName, organizationId? }` |
| POST | `/auth/login` | Login | `{ email, password }` |
| POST | `/auth/refresh` | Refresh token | `{ refreshToken }` |
| POST | `/auth/logout` | Logout (auth required) | - |

**Respuesta login/register**: `{ user: { id, email, firstName, lastName, role }, accessToken, refreshToken }`

## Users (Auth + RBAC)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/users` | ADMIN, MANAGER | Listar usuarios |
| GET | `/users/:id` | ADMIN, MANAGER | Obtener usuario |
| PATCH | `/users/:id` | ADMIN | Actualizar usuario |
| DELETE | `/users/:id` | ADMIN | Eliminar usuario |

## Documents (Auth + RBAC)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/documents` | USER+ | Crear documento |
| GET | `/documents` | todos auth | Listar documentos |
| GET | `/documents/:id` | todos auth | Ver detalle (incluye versions y approvals) |
| PATCH | `/documents/:id` | MANAGER+ | Actualizar |
| DELETE | `/documents/:id` | ADMIN | Eliminar |
| POST | `/documents/:id/versions` | MANAGER+ | Agregar versión |
| POST | `/documents/:id/approve` | MANAGER+ | Aprobar/Rechazar `{ action: 'APPROVED'|'REJECTED', comment? }` |

## Environmental - Aspects (Auth + RBAC)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/environmental/aspects` | ADMIN, MANAGER | Crear aspecto |
| GET | `/environmental/aspects` | todos auth | Listar aspectos |
| GET | `/environmental/aspects/:id` | todos auth | Ver aspecto |
| PATCH | `/environmental/aspects/:id` | ADMIN, MANAGER | Actualizar |
| DELETE | `/environmental/aspects/:id` | ADMIN | Eliminar |
| POST | `/environmental/aspects/:id/significance` | ADMIN, MANAGER | Recalcular significancia |

## Environmental - PMA (Auth + RBAC)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/environmental/pma` | ADMIN, MANAGER | Crear PMA |
| GET | `/environmental/pma` | todos auth | Listar PMAs |
| POST | `/environmental/pma/:id/generate-pdf` | ADMIN, MANAGER | Encolar generación de PDF (BullMQ) |
| GET | `/environmental/pma/:id/pdf` | todos auth | Obtener URL del PDF generado |

## Environmental - ANLA (Auth + RBAC)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/environmental/anla` | ADMIN, MANAGER | Crear reporte ANLA |
| GET | `/environmental/anla` | todos auth | Listar reportes |
| POST | `/environmental/anla/:id/generate-pdf` | ADMIN, MANAGER | Encolar generación de PDF |
| GET | `/environmental/anla/:id/pdf` | todos auth | Obtener URL del PDF generado |

## Jobs (Auth)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/environmental/jobs/:jobId` | todos auth | Estado del job `{ state, progress }` |

## Health (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |

## Endpoints NO implementados (Fases futuras)

- `/quality/*` — No conformidades, auditorías (Fase 4)
- `/education/*` — Cursos, módulos, enrollments, certificados (Fase 4)
- `/dashboard/*` — Indicadores, alertas, audit logs (Fase 5)
- `/carbon-footprint/*` — Huella de carbono (Fase 2 pendiente)

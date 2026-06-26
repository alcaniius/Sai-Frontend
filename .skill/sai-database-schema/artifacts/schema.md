# SAI - Schema de Base de Datos

**Ubicación**: `backend/prisma/schema.prisma`

## Configuración Prisma v7

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  // SIN url — se usa PrismaPg adapter en runtime
}
```

## Resumen de Modelos

### Módulo: Tenants y Usuarios
| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `Organization` | `organizations` | id, name, subdomain(unique), schema(unique), active |
| `User` | `users` | id, email(unique), password, firstName, lastName, role, organizationId? |
| `RefreshToken` | `refresh_tokens` | id, token(unique), userId, expiresAt |

**Enum `Role`**: `ADMIN`, `MANAGER`, `USER`, `AUDITOR`

### Módulo 1: Gestión Documental
| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `Document` | `documents` | id, title, type, version, status, filePath, fileFormat, fileSize, createdBy, approvedBy? |
| `DocumentVersion` | `document_versions` | id, documentId, version, filePath, changeLog? (unique: documentId+version) |
| `DocumentApproval` | `document_approvals` | id, documentId, userId, action, comment? |

**Enums**: `DocType`(PMA,MATRIX,PROCEDURE,INSTRUCTION,REPORT,CERTIFICATE,OTHER), `DocStatus`(DRAFT,IN_REVIEW,APPROVED,REJECTED,ARCHIVED), `ApprovalAction`(APPROVED,REJECTED,COMMENTED)

### Módulo 2: Ambiental (ISO 14001)
| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `EnvironmentalAspect` | `environmental_aspects` | id, name, impact, probability, significance, jsonData?, active |
| `PMA` | `pma` | id, name, organization, project, startDate, endDate, status, generatedPdf? |
| `CarbonFootprint` | `carbon_footprint` | id, organization, period, co2Emissions, scope1/2/3 |
| `ANLAReport` | `anla_reports` | id, title, reportType, dueDate, status, submittedAt?, filePath? |

**Enums**: `ImpactLevel`(LOW,MEDIUM,HIGH,CRITICAL), `ProbabilityLevel`(LOW,MEDIUM,HIGH,VERY_HIGH), `SignificanceLevel`(INSIGNIFICANT,MODERATE,SIGNIFICANT,CRITICAL), `PMAStatus`(DRAFT,IN_REVIEW,APPROVED,SUBMITTED), `ReportStatus`(PENDING,IN_PREPARATION,SUBMITTED,APPROVED,OVERDUE)

### Módulo 3: Calidad (ISO 9001) — Schema definido, SIN implementación
| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `NonConformity` | `non_conformities` | id, title, severity, source, status, correctiveAction? |
| `Audit` | `audits` | id, title, type, scheduledDate, status, auditor, findings? |

**Enums**: `SeverityLevel`(MINOR,MAJOR,CRITICAL), `NCStatus`(OPEN,IN_PROGRESS,RESOLVED,CLOSED), `AuditType`(INTERNAL,EXTERNAL,CERTIFICATION), `AuditStatus`(PLANNED,IN_PROGRESS,COMPLETED,CANCELLED)

### Módulo 4: Educativo (LMS) — Schema definido, SIN implementación
| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `Course` | `courses` | id, title, category?, duration, active |
| `CourseModule` | `course_modules` | id, courseId, title, content?, order |
| `CourseEnrollment` | `course_enrollments` | id, userId, courseId, progress, completed (unique: userId+courseId) |
| `Certificate` | `certificates` | id, userId, courseId, qrCode(unique), filePath |
| `Question` | `questions` | id, courseId, question, options(Json), correctAnswer |

### Módulo 5: Dashboard y Alertas — Schema definido, SIN implementación
| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `Indicator` | `indicators` | id, name, category, value, target, unit, period |
| `Alert` | `alerts` | id, type, message, priority, read, userId? |
| `AuditLog` | `audit_logs` | id, action, entity, entityId, userId, changes?, ipAddress? |

**Enums**: `AlertType`(DOCUMENT_EXPIRY,REPORT_DUE,NON_CONFORMITY,OVERDUE_TASK,CUSTOM), `PriorityLevel`(LOW,MEDIUM,HIGH,CRITICAL)

## Relaciones Clave
- `Organization` 1→N `User`
- `User` 1→N `RefreshToken`
- `Document` 1→N `DocumentVersion`
- `Document` 1→N `DocumentApproval`
- `Course` 1→N `CourseModule`
- `Course` 1→N `CourseEnrollment`

## Acceso en Código
```typescript
// Prisma naming quirks
this.prisma.user              // User
this.prisma.document          // Document
this.prisma.environmentalAspect  // EnvironmentalAspect
this.prisma.pMA               // PMA (uppercase!)
this.prisma.aNLAReport        // ANLAReport (uppercase!)
this.prisma.carbonFootprint   // CarbonFootprint
this.prisma.nonConformity     // NonConformity
```

> ⚠️ **Cuidado**: Prisma genera nombres camelCase para modelos con mayúsculas: `PMA` → `pMA`, `ANLAReport` → `aNLAReport`

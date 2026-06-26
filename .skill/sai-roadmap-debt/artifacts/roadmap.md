# SAI - Roadmap, Gaps y Deuda Técnica

## Estado Actual por Fase (Abril 19, 2026)

### ✅ Fase 1 — Fundamentos (COMPLETA)
Todo implementado: Auth, RBAC, Multi-tenant, Documents, Security, Tests base.

### 🔄 Fase 2 — Núcleo Ambiental (~70%)

| Feature | Estado | Detalle |
|---------|--------|---------|
| Aspectos ambientales (backend+frontend) | ✅ | CRUD + cálculo de significancia |
| PMAs (backend+frontend) | ✅ | CRUD |
| ANLA Reports (backend+frontend) | ✅ | CRUD |
| PDF async (BullMQ + pdf-lib) | ✅ | PMA + ANLA PDFs con cola |
| Frontend: servicios PDF | ❌ | `services.ts` NO tiene `generatePdf`, `getPdfUrl`, `getJobStatus` |
| Frontend: UI para generar/descargar PDFs | ❌ | No hay botones ni estado de jobs |
| Huella de carbono (FastAPI) | ❌ | Schema existe (`CarbonFootprint`), sin microservicio |
| Alertas ANLA por email (Nodemailer) | ❌ | Sin implementar |
| Plantillas Word (docxtemplater) | ❌ | Sin implementar |

### ⏳ Fase 3 — App Móvil Flutter
- Directorio `app-movil/` existe pero **VACÍO**
- Sin ningún archivo Flutter

### ⏳ Fase 4 — LMS + Calidad (ISO 9001)
- **Schema Prisma definido** para: NonConformity, Audit, Course, CourseModule, CourseEnrollment, Certificate, Question
- **Directorios backend** existen pero **VACÍOS**: `modules/quality/`, `modules/education/`
- **Sin implementación** de controllers, services, DTOs

### ⏳ Fase 5 — Dashboard Real-time
- **Schema Prisma definido** para: Indicator, Alert, AuditLog
- **Directorio backend** existe pero **VACÍO**: `modules/dashboard/`
- Sin WebSockets, sin Elasticsearch

---

## 🔴 Gaps Críticos (Schema vs Implementación)

| Modelo en Prisma | Módulo Backend | ¿Implementado? |
|-----------------|----------------|----------------|
| Organization | auth (parcial) | ⚠️ Solo validación en register |
| User | users | ✅ |
| RefreshToken | auth | ✅ |
| Document | documents | ✅ |
| DocumentVersion | documents | ✅ |
| DocumentApproval | documents | ✅ |
| EnvironmentalAspect | environmental | ✅ |
| PMA | environmental | ✅ |
| CarbonFootprint | — | ❌ Sin servicio |
| ANLAReport | environmental | ✅ |
| **NonConformity** | quality | ❌ **VACÍO** |
| **Audit** | quality | ❌ **VACÍO** |
| **Course** | education | ❌ **VACÍO** |
| **CourseModule** | education | ❌ **VACÍO** |
| **CourseEnrollment** | education | ❌ **VACÍO** |
| **Certificate** | education | ❌ **VACÍO** |
| **Question** | education | ❌ **VACÍO** |
| **Indicator** | dashboard | ❌ **VACÍO** |
| **Alert** | dashboard | ❌ **VACÍO** |
| **AuditLog** | — | ❌ Sin servicio |

---

## 🟡 Deuda Técnica Identificada

### Backend
1. **AutomationModule usa `process.env` directo** en lugar de ConfigService (líneas 14-30 de automation.module.ts)
2. **PdfService usa `process.env` directo** para MINIO_BUCKET_NAME y MINIO_ENDPOINT
3. **Sin tests para controllers** — solo servicios tienen tests
4. **Sin tests para DTOs** — validación no testeada
5. **Sin tests para automation module** — ni service ni processor testeados
6. **Coverage global: 33%** — target debería ser 60%+
7. **Organization CRUD incompleto** — no hay endpoint para crear/listar organizaciones
8. **Frontend `/components/ui/` VACÍO** — sin componentes reutilizables formalizados
9. **Frontend servicios sin tipado** — muchos `data: any` en services.ts
10. **Frontend sin tests de componentes** — solo tests de store/api/services
11. **Sin logging estructurado** — no hay Winston/Pino configurado
12. **Sin Swagger/OpenAPI** — no hay documentación de API auto-generada
13. **AuditLog model definido pero sin middleware** — no se registran acciones
14. **`getPresignedUrl` es fake** — solo concatena strings, no genera URL pre-firmada real

### Frontend
1. **Tema visual básico** — Tailwind CSS configurado pero sin design system formal
2. **Sin error boundaries** — errores no capturados en UI
3. **Sin loading states globales** — depende de cada página individualmente
4. **Tenant ID = user.id** — en api.ts, `X-Tenant-ID` se setea como `state.user?.id` lo cual es incorrecto (debería ser organizationId)

---

## 📋 Prioridades Recomendadas

### Prioridad ALTA (Fase 2 - completar)
1. ✅ ~~PDF generation (BullMQ + pdf-lib)~~ — HECHO
2. 🔴 Frontend: integrar servicios de PDF (generate, download, job status)
3. 🔴 Fix: `X-Tenant-ID` debería ser `organizationId`, no `user.id`
4. 🟡 Fix: AutomationModule → usar ConfigService en lugar de process.env
5. 🟡 Huella de carbono — decidir si FastAPI separado o NestJS integrado

### Prioridad MEDIA (Mejoras)
6. Agregar Swagger (`@nestjs/swagger`) para documentación de API
7. Tests para controllers (al menos auth + environmental)
8. Logging con Winston/Pino
9. Frontend: componentes UI reutilizables (Button, Input, Card, Modal, Table)
10. Fix presigned URL para MinIO (usar S3 SDK real `getSignedUrl`)

### Prioridad BAJA (Fases futuras)
11. Módulo Quality (NonConformity + Audit CRUD)
12. Módulo Education (Course + Enrollment CRUD)
13. Dashboard con WebSockets
14. App Flutter
15. Elasticsearch para búsqueda

---

## 📊 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Modelos Prisma definidos | 20 |
| Modelos con implementación | 9 (45%) |
| Tests backend (unit) | 42 |
| Tests backend (e2e) | 14 |
| Tests frontend | 12 |
| Tests total | 68 |
| Coverage backend global | 33% |
| Coverage servicios | 97-100% |
| Endpoints implementados | ~25 |
| Páginas frontend | 9 |
| Componentes frontend | 5 |

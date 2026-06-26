# Design: Admin User Creation Panel

## Technical Approach

Add an ADMIN-only user creation flow: backend `POST /users` endpoint (creates user, no tokens), two support APIs (`GET /organizations`, `GET /sites?organizationId=`), and a `/dashboard/admin/usuarios` page with cascading org→site selects + user table. Delivered as 3 chained PRs, each ≤400 changed lines.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Organizations endpoint location | New route in `users` module | No org module exists; adding one for a single endpoint over-engineers. If org CRUD grows later, extract then. |
| Site filter query param | `GET /sites?organizationId=` on existing controller | Preserves backward-compatible tenant-scoped behavior when param absent. ADMIN gets cross-org via query. |
| Coherence validation location | `UsersService.create()` (service layer) | Needs DB lookup (`site.organizationId`), not possible in DTO. Matches auth.service.ts pattern (org validation in service, not DTO). |
| Role on create from DTO | DTO `role` field, enum-validated | Admin picks the role. Auth register hardcodes `USER` — this is the divergence point. |
| X-Tenant-ID for admin requests | Selected org id in header | TenantMiddleware gates all /api/*. Admin sets header to chosen org so middleware passes, but service reads `organizationId` from DTO body (not `req.tenant`). |
| api.ts bug fix strategy | Extract tenantId to a separate interceptor param, fix for admin calls, leave non-admin calls unchanged | Backward-compatible. Scope: new admin page sends `orgId` as tenant; existing pages keep current behavior. |

## Data Flow

```
AdminPage ──GET /organizations──→ UsersController ──→ Prisma org findMany ──→ [{id,name,active}]
     │
     │ (admin selects org)
     ├──GET /sites?orgId=──→ SitesController ──→ Prisma site findMany(where:{orgId}) ──→ [{id,name}]
     │
     │ (fills form: email, pwd, name, role, orgId, siteId)
     │
     └──POST /users {orgId,siteId,role,...} ──→ UsersController @Roles(ADMIN)
                    │
                    ▼
              UsersService.create()
               ├─ duplicate email? → 409
               ├─ orgId given? → verify Organization exists
               ├─ siteId given? → verify site.orgId === orgId (coherence)
               ├─ bcrypt.hash(password)
               └─ prisma.user.create(data:{...siteId}) → 201 {user, no tokens}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | Modify | Add `siteId String?` + `site Site?` relation to User model |
| `backend/prisma/migrations/20260626000000_add_user_site_id/` | Create | Migration: ALTER TABLE users ADD site_id FK |
| `backend/src/modules/users/dto/create-user.dto.ts` | Create | class-validator: email, password, firstName, lastName, role (Role enum), organizationId?, siteId? |
| `backend/src/modules/users/dto/update-user.dto.ts` | Modify | Add organizationId?, siteId? fields |
| `backend/src/modules/users/users.service.ts` | Modify | Add create() (bcrypt hash, coherence check, email dup), extend update() with coherence re-validation, add findAll() select extension (include siteId, organizationId) |
| `backend/src/modules/users/users.controller.ts` | Modify | Add @Post() with @Roles(ADMIN), add GET /organizations route |
| `backend/src/modules/sites/sites.controller.ts` | Modify | Add @Query('organizationId') to findAll(), restrict to ADMIN-only when param present |
| `backend/src/modules/sites/sites.service.ts` | Modify | Add optional orgId param to findAll() |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | Modify | Add siteId to select |
| `Frontend/src/lib/navigation.ts` | Modify | Add "Usuarios" entry: `/dashboard/admin/usuarios`, `Users` icon, roles `[ADMIN]` |
| `Frontend/src/lib/api.ts` | Modify | Add createUser(), fetchOrganizations(), fetchSites(orgId); fix X-Tenant-ID bug |
| `Frontend/src/store/authStore.ts` | Modify | Add organizationId to User interface |
| `Frontend/src/app/dashboard/admin/usuarios/page.tsx` | Create | Admin panel: role-guard redirect, UserCreateForm + UserList |
| `backend/src/modules/users/users.service.spec.ts` | Modify | Test create (success, dup email, coherence fail, org not found, bcrypt verify) |
| `backend/src/modules/users/users.controller.spec.ts` | Modify | Test POST 201/400/409, RBAC guards |
| `backend/src/modules/sites/sites.service.spec.ts` | Modify | Test findAll with optional orgId filter |
| `backend/test/users.e2e-spec.ts` | Create | E2E: POST /users with tenant header |
| `Frontend/src/app/dashboard/admin/usuarios/page.test.tsx` | Create | Role redirect, protected route |
| `Frontend/src/lib/api.test.ts` | Modify | Test new API functions |

## Interfaces / Contracts

```typescript
// CreateUserDto (backend, class-validator)
class CreateUserDto {
  @IsEmail()       email: string;
  @MinLength(8)    password: string;
  @IsString()      firstName: string;
  @IsString()      lastName: string;
  @IsEnum(Role)    role: Role;           // ADMIN can set any role
  @IsOptional() @IsUUID() organizationId?: string;
  @IsOptional() @IsUUID() siteId?: string;
}

// POST /users response
{ id, email, firstName, lastName, role, organizationId, siteId, active, createdAt }

// GET /organizations response
[{ id: string, name: string, active: boolean }]
```

```typescript
// Frontend Zod schema (react-hook-form)
const createUserSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  role: z.enum(['ADMIN','MANAGER','USER','AUDITOR'], { message: 'Rol requerido' }),
  organizationId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (backend) | `UsersService.create()` — success path, duplicate email, invalid org, coherence mismatch, bcrypt applied | Jest + mockPrismaService (extend mock with organization, site mocks) |
| Unit (backend) | `UsersController` — POST routes, RBAC guard behavior | Jest + `@nestjs/testing` Test.createTestingModule |
| Unit (backend) | `SitesService.findAll` with optional orgId | Jest + mockPrismaService |
| E2E (backend) | `POST /api/v1/users` — valid create, duplicate email, coherence validation, RBAC 403 | Supertest + seeded test org/site |
| Unit (frontend) | Admin page redirect for non-ADMIN | Vitest + @testing-library/react |
| Unit (frontend) | `UserCreateForm` validation errors, `api.ts` functions | Vitest + jest-dom matchers |

## Migration / Rollout

- **Migration**: `20260626000000_add_user_site_id` — adds nullable `siteId` column + FK. Reversible: drop column + FK.
- **No data migration** — existing users keep `siteId: null`.
- **Rollback per PR**:
  - PR1: `npx prisma migrate reset` (dev) or reverse migration (prod)
  - PR2: remove `@Post()` route from controller
  - PR3: delete `admin/usuarios/page.tsx`, remove nav entry

## Open Questions

None — all design decisions resolved through exploration and spec review.

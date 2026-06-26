# Exploration: admin-user-creation-panel

> Phase: sdd-explore | Mode: hybrid (OpenSpec + Engram) | Strict TDD: active
> Change: Admin-only panel to create users, assigning organization + site (+ role) with an org↔site coherence constraint.

## Current State

### Backend — Users module (`backend/src/modules/users/`)
- `users.controller.ts` — `@Controller('users')` with `@UseGuards(AuthGuard('jwt'), RolesGuard)`.
  - Endpoints: `findAll` (ADMIN/MANAGER), `findOne` (ADMIN/MANAGER), `update` (ADMIN), `remove` (ADMIN).
  - **No `create` endpoint exists.** This is the gap we fill.
  - Does **not** use `@CurrentTenant()` — ignores tenant context entirely (returns ALL users, no org scoping). Known issue: "No resource ownership filter".
- `users.service.ts` — `findAll/findOne/update/remove` using `PrismaService` directly.
  - `findAll` selects `id, email, firstName, lastName, role, active, createdAt` — **no `organizationId`, no `siteId`**. The admin list view cannot today show which org/site a user belongs to.
  - `update` passes `updateUserDto` straight to `prisma.user.update` (no org/site coherence validation).
  - **No `create` method.**
- `dto/update-user.dto.ts` — uses **class-validator** (`@IsString`, `@IsEnum(Role)`, `@IsBoolean`), NOT Zod. Backend DTO convention = class-validator.
- `users.service.spec.ts` — unit tests using `mockPrismaService` from `prisma.service.mock.ts`, `jest.clearAllMocks()` in `beforeEach`, `Test.createTestingModule` with service + mocked Prisma.
- `users.module.ts` — providers `[UsersService]`, exports `[UsersService]`.

### Backend — Auth register flow (`backend/src/modules/auth/`)
- `auth.service.ts` `register()` is the closest existing analogue to admin-create:
  - Checks email uniqueness → `BadRequestException('Email already registered')`.
  - Validates optional `organizationId` exists + active → else `BadRequestException('Invalid organization')`.
  - `bcrypt.hash(password, BCRYPT_SALT_ROUNDS)` from `ConfigService`.
  - **Hardcodes `role: 'USER'`** — admin-create must instead accept the role from the DTO.
  - Returns `{ user: {id,email,firstName,lastName,role}, ...tokens }` — issues JWT tokens. Admin-create likely should NOT auto-login the new user (returns created user only, no tokens).
- `dto/register.dto.ts` — `@IsEmail`, `@IsString @MinLength(8)` password, optional `organizationId`. **No `role`, no `siteId`.**
- `strategies/jwt.strategy.ts` `validate()` selects `id,email,firstName,lastName,role,active,organizationId` — **no `siteId`** (field doesn't exist yet). After schema change, add `siteId: true` so `req.user` carries it. JWT payload itself is `{ sub: userId }` only (DB hit per request — role/org/site come from DB, not token).
- `auth.controller.ts` — register is `@Public()`. Admin-create is the opposite: strictly `@Roles(Role.ADMIN)` + JWT-guarded.

### Backend — Sites module (`backend/src/modules/sites/`)
- `sites.controller.ts` — uses `@CurrentTenant() tenant: Organization` and passes `tenant.id` as the organizationId for **every** method. `findAll(tenant.id)` / `findAllActive(tenant.id)`.
- `sites.service.ts` `findAll(organizationId)` filters `where: { organizationId }`. **There is no way to list sites for an ARBITRARY org** — only the header-resolved tenant. For the admin panel (pick org X → list sites of X) we need either a `?organizationId=` query param on a new/existing route, or a dedicated admin endpoint. This is a **GAP**.
- `create-site.dto.ts` — class-validator (`@IsString @MinLength(2)`).

### Backend — Tenant middleware (CRITICAL ARCHITECTURAL TENSION)
- `common/middleware/tenant.middleware.ts` runs on **ALL** `/api/*` routes (configured in `app.module.ts` `forRoutes({ path: 'api/*', method: ALL })`).
- It REQUIRES a tenant identifier (`X-Tenant-ID` header or host subdomain), resolves it to an `Organization` via `organization.findFirst({ where: { OR: [{ subdomain }, { id }] } })`, and attaches it as `req['tenant']`.
- Routes under `/api/v1/auth` and `/api/v1/health` are exempt (no tenant needed).
- `@CurrentTenant()` reads `req['tenant']`.
- **Frontend `api.ts` sets `X-Tenant-ID` to `state.user?.id` (the USER's UUID, not an org id)** — this looks like a pre-existing bug: the middleware tries `organization.findFirst({ id: <userId> })`, which fails for any real user → likely 403 on tenant-scoped endpoints. Worth flagging but out of scope to fix here unless the admin flow depends on it.
- **Impact on admin-create**: the users controller does NOT use `@CurrentTenant`, but the middleware STILL requires a valid tenant header to even reach `/api/v1/users`. So the admin must send some valid org id in `X-Tenant-ID` to get past the middleware, even though the users service ignores it. This forces an architecture decision (see Approaches).

### Backend — How the acting user is obtained
- No `@CurrentUser()` decorator exists. Pattern (from `documents.controller.ts`): `@Request() req` → `req.user.id` / `req.user`. JWT strategy attaches the full user object to `request.user`.

### Backend — Organizations
- **No `organizations` module exists** (no controller/service/DTO). There is **no endpoint to list organizations**. The admin panel needs to let the admin pick an org from a dropdown — this is a **GAP** (either add an org-list endpoint, or fall back to typing a UUID like the current register form does).

### Prisma schema (`backend/prisma/schema.prisma`)
- `model User` — has `organizationId String?` + `organization Organization? @relation(... onDelete: Cascade)`. **No `siteId`, no `site` relation.**
- `model Site` — `id, name, code @unique, address?, municipality?, active, organizationId String?, ...` with relations to waste/inspection/certificate. **No relation back to User.**
- `enum Role { ADMIN, MANAGER, USER, AUDITOR }` — unchanged.
- `Organization` — `id, name, subdomain @unique, schema @unique, active` + `users User[]`.
- **Migrations exist** under `backend/prisma/migrations/` (3 migrations: `20260415004514_init`, `20260625000000_add_organization_id_to_tenant_models`, `20260625000001_make_document_file_fields_nullable`). Naming convention: `YYYYMMDDHHMMSS_description`. Adding `User.siteId` requires a **new migration** (e.g. `20260626000000_add_site_id_to_user`) via `prisma migrate dev`. `@prisma/adapter-pg` + `PrismaPg` adapter is in use (NOT url in schema).

### Backend test conventions
- **Unit**: `*.spec.ts` colocated; `mockPrismaService` from `prisma.service.mock.ts` (already has `user.{findUnique,findMany,create,update,delete}`, `site.{findUnique,findFirst,findMany,...}`, `organization.{findUnique,findFirst}` — **note: `organization.findMany` is NOT in the mock**; must be added if we add an org-list service). `jest.clearAllMocks()` in `beforeEach`.
- **E2E**: `backend/test/*.e2e-spec.ts` with supertest + real `AppModule`. `ValidationPipe({ whitelist:true, forbidNonWhitelisted:true, transform:true })`, `setGlobalPrefix('api/v1')`, helmet, CORS. RBAC e2e logs in via `/auth/login` then sets `Authorization: Bearer <token>`.
- **E2E tenant-header gotcha**: existing e2e tests do NOT set `X-Tenant-ID`. The middleware would reject non-auth routes with 400/403, yet tests expect 401/403/200 — indicating the e2e suite depends on DB seeding/subdomain resolution and may be fragile. **New admin-create e2e tests MUST send a valid `X-Tenant-ID` header pointing to a seeded org** (or the chosen approach must exempt `/api/v1/users` from the middleware). This is a concrete TDD planning constraint.

### Frontend
- Next.js 16 App Router under `Frontend/src/app/`. Route groups: `(auth)` for login/register, `dashboard/*` for the authenticated area.
- `lib/api.ts` — axios instance; request interceptor adds `Authorization: Bearer` from `authStore` and sets `X-Tenant-ID` to `state.user?.id` (the buggy header noted above). Response interceptor handles 401 → refresh token → retry, else logout + redirect `/login`.
- `lib/services.ts` — service objects per domain. `authService`, `documentsService`, `sitesService.getAll()`, `alertsService`, `environmentalService`, etc. **No `usersService` exists.** `sitesService` has only `getAll()` (no by-org method). `Site` interface has no `organizationId`.
- `store/authStore.ts` — Zustand + persist. `User` interface = `{ id, email, firstName, lastName, role }` — **no `organizationId`, no `siteId`**.
- **No admin route exists** — no `Frontend/src/app/admin/`, no `dashboard/admin/`. The panel will be new (likely `dashboard/admin/users/`).
- `dashboard/layout.tsx` — client component, guards auth (`isInitialized && !isAuthenticated` → push `/login`), renders sidebar from `lib/navigation.ts` filtered by role via `filterNavigationByRole`. **Role-based nav already exists** — we add an "Usuarios" / "Admin" item scoped to `[Role.ADMIN]`.
- `lib/navigation.ts` — `Role` enum (USER/MANAGER/ADMIN/AUDITOR) mirrors backend; `NavigationItem { name, href, icon, roles[] }`; `filterNavigationByRole`. The new admin nav entry goes here.
- **Form pattern** (`register/page.tsx`, `AspectForm.tsx`, `DocumentModal.tsx`): `useForm` from `react-hook-form`; `zodResolver(schema) as any` (with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`); `z.object({...})`; **`z.enum([...], { message: 'Required' })`** for selects (Zod v4 convention confirmed); `<select {...register('field')}>` with `<option>`; error display `{errors.field && <p className="mt-1 text-sm text-red-600">{errors.field.message}</p>}`; `defaultValues`; `isLoading` for submit button; Tailwind utility classes; Spanish UI labels.
- `Frontend/AGENTS.md`: Next.js 16 has breaking changes — read `node_modules/next/dist/docs/` before writing frontend code. Heed deprecation notices.

## Affected Areas (files that will be touched)

### Backend — NEW
- `backend/prisma/migrations/<new>/migration.sql` — add `siteId` column + FK to `users`.
- `backend/src/modules/users/dto/create-user.dto.ts` — **new** DTO (class-validator): email, password, firstName, lastName, role (`@IsEnum(Role)`), organizationId?, siteId?.
- `backend/src/modules/users/dto/update-user.dto.ts` — **extend** with optional `organizationId?`, `siteId?` (so reassignment of branch is possible per requirement #2).
- (Possibly) `backend/src/modules/organizations/` — **new module** with a list endpoint (ADMIN) if we choose dropdown UX. **Open decision.**
- (Possibly) `backend/test/users.e2e-spec.ts` or extension of `rbac.e2e-spec.ts` — e2e for create + coherence + RBAC.

### Backend — MODIFY
- `backend/prisma/schema.prisma` — add `siteId String?` + `site Site? @relation(fields:[siteId], references:[id])` on `User`; add `users User[]` back-relation on `Site`.
- `backend/src/modules/users/users.service.ts` — add `create()` (email-unique check, bcrypt hash, optional org validation, **site↔org coherence validation**, role from DTO); extend `findAll` select to include `organizationId, siteId` (+ optionally `include: { organization, site }` for names); extend `update` to validate coherence when org/site change.
- `backend/src/modules/users/users.controller.ts` — add `@Post() @Roles(Role.ADMIN) create(@Body() dto, @Request() req)`.
- `backend/src/modules/auth/strategies/jwt.strategy.ts` — add `siteId: true` to the `select` (so `req.user.siteId` is available).
- `backend/src/common/database/prisma.service.mock.ts` — add `organization.findMany` (and any new model fns) if org-listing is added; ensure `site.findUnique/findFirst` mocks cover coherence checks.
- `backend/src/modules/sites/sites.controller.ts` / `sites.service.ts` — add a way to list sites by arbitrary org (e.g. `@Get()` accepts `?organizationId=` query) for the admin dropdown. **Open decision.**
- `backend/src/modules/users/users.module.ts` — likely needs `ConfigModule`/`JwtService` access IF create issues tokens (recommended: do NOT issue tokens; then no extra providers). May need to import `SitesService`/`OrganizationsService` for coherence checks (or do checks inline via Prisma).

### Frontend — NEW
- `Frontend/src/app/dashboard/admin/users/page.tsx` — list + "Crear usuario" entry (ADMIN only).
- `Frontend/src/app/dashboard/admin/users/new/page.tsx` — creation form (org select → site select cascade, role select, password).
- (Possibly) `Frontend/src/components/admin/UserForm.tsx` — reusable form component.
- (Possibly) `Frontend/src/components/admin/UsersTable.tsx` — list table.
- `Frontend/src/lib/services.ts` — add `usersService` (`create`, `getAll`), extend `sitesService` (`getByOrganization`), add `organizationsService.getAll` (if backend exposes it).
- Frontend tests (vitest) for the form/service per Strict TDD.

### Frontend — MODIFY
- `Frontend/src/store/authStore.ts` — extend `User` interface with `organizationId?`, `siteId?` (so login response + admin context carry them).
- `Frontend/src/lib/navigation.ts` — add admin "Usuarios" nav item scoped to `[Role.ADMIN]`.
- `Frontend/src/lib/api.ts` — **possibly** adjust `X-Tenant-ID` handling for the admin flow (depends on architecture decision). The current `state.user?.id` value is buggy regardless.
- `Frontend/src/app/dashboard/layout.tsx` — no change needed (nav already role-filtered) unless we add a distinct admin section styling.

## Approaches

### 1. Tenant-bound admin (single-org context)
Admin operates within the `X-Tenant-ID` org context. Org selector is fixed to the header tenant; admin creates users only in their own org.
- Pros: Minimal backend change; reuses `@CurrentTenant`; preserves tenant isolation model.
- Cons: A platform ADMIN (no org, or overseeing many orgs) cannot create users across orgs; doesn't match "admin assigns org + site" requirement when admin spans orgs.
- Effort: Low–Medium.

### 2. Cross-org admin via body `organizationId` + valid tenant header (RECOMMENDED)
Create endpoint reads `organizationId`/`siteId` from the **DTO body** (validated for existence + coherence), independent of the header tenant. The header tenant is only the middleware's access ticket. Frontend sets `X-Tenant-ID` to the **selected org id** (not `user.id`) for admin requests, so the middleware resolves the chosen org and the sites-by-org query works naturally.
- Pros: Admin can create users in any active org; coherence validated server-side; aligns with requirement (admin picks org + site + role); sites dropdown can reuse `sitesService` scoped to selected org.
- Cons: Requires frontend to dynamically set `X-Tenant-ID` per admin request (changes `api.ts` interceptor behavior for admin flows) OR a per-request header override; must fix/override the buggy `state.user?.id` header. Middleware still gates access (admin must send a valid org id).
- Effort: Medium.

### 3. Exempt `/api/v1/users` from TenantMiddleware
Add `users` to the middleware's exempt paths (like auth/health) so the admin endpoint needs no tenant header; org/site come purely from the DTO.
- Pros: Cleanest for a platform-admin model; no header gymnastics; e2e tests simpler (no tenant header needed).
- Cons: Breaks the uniform tenant-gate invariant; existing users endpoints would also lose tenant gating (security review needed); diverges from the rest of the codebase's tenant model; larger blast radius.
- Effort: Medium (small code, bigger review surface).

## Recommendation

**Approach 2** (cross-org admin via body `organizationId` + valid tenant header), combined with:
- Add a minimal **organizations list endpoint** (ADMIN-only) so the admin picks an org from a dropdown instead of typing a UUID. (If the proposal wants to minimize scope, fallback: admin types the org UUID — but dropdown is the right UX and removes the org-listing GAP.)
- Extend `sites` listing to accept `?organizationId=` so the site dropdown cascades from the chosen org.
- `create()` does **NOT** issue JWT tokens (returns the created user object only) — admin-create ≠ self-registration.
- Server-side coherence validation: if `siteId` provided → `site.organizationId` MUST equal the user's `organizationId` (both non-null and equal). If `organizationId` is null → `siteId` MUST be null. Reject mismatches with `BadRequestException`.
- Add `siteId` to the JWT strategy `select` and to `authStore.User`.

This satisfies all four confirmed decisions and keeps the tenant model intact while enabling cross-org admin creation.

## Risks & Edge Cases

- **Org↔site coherence**: enforce server-side; client cascade is convenience, not security. A site with `organizationId = null` can NEVER be assigned (since equality with a non-null user org fails). A user with `organizationId = null` CANNOT have a `siteId` (reject). Both null = platform/admin user (allowed).
- **Admin with no org/site**: a platform ADMIN (`organizationId` null, `siteId` null) must still be able to create users. Under Approach 2, the admin sends the *target* org in `X-Tenant-ID` (not their own), so a no-org admin is fine.
- **TenantMiddleware header value**: `api.ts` currently sets `X-Tenant-ID = state.user?.id` (user UUID). This is almost certainly broken for tenant-scoped endpoints and must be addressed for the admin flow (set to selected org id). This is a pre-existing bug; fixing it is in-scope for the admin flow but must not regress other endpoints — verify with tests.
- **E2E test fragility**: existing e2e tests don't set `X-Tenant-ID` and rely on DB/subdomain behavior. New admin-create e2e MUST explicitly set `X-Tenant-ID` to a seeded org (Approach 2) — otherwise 400/403 before reaching the controller. Confirm the e2e DB has a seeded org + admin user.
- **`findAll` currently unscoped**: returns ALL users across orgs. The admin list will show everyone (acceptable for ADMIN; but if we later scope by tenant, MANAGER's `findAll` would need scoping — out of scope here, but note it).
- **Password handling**: admin sets an initial password (bcrypt-hashed, `MinLength(8)` matching register). Consider a future "force password reset on first login" — out of scope now; flag for proposal.
- **Role escalation**: only ADMIN can create; ADMIN can create another ADMIN — acceptable per requirement, but worth an explicit spec scenario.
- **`update` coherence**: reassigning a user's org/site via update must re-validate coherence (otherwise a MANAGER... no, update is ADMIN-only — still validate).
- **Prisma v7 migration**: use `prisma migrate dev` (NOT `db push`) given the existing migration history; ensure `@prisma/adapter-pg` config unaffected. Migration must be reversible (archive rule).
- **Next.js 16**: read `node_modules/next/dist/docs/` before writing the admin pages (per `Frontend/AGENTS.md`).
- **`multer` build break** (noted in config) is unrelated to this change — don't touch file-upload controllers.
- **400-line review budget**: this change spans schema migration + backend (service/controller/DTO/tests) + frontend (pages/form/service/store/nav/tests). Likely **Medium–High** risk of exceeding 400 lines → `sdd-tasks` should forecast and likely recommend **chained PRs** (e.g. PR1: schema migration + backend create endpoint + tests; PR2: organizations/sites-by-org endpoints; PR3: frontend panel + tests).

## Open Points for Proposal Phase

1. **Organizations list endpoint**: add a new `organizations` module (ADMIN-only `findAll`) for the dropdown, or keep UUID-typing for v1? (Recommend: add the endpoint.)
2. **Sites-by-org**: add `?organizationId=` query to `sites` `findAll`/`findAllActive` (ADMIN), or a dedicated admin route? (Recommend: query param on existing route, ADMIN-allowed.)
3. **`X-Tenant-ID` header strategy**: fix `api.ts` to send the selected org id for admin requests (per-request override), vs. a global fix. Confirm no regression on non-admin requests.
4. **`create()` response shape**: return created user only (no tokens) — confirm. Should it include `organization`/`site` names?
5. **`findAll` display fields**: extend select to include `organizationId, siteId` (and `include` org/site names) for the admin table — confirm scope.
6. **Initial password policy**: admin sets password (min 8) now; add force-reset flag later? Confirm v1 = admin-set password.
7. **Update reassignment scope**: requirement #2 says admin reassigns via update endpoint — confirm `update-user.dto` gains `organizationId?`/`siteId?` + coherence re-validation in this same change.
8. **Chained PR plan**: confirm delivery strategy (`ask-on-risk` default per config) and whether to slice into 3 PRs.

## Ready for Proposal

**Yes.** Confirmed decisions (ADMIN-only creation, add `User.siteId`, org↔site coherence, unchanged Role enum, admin picks role) are sufficient to write the proposal. The architecture decision (Approach 2 vs 1 vs 3) and the org-listing/sites-by-org gaps should be resolved in `sdd-propose` — recommend Approach 2 + add org-list + sites-by-org query.

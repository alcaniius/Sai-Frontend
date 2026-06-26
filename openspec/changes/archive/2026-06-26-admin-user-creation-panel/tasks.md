# Tasks: Admin User Creation Panel

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR1: ~150, PR2: ~250, PR3: ~200 — total ~600 |
| 400-line budget risk | Medium (per-PR safe; total exceeds) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 (stacked-to-main) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|-----|-------|
| 1 | Schema + Support APIs | PR 1 | Base: main |
| 2 | User Creation Backend | PR 2 | Base: main after PR1 merge |
| 3 | Frontend Admin Panel | PR 3 | Base: main after PR2 merge |

## PR 1: Schema + Support APIs

- [x] T-01 [PR1] **TEST**: `sites.service.spec.ts` (NEW) — test `findAll(orgId?)`: with param→filtered, without→all. Test when orgId provided. RED.
- [x] T-02 [PR1] **MIGRATION**: `schema.prisma` — add `siteId String?` + `site Site?` relation to User; add `users User[]` to Site. Run `prisma migrate dev --name add_user_site_id`. Extend `prisma.service.mock.ts` with `organization.findMany`.
- [x] T-03 [PR1] **CODE**: `sites.service.ts` — add optional `orgId?: string` param to `findAll()`; `where: orgId ? { organizationId: orgId } : { organizationId: tenantOrgId }`. `sites.controller.ts` — accept `@Query('organizationId')` in `findAll()`, restrict to ADMIN when present. GREEN.
- [x] T-04 [PR1] **CODE**: `users.controller.ts` — add `@Get('organizations')` + `@Roles(ADMIN)` returning `[{id, name, active}]` from `prisma.organization.findMany()`. Inject PrismaService or add service helper.
- [x] T-05 [PR1] **CODE**: `jwt.strategy.ts` — add `siteId: true` to select. Run `prisma generate`.
  - **Acceptance**: `npx jest --testPathPattern="sites.service.spec"`

## PR 2: User Creation Backend

- [x] T-06 [PR2] **TEST**: `users.service.spec.ts` — add tests for `create()`: success, dup email→409, invalid org→400, site/org mismatch→400, null org+non-null site→400, bcrypt applied. Extend mock with `organization.findUnique`, `site.findUnique`. RED.
- [x] T-07 [PR2] **DTO**: `create-user.dto.ts` (NEW) — class-validator: `@IsEmail email`, `@MinLength(8) password`, `@IsString firstName/lastName`, `@IsEnum(Role) role`, `@IsOptional @IsUUID orgId?/siteId?`.
- [x] T-08 [PR2] **CODE**: `users.service.ts` — implement `create(dto)`: email dup→409; validate org exists if provided; coherence: `site.orgId === dto.orgId`; `bcrypt.hash(password, 10)`; `prisma.user.create({data:{...dto, password:hash, active:true}})`. GREEN.
- [x] T-09 [PR2] **TEST**: `users.controller.spec.ts` (NEW) — test POST /users: 201 valid, 400 invalid/coherence, 409 dup, 403 non-ADMIN roles. Mock UsersService. RED.
- [x] T-10 [PR2] **CODE**: `users.controller.ts` — add `@Post()` + `@Roles(ADMIN)`; import `Post, Body`. GREEN.
- [x] T-11 [PR2] **CODE**: `update-user.dto.ts` — add `@IsOptional @IsUUID orgId?/siteId?`. `users.service.ts update()` — on org/site change, re-validate coherence (fetch existing, merge, check). Add `organizationId`, `siteId` to select returns.
- [x] T-12 [PR2] **E2E**: `backend/test/users.e2e-spec.ts` (NEW) — POST /users: valid→201, dup→409, mismatch→400, MANAGER→403. Seed org+site+admin in beforeAll. Set X-Tenant-ID header.
  - **Acceptance**: `npx jest --testPathPattern="users.service.spec|users.controller.spec|users.e2e"`

## PR 3: Frontend Admin Panel

- [x] T-13 [PR3] **TEST**: `page.test.tsx` (NEW) — redirect: non-ADMIN→/dashboard, unauthenticated→/login. Vitest + @testing-library/react. RED.
- [x] T-14 [PR3] **CODE**: `api.ts` — add `createUser(dto)`, `fetchOrganizations()`, `fetchSitesByOrg(orgId)`. Fix X-Tenant-ID: extract `tenantId` from `state.user?.organizationId` OR allow per-request override via config param.
- [x] T-15 [PR3] **CODE**: `authStore.ts` — add `organizationId?: string` to User interface.
- [x] T-16 [PR3] **CODE**: `navigation.ts` — add `{name:'Usuarios',href:'/dashboard/admin/usuarios',icon:Users,roles:[ADMIN]}`. Import `Users` from lucide-react.
- [x] T-17 [PR3] **CODE**: `/dashboard/admin/usuarios/page.tsx` (NEW) — role-guard redirect, UserCreateForm (react-hook-form+Zod v4: email/pwd/name/role/orgId→cascade siteId), UserList table (email, name, role, org, site, active). Submit→refresh+reset.
- [x] T-18 [PR3] **TEST**: `api.test.ts` — add tests for `createUser`, `fetchOrganizations`, `fetchSitesByOrg`, tenant header fix. GREEN.
  - **Acceptance**: `cd Frontend && npx vitest run`

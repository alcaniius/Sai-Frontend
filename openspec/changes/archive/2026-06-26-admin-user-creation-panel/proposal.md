# Proposal: Admin User Creation Panel

## Intent

ADMIN users cannot create users today — the `users` module has CRUD but no Create endpoint, the frontend has no admin panel, and `User` lacks a `siteId` field for branch assignment. This change fills all three gaps with org↔site coherence enforcement.

## Scope

### In Scope
- Schema migration: `User.siteId?` → `Site`, back-relation `Site.users`
- Backend: `POST /users` (ADMIN), `GET /organizations` (ADMIN), `GET /sites?organizationId=` filter
- Backend: extend `UpdateUserDto` with `organizationId?`/`siteId?` + coherence re-validation
- Frontend: admin panel at `/dashboard/admin/users` — create form + user list + nav entry
- Fix `api.ts` `X-Tenant-ID` header for admin requests (set to chosen org, not user.id)
- Strict TDD: tests before every implementation file

### Out of Scope
- First-login password change / force-reset flow
- Multi-site simultaneous assignment
- Organization CRUD (read-only list only)
- Tenant-scoping existing users endpoints (pre-existing gap)

## Capabilities

### New Capabilities
- `admin-user-creation`: Backend ADMIN-only `POST /users` with `CreateUserDto` (email, password≥8, firstName, lastName, role, orgId?, siteId?), email-unique check, bcrypt hash, and org↔site coherence: `site.organizationId === user.organizationId` (both null allowed; mismatch rejected 400). No JWT tokens returned.
- `organization-listing`: Minimal ADMIN-only `GET /organizations` → `[{id, name}]`.
- `site-filter-by-org`: Extend `GET /sites` with optional `?organizationId=` for cascade dropdown.
- `admin-user-panel`: Frontend page `/dashboard/admin/users` — create form (react-hook-form + Zod v4) with cascading org→site selects, role select, password field. User list table. `filterNavigationByRole` entry scoped to `[ADMIN]`.

### Modified Capabilities
- `tenant-isolation`: Admin user creation exempt from tenant-stamping — `organizationId` comes from DTO body (Approach 2), not tenant context. Document exemption in spec.

## Approach

3 chained PRs (autonomous scopes, each ≤400 lines):

| PR | Scope | Key Deliverables |
|----|-------|-----------------|
| 1 | Schema + Support APIs | Prisma migration (`User.siteId`), `organizations` module, `sites.findAll(?organizationId=)`, unit tests |
| 2 | Create + Update endpoints | `CreateUserDto`, `users.service.create()`, `users.controller.post()`, `UpdateUserDto` extension, unit + e2e tests |
| 3 | Frontend admin UI | `/dashboard/admin/users` + `/new` pages, `usersService`/`organizationsService` in `services.ts`, `api.ts` header fix, vitest tests |

Coherence rule: `siteId` provided → both non-null and `site.orgId === user.orgId`. `siteId` null → `orgId` may be null (platform user) or set (org user, no branch). Server-enforced, not client-only.

## Risks

| Risk | Mitigation |
|------|------------|
| TenantMiddleware blocks `/users` without valid org header | Admin sends chosen org as `X-Tenant-ID`; documented in API spec |
| `api.ts` sets `X-Tenant-ID = user.id` (bug) | Fix per-request override for admin; verify non-admin regression |
| Coherence edge cases (site without org, null cascade) | Exhaustive unit tests for null/null, non-null/match, non-null/mismatch |
| E2E needs seeded org + admin user | Seed in `beforeAll`; set `X-Tenant-ID` explicitly |
| Review budget >400 lines | Chained PRs; autonomous scope per slice |

## Rollback Plan

- PR 1: revert migration (`prisma migrate dev --name rollback_site_id`), drop `organizations` module, remove `?organizationId=` from sites
- PR 2: remove `POST /users` route, revert `CreateUserDto`, restore `UpdateUserDto` to prior shape
- PR 3: delete `/dashboard/admin/` route group, remove nav entry, revert `api.ts` changes

## Dependencies

None. Self-contained change.

## Success Criteria

- [ ] `POST /users` with orgId + siteId + role → 201, user visible in `GET /users`
- [ ] NON-ADMIN → 403 on `POST /users`
- [ ] Coherence rejects: site.orgId ≠ user.orgId → 400; null org + non-null site → 400
- [ ] `GET /organizations` → `[{id, name}]` for ADMIN; 403 for others
- [ ] `GET /sites?organizationId=X` → filtered sites; without param → all (ADMIN)
- [ ] Frontend: cascading selects work, submit creates user, list refreshes
- [ ] Update reassignment re-validates coherence on org/site change
- [ ] All backend tests pass (unit + e2e); all frontend tests pass (vitest)

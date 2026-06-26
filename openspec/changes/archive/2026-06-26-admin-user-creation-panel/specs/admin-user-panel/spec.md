# admin-user-panel Specification

## Purpose

Frontend page `/dashboard/admin/users` — create-user form with cascading org→site selects and user list table. Protected for ADMIN only.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | Route `/dashboard/admin/users` MUST redirect non-ADMIN → `/dashboard`, unauthenticated → `/login` | MUST |
| R2 | Sidebar MUST show "Usuarios" nav entry only for `Role.ADMIN` | MUST |
| R3 | Form fields: email, password, firstName, lastName, role (select), organization (dropdown from `GET /organizations`), site (cascading from `GET /sites?organizationId=`) | MUST |
| R4 | Submit MUST call `POST /users`; on `201` refresh user list and reset form | MUST |
| R5 | Table MUST list users from `GET /users` with columns: email, firstName, lastName, role, org name, site name, active status | MUST |
| R6 | Admin API requests MUST set `X-Tenant-ID` to selected org id; non-admin requests MUST retain existing header behavior | MUST |
| R7 | Form MUST validate client-side (Zod v4 + react-hook-form) before submit | MUST |

### R1–R2: Route Protection & Navigation

**Scenario: ADMIN accesses page**
- GIVEN authenticated ADMIN
- WHEN navigate to `/dashboard/admin/users`
- THEN page renders; sidebar shows "Usuarios" link

**Scenario: USER redirected → /dashboard**
- GIVEN authenticated USER
- WHEN navigate to `/dashboard/admin/users`
- THEN redirected to `/dashboard`; no "Usuarios" in sidebar

**Scenario: Unauthenticated redirected → /login**
- GIVEN no session
- WHEN navigate to `/dashboard/admin/users`
- THEN redirected to `/login`

### R3–R4, R7: Create Form

**Scenario: Cascade org→site dropdown**
- GIVEN admin selects org `O1`
- WHEN site dropdown fetches
- THEN only `O1`'s sites appear

**Scenario: Successful submit refreshes list**
- GIVEN admin fills form and submits
- WHEN `POST /users` → `201`
- THEN user list refreshes with new row; form resets

**Scenario: Client-side validation blocks empty email**
- GIVEN admin leaves email blank and submits
- THEN inline error on email field; no HTTP request sent

### R5: User Table

**Scenario: Table renders users**
- GIVEN users exist
- WHEN page loads
- THEN each row shows email, name, role, org name, site name, active indicator

### R6: Tenant Header

**Scenario: Admin request sends org as tenant**
- GIVEN admin selected org `O1`
- WHEN `POST /users` or `GET /users` called from admin panel
- THEN `X-Tenant-ID` header === `O1`

**Scenario: Non-admin request unchanged**
- GIVEN non-admin user navigates
- WHEN any API call made from non-admin page
- THEN `X-Tenant-ID` behavior is unchanged (no regression)

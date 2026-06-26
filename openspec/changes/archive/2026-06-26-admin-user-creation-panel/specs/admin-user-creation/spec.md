# admin-user-creation Specification

## Purpose

ADMIN creates users via `POST /users` with role, org, and site assignment. Enforces email uniqueness, bcrypt hashing, org↔site coherence, and RBAC.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | `POST /users` restricted to `Role.ADMIN` | MUST |
| R2 | `CreateUserDto` validates: email (valid), password (≥8 chars), firstName, lastName, role (Role enum), organizationId? (UUID), siteId? (UUID) | MUST |
| R3 | Reject duplicate email → `409 Conflict` | MUST |
| R4 | When `organizationId` provided, it MUST reference an active Organization → else `400` | MUST |
| R5 | Org↔site coherence: `siteId` provided → `site.organizationId === organizationId`; `organizationId` null → `siteId` MUST be null. Mismatch → `400` | MUST |
| R6 | Role MUST come from DTO, not hardcoded | MUST |
| R7 | Password MUST be bcrypt-hashed; plaintext MUST NOT leak in response/logs | MUST |
| R8 | Created user defaults to `active: true` | MUST |
| R9 | Response returns user object `{id, email, firstName, lastName, role, organizationId, siteId, active}` — no JWT tokens | MUST |
| R10 | `UpdateUserDto` extended with `organizationId?`/`siteId?`; coherence re-validated on update | MUST |

### R1: ADMIN-Only

**Scenario: ADMIN creates user → 201**
- GIVEN authenticated ADMIN
- WHEN `POST /users` with valid body
- THEN `201 Created` with user object, no tokens

**Scenario: MANAGER → 403**
- GIVEN authenticated MANAGER
- WHEN `POST /users`
- THEN `403 Forbidden`

### R2–R3: Validation & Uniqueness

**Scenario: Invalid email → 400**
- GIVEN authenticated ADMIN
- WHEN `POST /users` with `email: "bad-email"`
- THEN `400 Bad Request`

**Scenario: Duplicate email → 409**
- GIVEN `existing@test.com` exists
- WHEN `POST /users` with same email
- THEN `409 Conflict`

### R4–R5: Coherence

**Scenario: Both null → 201 (platform admin)**
- GIVEN authenticated ADMIN
- WHEN `POST /users` with no `organizationId`, no `siteId`
- THEN `201 Created`

**Scenario: Matching org+site → 201**
- GIVEN org `O1`, site `S1` where `S1.organizationId === O1`
- WHEN `POST /users` with `{organizationId: O1, siteId: S1}`
- THEN `201 Created`

**Scenario: Mismatch → 400**
- GIVEN site `S2` belongs to org `O2`
- WHEN `POST /users` with `{organizationId: O1, siteId: S2}`
- THEN `400 Bad Request`

**Scenario: Null org + non-null site → 400**
- GIVEN authenticated ADMIN
- WHEN `POST /users` with `{siteId: S1}`, no `organizationId`
- THEN `400 Bad Request`

### R6–R9: Behavior

**Scenario: ADMIN creates another ADMIN**
- WHEN `POST /users` with `role: ADMIN`
- THEN created user has `role: ADMIN`

**Scenario: Password is bcrypt**
- GIVEN user created with `password: "secure123"`
- THEN DB stores bcrypt hash (starts `$2b$`), not plaintext

### R10: Update Coherence

**Scenario: Update re-validates coherence**
- GIVEN user `U1` with `{organizationId: O1, siteId: S1}`
- WHEN `PATCH /users/U1` changes `siteId` to `S2` (belongs to `O2`)
- THEN `400 Bad Request`, user unchanged

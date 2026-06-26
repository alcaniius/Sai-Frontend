# Delta for tenant-isolation

## ADDED Requirements

### Requirement: Admin User Creation Exempt from Tenant-Stamping

`POST /users` (ADMIN-only) MUST read `organizationId` from the `CreateUserDto` body, NOT stamp it from the tenant context (`req.tenant`). The `X-Tenant-ID` header is still required to pass the TenantMiddleware gate but does not determine the created user's `organizationId`.

#### Scenario: Admin creates user in org different from tenant header

- GIVEN authenticated ADMIN sends `X-Tenant-ID: org-A` and body `{organizationId: "org-B"}`
- WHEN `POST /users` processes the request
- THEN created user has `organizationId === "org-B"`
- AND `org-A` is NOT stamped onto the record

#### Scenario: Admin creates platform user (no org)

- GIVEN authenticated ADMIN sends `X-Tenant-ID: org-A` and body without `organizationId`
- WHEN `POST /users` is called
- THEN created user has `organizationId: null`

#### Scenario: Non-admin writes remain tenant-stamped

- GIVEN `POST /documents` (non-user create)
- WHEN the service persists the row
- THEN `organizationId` is stamped from tenant context (existing behavior preserved)

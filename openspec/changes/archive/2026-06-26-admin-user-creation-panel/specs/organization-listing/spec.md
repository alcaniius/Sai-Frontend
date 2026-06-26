# organization-listing Specification

## Purpose

ADMIN lists all organizations via `GET /organizations` for the admin panel's org dropdown.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | `GET /organizations` returns `[{id, name, active}]` | MUST |
| R2 | Restricted to `Role.ADMIN` | MUST |
| R3 | No pagination (organization count is low) | MAY |

### R1–R2: List + RBAC

**Scenario: ADMIN lists orgs → 200**
- GIVEN authenticated ADMIN, two orgs exist
- WHEN `GET /organizations`
- THEN `200` with array of `{id, name, active}` containing both orgs

**Scenario: MANAGER → 403**
- GIVEN authenticated MANAGER
- WHEN `GET /organizations`
- THEN `403 Forbidden`

**Scenario: Empty list → 200**
- GIVEN authenticated ADMIN, no orgs exist
- WHEN `GET /organizations`
- THEN `200` with `[]`

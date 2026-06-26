# site-filter-by-org Specification

## Purpose

Extend `GET /sites` with optional `?organizationId=` for cascading site dropdown in the admin panel.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | `GET /sites` MUST accept optional `?organizationId=<uuid>` query param | MUST |
| R2 | When provided, return only sites where `site.organizationId` matches | MUST |
| R3 | Without param, preserve existing tenant-scoped behavior | MUST |

### R1–R2: Filter

**Scenario: Filter returns matching sites**
- GIVEN org `O1` has sites `[S1, S2]`, org `O2` has site `[S3]`
- WHEN `GET /sites?organizationId=O1` as ADMIN
- THEN `200` with `[S1, S2]`; `S3` absent

**Scenario: No sites for org → empty array**
- GIVEN org `O1` has no sites
- WHEN `GET /sites?organizationId=O1` as ADMIN
- THEN `200` with `[]`

### R3: Backward Compatible

**Scenario: No param preserves tenant scoping**
- GIVEN tenant context is org `O1`
- WHEN `GET /sites` (no `?organizationId=`)
- THEN returns sites scoped to current tenant

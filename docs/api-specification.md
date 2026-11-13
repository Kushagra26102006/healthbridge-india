# HealthBridge India — API Specification & Architecture Guide

**Platform:** HealthBridge India — One Nation One Health Record  
**Standard Compliance:** ABDM M1/M2/M3, DISHA, FHIR R4, OWASP API Security Top 10  
**Current Version:** `1.0.0` (API Version `v1`)  
**Base URL:** `http://localhost:5000/api/v1` (Production: `https://api.healthbridge.in/api/v1`)  

---

## 1. Architectural Principles & Conventions

The HealthBridge India API service follows strict enterprise healthcare architectural standards:

1. **API Versioning:** All endpoints are strictly prefixed with `/api/v1`. The underlying routing architecture isolates version definitions from core business modules, enabling future revisions without duplicating domain logic.
2. **Predictable RESTful Semantics:** Standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with semantically accurate HTTP status codes (200, 201, 400, 401, 403, 404, 409, 422, 429, 500, 503).
3. **End-to-End Request Tracing:** Every request receives a cryptographically secure correlation ID (`X-Request-Id`), propagated through execution context, structured logs, and response headers.
4. **Defense-in-Depth Security:** HttpOnly, SameSite, Secure cookies for browser sessions, Bearer authorization for API clients, and automatic PHI / PII redaction across all log sinks.
5. **Fail-Safe Centralized Error Pipeline:** Operational exceptions are caught, normalized, and returned in a unified format that never exposes stack traces or database driver internals in production.

---

## 2. Standard API Response Structure

Every endpoint across the platform conforms to a unified envelope structure.

### 2.1 Standard Success Envelope
```json
{
  "success": true,
  "message": "Request completed",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-11-13T16:30:00.000Z"
}
```

### 2.2 Standard Error Envelope
```json
{
  "success": false,
  "message": "Human-readable explanation of error",
  "code": "ERROR_CODE",
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address format",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2026-11-13T16:30:00.000Z"
}
```

---

## 3. Standard Application Error Codes

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `BAD_REQUEST` | 400 | Malformed request or semantic client error |
| `MALFORMED_JSON` | 400 | JSON parser syntax error in request body |
| `INVALID_IDENTIFIER` | 400 | Malformed MongoDB ObjectId or resource reference |
| `UNAUTHORIZED` | 401 | Missing, invalid, or expired JWT access token |
| `FORBIDDEN` | 403 | RBAC permission check failed or account suspended |
| `NOT_FOUND` | 404 | Target route or resource does not exist |
| `CONFLICT` | 409 | State conflict with existing database records |
| `DUPLICATE_RESOURCE` | 409 | Unique index violation (duplicate email, phone, license) |
| `VALIDATION_ERROR` | 422 | Zod schema validation failed for body, query, or params |
| `RATE_LIMIT_EXCEEDED`| 429 | Request rate exceeded allowed tier threshold |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled operational server failure |
| `DATABASE_ERROR` | 500 | Database connection or transaction failure |
| `SERVICE_UNAVAILABLE` | 503 | Database ping or third-party gateway offline |

---

## 4. Request Validation Architecture

All input validation is decoupled from controllers using the reusable Zod middleware:

```typescript
import { validateRequest } from '../middleware/validate';

router.post(
  '/appointments',
  validateRequest({
    body: createAppointmentSchema,
    query: paginationQuerySchema,
    params: facilityParamSchema,
  }),
  appointmentController.create
);
```

- **Body Validation:** Strips unpermitted fields when `.strict()` is configured; normalizes text fields (trim, lowercase emails).
- **Query & Params Validation:** Validates types, pagination bounds, and regex formats before controllers execute.
- **Error Aggregation:** Returns all validation failures simultaneously in the `errors` array with field path markers (`body.fieldName`, `query.paramName`).

---

## 5. Pagination, Sorting & Filtering Protocol

To prevent unbounded queries and database performance degradation, all collection queries enforce strict guardrails:

```typescript
const { page, limit, skip, sortBy, sortOrder, filters, search } = parsePaginationParams(req.query, {
  defaultLimit: 20,
  maxLimit: 100,
  allowedSortFields: ['createdAt', 'updatedAt', 'name', 'scheduledAt'],
  allowedFilterFields: ['status', 'role', 'specialization'],
});
```

### Protocol Parameters
| Query Parameter | Type | Default | Constraints |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Must be $\ge 1$ |
| `limit` | integer | `20` | Clamped to `maxLimit` (default 100) |
| `sortBy` | string | `createdAt`| Must be in endpoint's sorting allowlist |
| `sortOrder` | string | `desc` | `'asc'` or `'desc'` (maps to 1 or -1) |
| `search` | string | optional | Stripped of control bytes; regex characters escaped |

---

## 6. Rate Limiting Architecture

| Tier | Window | Limit | Target Endpoints | Behavior on Exceeded |
| :--- | :--- | :--- | :--- | :--- |
| **Public** | 15 min | 100 req | `/api/v1/health`, `/api/v1/docs` | 429 `RATE_LIMIT_EXCEEDED` |
| **API General** | 15 min | 1000 req | Authenticated clinical modules | 429 `RATE_LIMIT_EXCEEDED` |
| **Auth General**| 15 min | 30 req | `/api/v1/auth/*` | 429 `RATE_LIMIT_EXCEEDED` |
| **Login Attempts**| 15 min | 5 req | `/api/v1/auth/login` (by IP + identifier)| 429 `RATE_LIMIT_EXCEEDED` |
| **Sensitive Ops**| 1 hour | 5 req | `/api/v1/auth/forgot-password`, key exchanges | 429 `RATE_LIMIT_EXCEEDED` |

### Rate Limit Response Headers
- `RateLimit-Limit`: Maximum requests permitted within window.
- `RateLimit-Remaining`: Requests remaining within active window.
- `RateLimit-Reset`: Unix timestamp when the window resets.
- `Retry-After`: Seconds remaining before client can retry.

---

## 7. OpenAPI 3.1.0 Specification (Currently Implemented Endpoints)

The machine-readable JSON specification is served live at `GET /api/v1/docs/openapi.json`.

```yaml
openapi: 3.1.0
info:
  title: HealthBridge India — One Nation One Health Record API
  description: Production-grade RESTful API service supporting ABHA integration, multi-role RBAC, consent management, and unified health records under DISHA standards.
  version: 1.0.0
servers:
  - url: http://localhost:5000/api/v1
    description: Local Development Server
  - url: https://api.healthbridge.in/api/v1
    description: Production Server

paths:
  /health:
    get:
      summary: System & Database Health Check
      responses:
        '200':
          description: System operational and healthy
        '503':
          description: System degraded or database disconnected

  /docs:
    get:
      summary: API Documentation Overview
      responses:
        '200':
          description: Documentation directory and endpoint list

  /auth/register:
    post:
      summary: Register Healthcare Account
      description: Provisions user and role profile (PATIENT, DOCTOR, PHARMACY, LABORATORY, ADMIN)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, email, phone, password, confirmPassword, role]
              properties:
                name: { type: string }
                email: { type: string, format: email }
                phone: { type: string }
                password: { type: string, format: password }
                confirmPassword: { type: string, format: password }
                role: { type: string, enum: [PATIENT, DOCTOR, PHARMACY, LABORATORY, ADMIN] }
      responses:
        '201':
          description: Account created successfully
        '409':
          description: Duplicate email or phone
        '422':
          description: Validation failure

  /auth/login:
    post:
      summary: Authenticate User
      description: Returns safe user data and sets HttpOnly access & refresh cookies
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [password]
              properties:
                email: { type: string, format: email }
                phone: { type: string }
                password: { type: string, format: password }
      responses:
        '200':
          description: Successfully authenticated
        '401':
          description: Invalid credentials or inactive status

  /auth/refresh:
    post:
      summary: Rotate Refresh Token
      description: Performs refresh token rotation and session family reuse detection
      responses:
        '200':
          description: New token pair issued
        '401':
          description: Token expired or reuse detected (family revoked)

  /auth/logout:
    post:
      summary: Logout Current Session
      description: Revokes active refresh token and clears session cookies
      responses:
        '200':
          description: Session terminated

  /auth/logout-all:
    post:
      summary: Logout All Devices
      security:
        - bearerAuth: []
        - cookieAuth: []
      responses:
        '200':
          description: All active tokens for user revoked

  /auth/me:
    get:
      summary: Authenticated User Profile
      security:
        - bearerAuth: []
        - cookieAuth: []
      responses:
        '200':
          description: Profile retrieved

  /auth/forgot-password:
    post:
      summary: Request Password Reset Token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email: { type: string, format: email }
      responses:
        '200':
          description: Reset notification queued (zero account enumeration)

  /auth/reset-password:
    post:
      summary: Reset Password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token, password, confirmPassword]
              properties:
                token: { type: string }
                password: { type: string }
                confirmPassword: { type: string }
      responses:
        '200':
          description: Password updated successfully
        '400':
          description: Invalid or expired reset token

  /auth/verify-email:
    post:
      summary: Verify Email Address
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token]
              properties:
                token: { type: string }
      responses:
        '200':
          description: Email verified successfully

  /auth/resend-verification:
    post:
      summary: Resend Verification Email
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email: { type: string, format: email }
      responses:
        '200':
          description: New verification token dispatched
```

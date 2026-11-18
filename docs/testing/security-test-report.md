# HealthBridge India — Security Regression Test Report

## 1. Executed Security Regression Matrix

All security regression tests ran in isolated test mode (`NODE_ENV=test`) against synthetic accounts and records; zero production systems were targeted.

| Security Control / Risk Category | Test Suites Verified | Result |
| --- | --- | --- |
| **Authentication Bypass & Token Integrity** | `auth-middleware.test.ts`, `auth-security.test.ts`, `phase19-fixtures-auth-consent-fhir.test.ts`, `phase19-auth-security-regression.test.ts` | **PASSED** — Missing, expired, and signature-tampered JWTs return `401 UNAUTHORIZED`; malformed login/reset payloads rejected (`400`/`422`). |
| **Authorization Bypass & Cross-Role RBAC** | `rbac-matrix.test.ts`, `security-architecture.test.ts`, `phase19-auth-security-regression.test.ts`, `ui-components-and-a11y.test.tsx` | **PASSED** — Non-admin roles receive `403` on `/api/v1/admin/*` and `/api/v1/audit/*`; `PATIENT` blocked from Doctor/Pharmacy/Lab endpoints; frontend `ProtectedRoute` enforces matching role guards backed by server-side RBAC. |
| **Cross-Patient IDOR Prevention** | `records.test.ts`, `appointments.test.ts`, `complete-patient-journey.e2e.test.ts`, `phase19-audit-and-records-api.test.ts` | **PASSED** — Patient B receives `403` attempting to inspect records or mint signed access tokens for Patient A's medical documents; unrelated Doctor B blocked `403`. |
| **Consent Enforcement & Immediate Revocation** | `consent.test.ts`, `phase19-fixtures-auth-consent-fhir.test.ts`, `complete-patient-journey.e2e.test.ts` | **PASSED** — Missing, expired, or revoked consents fail closed; synchronous revocation barrier blocks access immediately without waiting for async workers. |
| **File Upload Validation & Magic-Byte Anti-Spoofing** | `medical-documents.test.ts`, `phase19-fixtures-auth-consent-fhir.test.ts`, `phase19-audit-and-records-api.test.ts` | **PASSED** — Valid `%PDF-` and PNG signatures accepted with SHA-256 checksum; spoofed `MZ` executable disguised as `application/pdf` rejected; 10 MB limit enforced; malware scanner honestly reports `SCAN_NOT_CONFIGURED`. |
| **Injection & Open-Redirect Protections** | `sanitization.test.ts`, `security-and-errors.test.ts`, `phase18-security-audit.test.ts`, `phase19-audit-and-records-api.test.ts` | **PASSED** — NoSQL operator stripping, XSS escaping (`HighlightMatch`), CWE-601 open-redirect rejection (`sanitizeRedirectPath`), and CSV spreadsheet formula-injection neutralization (`= + - @ \t \r`) verified on both API & UI exports. |
| **Audit Log Immutability & PII Redaction** | `phase18-security-audit.test.ts`, `phase19-audit-and-records-api.test.ts` | **PASSED** — Recursive metadata redaction masks nested passwords/tokens/PHI; Mongoose pre-hooks block `update*`/`delete*`; `/api/v1/audit` exposes zero `PUT`/`PATCH`/`DELETE` routes (`404`). |
| **Rate Limiting & HTTP Security Headers** | `rate-limit.test.ts`, `phase19-auth-security-regression.test.ts` | **PASSED** — Rate limiters enforced; `X-Powered-By` stripped; `X-Content-Type-Options: nosniff`, `X-Frame-Options`, and `X-Request-Id` present. |
| **Secret Hygiene & Tracked `.env` Guard** | `git ls-files "**/.env" ...` + redacted regex scan across `apps/` & `packages/` | **PASSED** — 0 tracked `.env` files; 0 hardcoded AWS keys, private keys, or live DB credentials in tracked source code. |

---

## 2. Unverified / Externally Dependent Security Controls

- **Live Dependency Audit (`pnpm audit --prod --audit-level=high`):** Blocked by offline sandbox; automated in `.github/workflows/security-ci.yml`.
- **MFA (TOTP):** Not yet implemented; honestly reported as `Not Configured` rather than mocked.
- **External Malware Scanning (ClamAV/Cloud AV) & Independent Penetration Testing / CERT-In WASA:** Pre-production infrastructure/third-party assessor gates.

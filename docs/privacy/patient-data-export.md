# HealthBridge India — Patient Data Export Architecture (Day 9 Task 02)

**Endpoints:**
- `POST /api/v1/patient/privacy/export-requests`
- `GET /api/v1/patient/privacy/export-requests`
- `GET /api/v1/patient/privacy/export-requests/:id`
- `GET /api/v1/patient/privacy/export-requests/:id/download`

**Frontend UI:** `/patient/privacy` ("Export My Data" tab)

---

## 1. Export Scope & Security Safeguards

- **Eligible Export Categories:** `PROFILE`, `APPOINTMENTS`, `PRESCRIPTIONS`, `LAB_REPORTS` (published/finalized only), `MEDICAL_RECORDS` (metadata), `CONSENT_HISTORY`, and `ACCESS_HISTORY` (patient-facing ledger).
- **Strict Ownership Enforcement:** Only the authenticated `PATIENT` (`req.user.userId`) can create, inspect, or download their own export requests; any cross-patient access attempt returns `403 FORBIDDEN`.
- **Mandatory Secret Scrubbing:** A dedicated serialization replacer (`SECRET_FIELDS_REGEX`) guarantees `passwordHash`, `refreshToken`, `tokenHash`, `accessToken`, `clientSecret`, and `webhookSecret` can never be serialized into exported JSON.
- **Private Ephemeral Storage & Short-Lived Expiry:** Export artifacts are never placed in public object storage (`storageScope: 'PRIVATE_EPHEMERAL'`), carry a SHA-256 integrity checksum (`X-Export-SHA256`), expire automatically after **15 minutes** (expired downloads return `410 GONE`), and stream with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- **Privacy-Safe Notifications:** Export readiness notifications emit neutral text directing the patient to `/patient/privacy` — **never** embedding download links or clinical values inside notification previews.
- **Audit Coverage:** Both `PATIENT_DATA_EXPORT_GENERATED` and `PATIENT_DATA_EXPORT_DOWNLOADED` are logged via `securityAuditMonitor`.

---

## 2. Production Scaling Note

For very large multi-year patient datasets with attached high-resolution diagnostic files, production deployments should offload export assembly to a background worker writing encrypted ZIP/JSON bundles to a private KMS-encrypted S3/GCS bucket with short-lived pre-signed download URLs (`<= 15m`) and automated lifecycle purge.

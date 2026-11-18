# HealthBridge India — Advanced Medical Document Management System (Phase 16)

## 1. Document Architecture

HealthBridge India's Medical Document Management System extends the existing `MedicalRecordModel` (`medicalRecords` collection), `FileSecurityService`, `SecureDocumentStorageService`, `consentEnforcementService`, and `securityAuditMonitor` into a unified, consent-guarded clinical document vault across Patient, Doctor, Laboratory, and Pharmacy workflows.

```text
Patient / Consented Doctor UI
  ├── Medical Document Dashboard (/patient/records)
  │     ├── Overview Cards + Real Vault Storage Bar (RecordsSummary)
  │     ├── Multi-View Switcher: All Documents | Chronological Timeline | Upload History
  │     ├── Search + 9 Canonical Categories + Provider + Date + Status Filters
  │     ├── Drag & Drop Multi-File Uploader (RecordUploadDialog)
  │     └── 1-Click Secure Document Preview Modal (SecureDocumentViewerModal)
  ├── Document Detail & HL7 FHIR R4 View (/patient/records/[recordId])
  ├── Doctor Patient Records (/doctor/patients/[patientId]/records -> MedicalRecordList)
  ├── Laboratory Diagnostic Report Preview (/laboratory/reports/[id]/preview)
  └── Pharmacy Prescription Fulfillment Preview (/pharmacy/prescriptions/[id])
        │
        ▼ (Authenticated JWT + Short-Lived HMAC Signed Access Links)
Express API (/api/v1/records)
  ├── RecordController + RecordService
  ├── FileSecurityService (MIME + Extension + Binary Magic Bytes + 10MB Cap + SHA-256)
  ├── ConsentEnforcementService (ABDM Electronic Consent Verification for Doctors)
  └── SecurityAuditMonitor (Append-only PHI-Free Access, Upload & Archival Audit Logs)
```

---

## 2. Storage Provider & Security Posture

- **Current Environment Storage:** Private application-gated storage inside MongoDB (`MedicalRecordModel`, `fileData` + cryptographic `storageId` + `sha256Checksum`) paired with the `SecureDocumentStorageService` (`LOCAL_PRIVATE_DEVELOPMENT_STORE`, AES-256-GCM + AAD) abstraction.
- **Zero Public Exposure:** Uploaded medical documents are **never** placed in publicly accessible directories or served through unsigned public bucket URLs.
- **Malware Scanning Boundary:** `FileSecurityService` and `SecureDocumentStorageService` expose a clean antivirus adapter boundary. Because no external ClamAV/cloud AV engine is provisioned in this environment, documents transparently carry `scanStatus: 'SCAN_NOT_CONFIGURED'` (never falsely claiming clean antivirus scanning).
- **Per-Patient Vault Storage Metrics:** `GET /api/v1/records/summary` aggregates real `totalStorageBytes` against `RECORD_CONFIG.maxPatientStorageBytes` (`100 MB`). Storage bars are rendered only when real metrics are returned by the server.

---

## 3. Canonical Document Categories & Supported File Types

### Single Unified Category System (`HEALTH_RECORD_TYPES`)
Reuses the single canonical category enum across `@healthbridge/config`, `@healthbridge/shared-types`, `@healthbridge/validation`, MongoDB `MedicalRecordSchema`, HL7 FHIR R4 LOINC mappings, and UI filters (zero duplicate category systems):

| Canonical Category | Label | HL7 FHIR LOINC Code |
| --- | --- | --- |
| `PRESCRIPTION` | Prescriptions | `57833-6` |
| `DIAGNOSTIC_REPORT` | Laboratory Reports | `11502-2` |
| `IMAGING_REPORT` | Imaging Reports | `18748-4` |
| `OP_CONSULTATION` | Consultation Records | `34108-1` |
| `DISCHARGE_SUMMARY` | Discharge Summaries | `18842-5` |
| `MEDICAL_CERTIFICATE` | Medical Certificates | `75476-2` |
| `IMMUNIZATION_RECORD` | Immunization Records | `11369-6` |
| `WELLNESS_RECORD` | Wellness Records | `42255-0` |
| `OTHER_MEDICAL_DOCUMENT` | Other Medical Documents | `34133-9` |

### Supported File Types (`RECORD_CONFIG`)
- **Permitted MIME Types:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
- **Permitted Extensions:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Maximum File Size:** `10 MB` (`10,485,760` bytes) enforced on both client pre-validation and decoded server buffer size.
- **Blocked Payloads:** Executables (`MZ` Windows PE, `ELF`), HTML/SVG/Script payloads, mismatched extensions, and empty (`0`-byte) files are rejected server-side with `FILE_SIGNATURE_REJECTED` audit events.

---

## 4. Upload Workflow

1. **Client-Side Drag & Drop Queue (`RecordUploadDialog.tsx`):** Supports drag-and-drop and multi-file selection, instant pre-validation (`validateClientUploadFile`), editable per-file titles, shared category/date/provider metadata, real Axios `onUploadProgress` progress bars, active upload cancellation (`AbortController`), and per-file Retry.
2. **Server-Side Defense-in-Depth Validation (`POST /api/v1/records`):**
   - Zod schema validation (`createRecordSchema`).
   - `fileSecurityService.validateUpload()` verifies MIME allowlist, extension match, binary magic bytes (`%PDF-`, PNG signature, JPEG `FF D8 FF`, RIFF/WEBP), decoded byte size (`<= 10 MB`), path-traversal filename sanitization, opaque `storageId`, and `sha256Checksum`.
3. **Duplicate Detection:** Checks `(patientId, sha256Checksum, isArchived: { $ne: true })`. When a duplicate is found and `allowDuplicate !== true`, returns `409 CONFLICT` (`DUPLICATE_DOCUMENT`) so the user can explicitly choose to skip or re-upload.
4. **Honest Confirmation:** The UI marks a file `Confirmed` **only after** the backend responds with `201 Created`.

---

## 5. Secure Document Preview Workflow

1. **Short-Lived Signed Access Token (`GET /api/v1/records/:recordId/access-token`):**
   - Verifies JWT authentication, strict ownership (`PATIENT`) or active ABDM consent (`DOCTOR`), and non-archived status.
   - Issues an HMAC-SHA256 signed token bound strictly to `(recordId, patientId, actorId, actorRole, expiresAt)` with a 180-second TTL (`RECORD_CONFIG.signedAccessTtlSeconds`).
2. **Inline Private Streaming (`GET /api/v1/records/:recordId/preview?token=...`):**
   - Verifies the token with `crypto.timingSafeEqual`, checks expiration (`410 GONE` when expired), confirms `recordId` match (`403 FORBIDDEN` on mismatch), and streams bytes with:
     - `Content-Disposition: inline; filename="..."`
     - `X-Content-Type-Options: nosniff`
     - `Content-Security-Policy: sandbox`
     - `Cache-Control: no-store, no-cache, must-revalidate, private`
   - Logs `DOCUMENT_PREVIEWED` in `securityAuditMonitor`.
3. **Client Viewer (`SecureDocumentViewer.tsx`):** Streams into an ephemeral private `Blob` URL (revoked on unmount), providing PDF page navigation, zoom (`50%–250%`), image rotation (`90°`), access-link refresh, document & security metadata panel, authorized download, and `<ErrorState>` recovery.

---

## 6. Authorization Model & Consent Integration

| Role | General Medical Records (`/api/v1/records/*`) | Scoped Portal Document Workflow |
| --- | --- | --- |
| **PATIENT** | Full access to **own** documents only (`record.patientId === userId`); owner-only soft archival (`DELETE`). Cross-patient access blocked with `403 FORBIDDEN`. | Full Document Dashboard, Chronological Timeline, Upload History, Preview, Download, Archive, Consent Management. |
| **DOCTOR** | **Consent-gated** read/preview/download (`consentEnforcementService.enforce({ dataCategory: 'MEDICAL_RECORDS' })`). Cannot archive patient documents. | Consented Patient Records Explorer (`MedicalRecordList`) with in-app `SecureDocumentViewerModal` and authenticated downloads. |
| **LABORATORY** | **Denied (`403 FORBIDDEN`)** on general patient vault access-token/preview endpoints. | Order-associated Diagnostic Report Preview (`/laboratory/reports/[id]/preview`) with zoom, approval/publish workflow, print, and PDF download. |
| **PHARMACY** | **Denied (`403 FORBIDDEN`)** on general patient vault access-token/preview endpoints. | Routed Prescription Verification & Fulfillment Preview (`/pharmacy/prescriptions/[id]`) strictly scoped to the routed prescription. |
| **ADMIN** | Cannot access other patients' clinical files without explicit ownership/authorization. | Platform governance & security audit logs only. |

---

## 7. API Endpoints

| Endpoint | Method | Auth / RBAC | Purpose |
| --- | --- | --- | --- |
| `/api/v1/records` | `GET` | `PATIENT`, consented `DOCTOR`, `ADMIN` | Paginated list with search, category, provider, source, verification status, date range, and sorting (excludes archived by default) |
| `/api/v1/records/summary` | `GET` | `PATIENT`, consented `DOCTOR`, `ADMIN` | Category counts, 30-day recent upload count, and real `totalStorageBytes` / `maxStorageBytes` |
| `/api/v1/records` | `POST` | `PATIENT`, `DOCTOR`, `ADMIN` | Upload/create record with magic-byte verification, SHA-256 duplicate detection, and audit logging |
| `/api/v1/records/:recordId` | `GET` | `PATIENT` (owner), consented `DOCTOR` | Record metadata & HL7 FHIR R4 `DocumentReference` representation |
| `/api/v1/records/:recordId/access-token` | `GET` | `PATIENT` (owner), consented `DOCTOR` | Issues short-lived (180s) HMAC-signed preview/download token |
| `/api/v1/records/:recordId/preview` | `GET` | Valid signed `?token=...` OR JWT + ownership/consent | Streams private document inline (`sandbox` CSP, `nosniff`, `no-store`) |
| `/api/v1/records/:recordId/download` | `GET` | `PATIENT` (owner), consented `DOCTOR` | Streams private document as attachment with sanitized filename and audit log |
| `/api/v1/records/:recordId` | `DELETE` | `PATIENT` (owner only) | Safe soft-archival (`isArchived: true`, `archivedAt`, `archivedBy`) preserving audit trails |

---

## 8. Security Controls & Testing Results

### Security Controls Verified
- Defense-in-depth binary magic-byte inspection (`FileSecurityService`) + 10MB decoded buffer limit + path-traversal filename sanitization.
- IDOR prevention on every read, preview, token issuance, download, and archival call.
- Per-user TanStack Query cache keys (`user?.id`) to prevent cross-session browser cache leakage.
- Short-lived HMAC-SHA256 tokens verified via constant-time `crypto.timingSafeEqual`.
- Soft archival preserves clinical audit trails without allowing destructive non-owner deletion.

### Executed Verification Suite

| Check | Scope | Result |
| --- | --- | --- |
| Backend Phase 16 Unit Tests (`vitest run tests/unit/medical-documents.test.ts`) | Magic-byte validation, executable/XSS rejection, 10MB limit, 9 FHIR categories, SHA-256 duplicate detection (`409`), HMAC token issuance/tampering/expiry (`410`), IDOR blocking (`403`), soft archival (`404`), doctor consent enforcement & Pharmacy/Lab denial | **9 / 9 PASSED** |
| Backend Data Protection Unit Tests (`vitest run tests/unit/data-protection.test.ts`) | AES-256-GCM encryption, key rotation, private document quarantine, signed URL expiry, SHA-256 tamper detection | **5 / 5 PASSED** |
| Frontend Document Helpers Verification (`verify-phase16-documents.ts`) | 1:1 category parity with `HEALTH_RECORD_TYPES`, client file validation, storage percentage math, chronological grouping without fabricated dates | **5 / 5 SUITES PASSED** |
| Backend TypeScript (`pnpm --filter @healthbridge/api type-check`) | Shared packages + Express API | **0 errors** |
| Frontend TypeScript (`pnpm --filter @healthbridge/web type-check`) | Full Next.js web workspace | **0 errors** |
| Frontend ESLint (`pnpm --filter @healthbridge/web lint`) | All Phase 16 files (0 errors, 0 warnings in Phase 16 code) | **0 errors** |
| Next.js Production Build (`pnpm --filter @healthbridge/web build`) | Full static & dynamic production build (shared First Load JS `87.5 kB`) | **PASSED** |

---

## 9. Known Limitations

- **External Object Storage & Malware Scanner:** Production deployments should plug an S3/GCS private bucket adapter and ClamAV/cloud AV scanner into `SecureDocumentStorageService` and `FileSecurityService`. Until provisioned, files remain in private application-gated storage with honest `SCAN_NOT_CONFIGURED` status.
- **ABDM External Synchronization:** Manual patient uploads are stored as `SELF_SUBMITTED` in the private vault and are not claimed to be synchronized with live external ABDM HIE-CM gateways unless explicitly configured.
- **Supertest Integration Socket Tests in Sandbox:** `apps/api/tests/integration/records.test.ts` binds a local TCP port via `supertest` which is restricted inside the sandbox; all controller, service, security, and validation paths were verified via Vitest unit suites.
- **Browser / Mobile Interactive QA:** Automated unit, static analysis, and production build checks are verified; live browser drag-and-drop and touch testing should be executed in an interactive browser session.

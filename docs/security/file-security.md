# HealthBridge India — Medical File & Document Security (Day 9 Task 01)

**Primary Components:** `apps/api/src/security/file-security.service.ts`, `apps/api/src/modules/records/services/record.service.ts`, `apps/api/src/modules/records/controllers/record.controller.ts`

---

## 1. Upload Security Controls Implemented

| Control | Enforcement Details |
|---|---|
| **Strict MIME Allowlist** | Only `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`, and `image/webp` are accepted (`RECORD_CONFIG.allowedMimeTypes`). Executables, HTML, SVG, scripts, and archives are rejected. |
| **Extension-to-MIME Consistency** | Filename extension (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`) must match the declared MIME type; mismatches (e.g., `payload.exe` with `application/pdf`) are rejected (`400`). |
| **Binary Magic-Byte File Signature Verification** | Never trusts client-provided `mimeType` alone. Inspects decoded binary headers: `%PDF-` (`25 50 44 46 2D`), PNG (`89 50 4E 47 0D 0A 1A 0A`), JPEG (`FF D8 FF`), WebP (`RIFF....WEBP`). Explicitly rejects Windows PE (`MZ`), Linux ELF (`\x7fELF`), and HTML/SVG/Script payloads. |
| **Actual Decoded Size Enforcement** | Validates decoded Base64 `Buffer.length <= 10MB` rather than trusting client-declared `fileSize`. |
| **Path-Traversal & Header-Injection Safe Filenames** | `sanitizeFileName(...)` strips directory segments (`../`, `\`), null bytes, control/CRLF characters, and non-safe characters, capping length at 120 characters. |
| **Cryptographic Random Storage Identifiers** | `generateStorageId(...)` generates opaque UUID-based storage keys (`doc_<uuid>.<ext>`) so untrusted filenames never map directly to storage paths. |
| **Upload Audit Logging** | Both accepted uploads (`DOCUMENT_UPLOADED` with `storageId`, `mimeType`, `signatureVerified`, `malwareScanStatus`) and blocked uploads (`FILE_SIGNATURE_REJECTED`) are recorded via `securityAuditMonitor`. |

---

## 2. Download Security Controls Implemented

- **Authorization Before Download:** `GET /api/v1/records/:recordId/download` requires JWT authentication, strict patient ownership (`record.patientId === req.user.userId`) OR active doctor consent via `consentEnforcementService.enforce(...)`. No public medical document URLs exist.
- **Hardened Download Headers:**
  - `Content-Disposition: attachment; filename="<sanitized>"` (prevents inline execution in browser)
  - `X-Content-Type-Options: nosniff` (prevents MIME-sniffing XSS)
  - `Cache-Control: no-store, no-cache, must-revalidate, private` & `Pragma: no-cache` (prevents proxy/shared-browser caching of PHI)
- **Download Audit Logging:** Emits `DOCUMENT_DOWNLOADED` (`actorId`, `actorRole`, `resourceId`, `mimeType`, `byteSize`, `requestId`) via `securityAuditMonitor`.

---

## 3. Honest Infrastructure Limitations (Pre-Production Requirements)

1. **Malware / Antivirus Scanning Infrastructure NOT Configured:**
   - `FileSecurityService` exposes a pluggable `MalwareScannerAdapter` integration boundary whose current default returns `status: 'SCAN_NOT_CONFIGURED'` (`UNCONFIGURED_LOCAL_BOUNDARY`).
   - **We explicitly do NOT claim uploaded files are scanned for malware.** Before production go-live, wire a ClamAV daemon or cloud object-storage malware scanning pipeline (AWS GuardDuty Malware Protection / GCP Cloud Storage AV) into `MalwareScannerAdapter`.
2. **External Object Storage & Pre-Signed URLs:**
   - Clinical files are currently represented inline/Base64 in the development record schema. Production deployments must store encrypted binary objects in private S3/GCS buckets (SSE-KMS, public access blocked) and serve authorized downloads via short-lived (`<= 60s`) pre-signed URLs or authenticated backend streams.

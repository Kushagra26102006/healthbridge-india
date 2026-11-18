# HealthBridge India — Secure Medical Document Storage Architecture (Day 9 Task 03)

**Primary Services:**
- `apps/api/src/security/file-security.service.ts` (MIME/extension/magic-byte validation, filename sanitization, 10MB limit)
- `apps/api/src/security/data-protection/document-storage.service.ts` (`SecureDocumentStorageService`)
- `apps/api/src/modules/records/services/record.service.ts` & `record.controller.ts`

---

## 1. End-to-End Protected Document Flow

1. **Authorized Upload:** Authenticated actor uploads file; `FileSecurityService.validateUpload` verifies MIME allowlist (`PDF`, `PNG`, `JPEG`, `WebP`), extension match, binary magic-byte header (`%PDF-`, PNG, JPEG, WebP), actual decoded byte length (`<= 10MB`), and sanitizes filenames against `../` path traversal and CRLF injection.
2. **Randomized Storage Identifier:** Generates opaque `doc_<uuid>.<ext>` storage ID so original filenames never map to storage paths.
3. **Private Quarantine & Malware Boundary:** Places upload in private storage (`publicAccessEnabled: false`), runs `DocumentScannerPlugin` boundary (`SCANNING` -> `CLEAN` | `INFECTED` | `SCAN_FAILED`). Failed or unconfigured scans **never** auto-mark files `CLEAN`.
4. **Authenticated Encryption at Rest & Integrity Hash:** Encrypts file buffer via `KeyManagementService.encrypt(buffer, "${documentId}:${ownerId}")` (AES-256-GCM + AAD) and computes SHA-256 cryptographic integrity hash (`sha256IntegrityHash`, used strictly for tamper detection — not encryption).
5. **Short-Lived Signed Download & Verification:** `issueSignedDownloadToken(documentId, requesterId, ttlSeconds=60)` validates ownership and quarantine state; `downloadWithSignedToken` verifies HMAC signature via `crypto.timingSafeEqual`, checks expiry (`410 GONE`), decrypts with GCM authTag verification, re-verifies SHA-256 integrity hash, streams with `Cache-Control: no-store` & `X-Content-Type-Options: nosniff`, and emits `DOCUMENT_DOWNLOADED` audit event.

---

## 2. Production Storage Migration Requirement

The local test/dev backend uses `LOCAL_PRIVATE_DEVELOPMENT_STORE` (in-memory private store). Before production launch, bind `PrivateDocumentStoreAdapter` to a private cloud object bucket (AWS S3 / GCS) with **Block Public Access** enabled, SSE-KMS encryption, bucket versioning, streaming uploads/downloads for large imaging files, and automated quarantine lifecycle policies.

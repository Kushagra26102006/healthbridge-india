# ABDM Security & Privacy-by-Design Architecture — HealthBridge India

> **Governance Disclaimer:** Designing and implementing these technical controls supports privacy-by-design and aligns with NHA Health Data Management Policy principles, but does **not** by itself constitute regulatory certification, CERT-In WASA clearance, or formal ABDM production compliance.

---

## 1. Privacy-by-Design Controls
1. **Minimum-Necessary Data Sharing:** `AbdmConsentAdapter` enforces exact `hiTypes` and `dateRange` boundaries; only records matching the consented clinical scope are eligible for mapping.
2. **Purpose Limitation:** Every consent evaluation checks `purposeCode` (e.g., `CAREMGT` vs `PUBHLTH`).
3. **Patient Authorization & Origin Isolation:** Internal HealthBridge consents (`INTERNAL_HEALTHBRIDGE`) are strictly rejected when ABDM HIE-CM artefacts (`ABDM_HIE_CM`) are required.
4. **Expiry & Revocation Enforcement:** Expired (`dataEraseAt <= now`) and revoked artefacts are denied immediately (`CONSENT_EXPIRED`, `CONSENT_REVOKED`).
5. **Zero PHI / Secret Logging (`utils/redaction.ts` + `config/logger.ts`):**
   - Deep recursive redaction strips `clientSecret`, `accessToken`, `Authorization: Bearer ...`, `abhaNumber`, `aadhaar`, `consentToken`, `encryptedData`, `clinicalNotes`, `observations`, and `diagnosis` before any log line or webhook metadata persistence.
   - Inline string regexes scrub 14-digit ABHA numbers and Bearer tokens from free-text messages.
6. **Credential Isolation & Production Lock:**
   - All ABDM secrets live exclusively in backend environment variables; zero secrets are returned by `/api/v1/abdm/status` or exposed to `apps/web`.
   - `ABDM_ALLOW_PRODUCTION=false` prevents accidental production activation prior to official NHA Sandbox Exit.
7. **Webhook & Replay Security:**
   - Constant-time HMAC-SHA256 signature / shared-secret verification (`crypto.timingSafeEqual`).
   - ±5 minute timestamp drift replay window (`ABDM_REPLAY_DETECTED`).
   - Compound unique idempotency index `{ requestId, eventType }` on `AbdmWebhookEventModel`.
8. **Synthetic Data Policy:** Development and test suites strictly use synthetic identifiers (`synth.alpha@sbx`, `LBR-SYNTH-*`, `SYNTH-HEM-01`). Real citizen ABHA numbers or patient records are prohibited in dev/test environments.

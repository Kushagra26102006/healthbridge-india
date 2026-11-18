# HealthBridge India — Security Event Catalogue (Day 9 Task 04)

**Schema Source:** `apps/api/src/modules/security-monitoring/security-event.types.ts`

All security events are strictly validated via `securityEventInputSchema` (Zod) and reject any metadata containing forbidden secret/PHI keys (`password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `secret`, `encryptionKey`, `keyMaterial`, `privateKey`, `diagnosis`, `clinicalNotes`, `prescriptionText`, `medicalRecords`, `abhaNumber`, `aadhaar`, `otp`).

---

## 1. Event Categories & Types

| Category | Event Types | Default Operational Signal |
|---|---|---|
| **AUTHENTICATION** | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `ACCOUNT_LOCKOUT`, `TOKEN_REUSE_DETECTED`, `SESSION_REVOKED`, `PASSWORD_RESET_REQUESTED` | Credential stuffing, brute force, session compromise |
| **AUTHORIZATION** | `ACCESS_DENIED`, `CROSS_PATIENT_ACCESS_ATTEMPT`, `CROSS_TENANT_ACCESS_ATTEMPT`, `ROLE_PERMISSION_CHANGE`, `CONSENT_VALIDATION_FAILURE` | Horizontal IDOR, privilege escalation, consent bypass |
| **API_SECURITY** | `RATE_LIMIT_EXCEEDED`, `INVALID_REQUEST_PATTERN`, `SUSPICIOUS_QUERY_PATTERN`, `INPUT_VALIDATION_FAILURE`, `UNUSUAL_API_ACTIVITY` | Scraping, NoSQL/XSS probing, DoS bursts |
| **DATA_PROTECTION** | `SENSITIVE_DOCUMENT_ACCESS`, `UNAUTHORIZED_DOCUMENT_DOWNLOAD`, `EXPORT_REQUEST_CREATED`, `BULK_DATA_ACCESS_ATTEMPT`, `DECRYPTION_FAILURE`, `KEY_ROTATION_FAILURE` | Document exfiltration, tampering, crypto failures |
| **INTEGRATION** | `ABDM_CALLBACK_VALIDATION_FAILURE`, `EXTERNAL_TRANSFER_FAILURE`, `EVENT_REPLAY_ATTEMPT`, `EVENT_SIGNATURE_VALIDATION_FAILURE` | Spoofed webhooks, replay attacks, broken partner trust |

---

## 2. Severity Classification Policy

- **CRITICAL:** Immediate potential compromise or severe PHI exposure (e.g., `TOKEN_REUSE_DETECTED`, repeated cross-patient/consent bypass attempts, repeated decryption/authTag failures).
- **HIGH:** Significant security risk requiring urgent investigation (e.g., brute-force login burst, repeated cross-tenant admin denials, sustained API abuse, integration callback spoofing).
- **MEDIUM:** Suspicious activity or policy violation requiring analyst review (e.g., key rotation metadata event, isolated rate-limit spike).
- **LOW:** Informational security telemetry (e.g., routine `LOGIN_SUCCESS`, single failed login typo).

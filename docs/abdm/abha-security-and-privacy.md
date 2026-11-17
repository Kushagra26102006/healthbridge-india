# ABHA Security & Privacy Architecture

> **Compliance Disclaimer:** Implementing these technical controls establishes a strong engineering security foundation, but HealthBridge India does **not** claim formal DISHA, DPDP Act, ABDM, or CERT-In WASA regulatory compliance without independent formal audits and official NHA approvals.

## 1. Threat Mitigations Implemented

| Threat | Implemented Mitigation |
|---|---|
| **Account Takeover / Identity Swapping** | Actor derived strictly from server-side JWT (`req.user.userId`); forged client `patientId` ignored; OTP ownership verification required before linking. |
| **Cross-Patient Access / Hijack** | Every transaction (`AbhaTransaction`) is bound to `patientId`; cross-patient OTP confirmation or linking returns `403 ABDM_AUTH_ERROR`. |
| **Duplicate Identity Linking** | Partial unique indexes on `abhaNumberHash` & `abhaAddress` + service-level checks return `409 ABDM_DUPLICATE_IDENTITY`. |
| **Identity Enumeration** | Duplicate errors never reveal the owning patient; admin analytics never return patient IDs or raw ABHA identifiers. |
| **OTP Brute Force** | Dedicated per-user `abhaOtpLimiter` (15 requests / 15 min) + 10-minute server-side OTP session TTL. |
| **Sensitive Data Leakage in Logs** | `redactAbdmLogPayload()` & `redactStringSecrets()` strip `otp`, `aadhaar`, `abha`, `x-token`, `loginId`, `secret`, `token`, and 12/14-digit patterns before logging or persisting `AuditLog` metadata. |
| **Data-at-Rest Exposure** | Verified 14-digit ABHA numbers are encrypted with **AES-256-GCM** (random 12-byte IV, `select: false`) alongside an **HMAC-SHA256** blind index. OTPs and Aadhaar numbers are NEVER persisted. |
| **Frontend Token Exposure** | Gateway Bearer tokens, client secrets, and user `X-Token` sessions never leave backend memory. |
| **Unauthorized Unlinking** | Enforced `actorId === patientId`, `PATIENT` role RBAC, explicit confirmation, and immutable audit logging. |
| **Unencrypted External Transport** | `AbdmHttpClient` and `AbdmAuthenticationService` enforce `https://` in `sandbox` and `production` modes. |
| **Cross-Role / Cross-Lab Access** | `DOCTOR`, `LABORATORY`, and `PHARMACY` roles receive `403 Forbidden` on patient ABHA identity routes. |

## 2. Privacy-Safe Notifications & Immutable Audits

- **Notifications (`notificationService.publishEvent`):** Dispatched for `ABHA_LINKING_INITIATED`, `ABHA_VERIFICATION_PENDING`, `ABHA_LINKING_COMPLETED`, `ABHA_VERIFICATION_FAILED`, and `ABHA_UNLINKED` using masked ABHA numbers only (`91-XXXX-XXXX-1234`). HealthBridge does not claim SMS or email delivery without a configured external provider.
- **Audit Trail (`AuditLogModel` & `AbhaTransactionModel`):** Records `internalTransactionId`, `externalTransactionId`, `correlationId`, `workflowType`, `verificationStatus`, `failureCategory`, and timestamp with all sensitive fields redacted.

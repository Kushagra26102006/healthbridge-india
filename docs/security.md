# HealthBridge India — Platform Security & Compliance Architecture

> **Platform:** HealthBridge India  
> **Compliance Benchmarks:** DISHA (India), HIPAA (Security Rule), ABDM Milestone 1–3  
> **Classification:** Security Architecture & Threat Model Specification  

---

## 1. Threat Model & Risk Analysis (STRIDE)

| Threat Category | Potential Attack Vector | HealthBridge India Mitigation |
| :--- | :--- | :--- |
| **Spoofing Identity** | Fake credential submission, stolen session cookie | Hashed passwords (bcrypt 10+), short-lived JWT (15m), refresh token rotation with family revocation on reuse. |
| **Tampering with Data**| Modifying clinical records or audit trails in transit | TLS 1.3 encryption, immutable append-only audit logging (blocked update/delete hooks), Zod validation. |
| **Repudiation** | Denying issuance of prescription or medical record | Append-only `AuditLog` storing actor ID, IP address, timestamp, requestId, and cryptographic consent artifacts. |
| **Information Disclosure**| Leaking patient records or password hashes | Zero password hash in `select`, `passwordHash` stripped in transforms, HTTP-only cookies (no localStorage), generic auth errors. |
| **Denial of Service** | Credential stuffing, password reset flood | In-memory sliding-window rate limiters: 5 login attempts / 15m, 3 password resets / hour, 100 general requests / 15m. |
| **Elevation of Privilege**| Patient accessing doctor EHRs or admin portals | Two-tier authorization: Layer 1 RBAC (`authorize(...)`), Layer 2 ABDM Consent Artifact verification. |

---

## 2. Sensitive Data Redaction & Logging Policy

Under DISHA and ABDM regulations, the platform enforces strict logging sanitization. The following items are **NEVER logged or captured in telemetry**:

1. Plaintext passwords or password reset tokens.
2. Unhashed JWT access tokens or refresh tokens.
3. Plaintext One-Time Passwords (OTPs).
4. Patient Aadhaar numbers or ABHA credentials.
5. Electronic Health Record (EHR) payload contents, diagnostic observations, or clinical notes.

### Sanitization Implementation:
- **AuditLog Metadata Filter:** The `AuditLog` Mongoose schema validates metadata, rejecting documents containing forbidden keys (`password`, `token`, `secret`, `refreshToken`).
- **Logger Masking:** The database connector automatically masks MongoDB URIs (`mongodb://user:****@cluster/`).

---

## 3. Rate Limiting Specifications

The platform utilizes sliding-window in-memory rate limiting with automated expired token purging:

```
Endpoint                          Window     Max Allowed  Action on Limit Exceeded
----------------------------------------------------------------------------------
POST /api/v1/auth/login           15 Minutes  5 Attempts   429 Too Many Requests (Lockout)
POST /api/v1/auth/forgot-password 60 Minutes  3 Attempts   429 Too Many Requests
POST /api/v1/auth/* (General)     15 Minutes  100 Requests 429 Too Many Requests
```

---

## 4. Layered Authorization Model

HealthBridge India enforces a strict two-tier access boundary:

```mermaid
graph TD
    Request["Incoming API Request"] --> Layer1["Layer 1: Role-Based Access Control (RBAC)<br/>Checks whether actor has DOCTOR, PATIENT, ADMIN, etc."]
    Layer1 -->|Role Denied| Block403["403 Forbidden"]
    Layer1 -->|Role Permitted| Layer2["Layer 2: Resource Ownership & ABDM Consent<br/>Is actor the patient, or does an ACTIVE ConsentArtifact exist for this purpose?"]
    Layer2 -->|No Valid Consent| BlockConsent["403 Forbidden: Consent Required or Expired"]
    Layer2 -->|Consent Valid| Service["Execute Clinical Record Query"]
```

> [!IMPORTANT]
> Role checks alone are never sufficient for clinical data access. Even a verified doctor cannot access a patient's medical records without an active, unexpired, and purpose-matching `ConsentArtifact`.

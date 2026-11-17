# ABHA Number Verification Workflow

## 1. Security Principle

A syntactically valid 14-digit ABHA number (`XX-XXXX-XXXX-XXXX`) is **never** accepted as proof of ownership. Ownership must be cryptographically proven via an official ABDM V3 OTP verification session.

## 2. Internal API Contract & Official V3 Mapping

| Step | HealthBridge Endpoint | Official ABHA V3 Endpoint |
|---|---|---|
| 1. Request OTP | `POST /api/v1/abdm/abha/verify` | `POST /abha/api/v3/profile/login/request/otp` (`loginHint: "abha-number"`) |
| 2. Confirm OTP | `POST /api/v1/abdm/abha/verify/confirm` | `POST /abha/api/v3/profile/login/verify` |
| 3. Link Identity | `POST /api/v1/abdm/abha/link` | Persists verified `AbhaLink` after explicit consent |

## 3. Supported OTP Systems

- `abdm`: OTP delivered to ABHA-registered mobile (`scope: ["abha-login", "mobile-verify"]`).
- `aadhaar`: OTP delivered to Aadhaar-registered mobile (`scope: ["abha-login", "aadhaar-verify"]`).

## 4. Verification Status Lifecycle

- `NOT_LINKED` — Patient has no linked ABHA identity.
- `PENDING_VERIFICATION` — OTP challenge initiated and awaiting confirmation.
- `VERIFICATION_IN_PROGRESS` — Enrolment OTP challenge active.
- `VERIFIED` — External ABHA V3 OTP verification succeeded.
- `VERIFICATION_FAILED` — Invalid OTP, expired session, invalid identifier, rate limit, or upstream error.
- `REVOKED_OR_UNLINKED` — Local HealthBridge association explicitly unlinked by the patient.

## 5. Error & Failure Handling

- **Invalid OTP (`400 ABDM_INVALID_OTP`)** -> recorded with `failureCategory: 'INVALID_OTP'`.
- **Expired Session (`410 ABDM_SESSION_EXPIRED`)** -> enforced both server-side (10-minute TTL) and upstream.
- **Rate Limiting (`429 RATE_LIMIT_EXCEEDED` / `ABDM_RATE_LIMITED`)** -> dedicated per-patient OTP rate limiter (`15 requests / 15 minutes`).
- **Service Unavailable / Timeout (`503` / `504`)** -> handled cleanly without exposing internal stack traces or sensitive fields.

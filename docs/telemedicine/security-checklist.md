# HealthBridge India — Video Consultation Security & Privacy Checklist

## Implemented Security Controls

| Control | Implementation Status | Details |
| :--- | :---: | :--- |
| **Strict Participant-Only Authorization** | Implemented & Unit-Tested | `TelemedicineService.loadAuthorizedAppointment()` verifies exact `patientId === userId` (for `PATIENT`) or `doctorId === userId` (for `DOCTOR`). Other patients, other doctors, pharmacies, laboratories, and administrators receive `403 Forbidden`. |
| **Appointment Validation** | Implemented & Unit-Tested | Rejects `IN_PERSON`, `CANCELLED`, `COMPLETED`, and unconfirmed `REQUESTED` appointments before issuing room tokens. |
| **Short-Lived Backend Room Tokens** | Implemented & Unit-Tested | Signed HS256 JWTs minted strictly server-side (`VIDEO_TOKEN_TTL_SECONDS`, default 900s) bound to `userId`, `role`, `roomName`, `appointmentId`, and `clientSessionId`. Verified with `crypto.timingSafeEqual`. |
| **Zero Frontend Provider Secrets** | Implemented | `VIDEO_LIVEKIT_API_KEY` and `VIDEO_LIVEKIT_API_SECRET` exist exclusively in `apps/api` env config and are never returned in API responses or `NEXT_PUBLIC_*` vars. |
| **Patient Telemedicine Informed Consent** | Implemented & Unit-Tested | Server-side gate rejects patient room token requests (`403 TELEMEDICINE_CONSENT_REQUIRED`) until explicit telemedicine consent and emergency disclaimer acknowledgement are stored. |
| **Encrypted Transport** | Implemented | WebRTC mandates DTLS-SRTP media encryption; signaling and token APIs run over authenticated HTTP(S) with `X-Video-Room-Token` verification. |
| **Recording Disabled by Default** | Implemented & Unit-Tested | `recordingEnabled` is hard-set to `false` in database records and LiveKit token grants (`roomRecord: false`). Any future recording feature requires separate explicit dual-party consent and a legal retention policy. |
| **Zero PHI in Room URLs, Logs & Notifications** | Implemented & Unit-Tested | Rooms use opaque random IDs (`hb-vc-<24 hex>`). Audit logs and notifications omit patient names, diagnoses, and consultation notes. |
| **Emergency Disclaimer** | Implemented & UI-Tested | Persistent non-emergency warning (`112 / 108` India Emergency Services) shown on appointment details, consent gate, waiting room, and active call interface. |
| **Admin Clinical Isolation** | Implemented & Unit-Tested | `/api/v1/telemedicine/admin/telemetry` exposes only configuration posture, aggregate counts, and anonymized failure codes (`VC-XXXXXX`). Clinical notes, room names, and tokens are strictly excluded. |
| **Browser Security Headers** | Implemented | `apps/web/next.config.mjs` permits `camera=(self), microphone=(self)` while keeping `X-Frame-Options: DENY`, HSTS, and strict CSP `connect-src`/`media-src`. |

## Pre-Production Sign-Off Items (Pending Deployment Environment)

- [ ] Provision production LiveKit API key/secret via cloud secret manager (rotate every 90 days).
- [ ] Enable TLS 1.3 + authenticated TURN relay servers for hospital/mobile NAT traversal.
- [ ] Execute penetration test verifying token replay, cross-appointment IDOR, and signaling flood rate limits in staging.
- [ ] Complete real-device mobile + desktop audio/video QA sign-off.

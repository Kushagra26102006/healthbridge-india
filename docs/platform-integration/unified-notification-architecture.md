# Unified Notification & Domain Event Architecture (Day 8 Task 01)

> **Service:** `apps/api/src/modules/platform/services/platform-event.service.ts`  
> **Underlying Infrastructure:** Reuses `NotificationService` (`NotificationModel`, `NotificationPreferenceModel`, `NotificationDeliveryModel`, SSE streaming) and `AuditLogModel` — no unnecessary external message broker introduced.

## 1. Standardized 23-Event Domain Contract (`PlatformDomainEventType`)
- **Appointment:** `APPOINTMENT_BOOKED`, `APPOINTMENT_CONFIRMED`, `APPOINTMENT_RESCHEDULED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_COMPLETED`
- **Encounter:** `ENCOUNTER_STARTED`, `ENCOUNTER_FINALIZED`, `FOLLOW_UP_REQUIRED`
- **Prescription:** `PRESCRIPTION_ISSUED`, `PRESCRIPTION_CANCELLED`, `PRESCRIPTION_DISPENSED`, `PRESCRIPTION_PARTIALLY_DISPENSED`
- **Laboratory:** `LAB_ORDER_CREATED`, `SAMPLE_COLLECTED`, `SAMPLE_REJECTED`, `TEST_COMPLETED`, `REPORT_PUBLISHED`, `REPORT_AMENDED`
- **ABDM:** `ABHA_LINKED`, `CONSENT_REQUEST_RECEIVED`, `CONSENT_APPROVED`, `CONSENT_REVOKED`, `EXTERNAL_RECORD_IMPORTED`

## 2. Privacy, Idempotency & Retry Guarantees
- **Privacy-Safe Preview Scrubbing (`sanitizePrivacySafePreview`):** Automatically strips numeric clinical values (`g/dL`, `mg/dL`, `mmol/L`, `%`, `mmHg`, etc.), diagnosis phrases, Bearer tokens, OTPs, Aadhaar numbers, and 14-digit ABHA numbers before notifications are persisted or streamed.
- **Idempotency:** Deterministic per-recipient deduplication key prevents duplicate delivery on retries.
- **Bounded Retry:** Retries transient notification persistence failures up to 2 attempts without breaking primary clinical workflows.

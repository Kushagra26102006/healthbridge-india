# HealthBridge India — Data Retention & Disposal Governance (Day 9 Task 02)

**Code Registry:** `apps/api/src/modules/privacy/data-governance.registry.ts` (`DATA_RETENTION_POLICIES`, `evaluateDeletionEligibility`)  
**Legal Hold Model:** `apps/api/src/modules/privacy/models/legal-hold.model.ts` (`LegalHoldModel`)

> **Policy Principle:** HealthBridge India does **not** invent universal statutory retention periods across Indian healthcare categories. Every clinical and regulatory retention duration is structured as a versioned, configurable policy (`v1.0-draft`, `CONFIGURABLE_PENDING_LEGAL_REVIEW`) requiring final legal counsel confirmation prior to production enforcement.

---

## 1. Separated Retention Schedule (10 Categories)

| Category (`policyKey`) | Business Purpose | Retention Status | Legal Hold | Deletion Eligibility | Archival & Disposal Strategy |
|---|---|---|---|---|---|
| `CLINICAL_RECORDS` | Continuity of care & medico-legal integrity | Configurable pending legal review | Yes | **Restricted (never auto-deleted on closure)** | Restricted read-only clinical archive; cryptographic erasure only after legal/clinical sign-off & expiry |
| `PRESCRIPTIONS` | Medication safety & dispensing accountability | Configurable pending legal review | Yes | **Restricted** | Immutable dispensing archive; audited post-retention disposal |
| `LABORATORY_REPORTS` | Diagnostic traceability & NABL quality | Configurable pending legal review | Yes | **Restricted** | Versioned read-only archive; audited post-retention disposal |
| `APPOINTMENTS` | Care coordination history | Configurable pending legal review | Yes | **Restricted** | Anonymize or restrict if linked to encounters |
| `ACCOUNT_INFORMATION` | Authentication & patient communication | Operational default (active lifecycle) | Yes | **Eligible on request** | Soft deactivation / pseudonymized stub where linked to retained clinical records |
| `AUTHENTICATION_LOGS` | Session security & reuse containment | TTL auto-expiry (`7d` refresh / `24h` post-expiry verification) | No | **Eligible on request** | MongoDB TTL automatic purge + immediate session revocation |
| `AUDIT_LOGS` | Non-repudiation & access transparency | Configurable pending legal/CERT-In review | Yes | **Immutable audit retention** | Append-only WORM/SIEM archival; protected from deletion |
| `NOTIFICATION_RECORDS` | Workflow delivery tracking | Operational rolling window | No | **Eligible on request** | Direct purge of eligible non-security operational notifications |
| `UPLOADED_DOCUMENTS` | Personal/clinical document storage | Configurable pending legal review | Yes | **Restricted** | Private encrypted archive; cryptographic key/object erasure + disposal audit |
| `EXTERNAL_INTEGRATION_RECORDS` | ABHA/ABDM provenance & consent trail | Configurable per ABDM/legal guidance | Yes | **Restricted** | Local unlink supported; external HIP copies remain governed by external facilities |

---

## 2. Legal Hold & Backup Integrity Rules

1. **Legal Hold Override (`POST /api/v1/admin/privacy/legal-holds`):** Any active `LegalHold` for a patient immediately blocks disposal eligibility across all categories (`legalHoldBlocked: true`) and causes `reviewAdminPrivacyRequest` to reject premature `COMPLETED` disposal transitions with `400 BAD_REQUEST`.
2. **Honest Backup & Replica Handling:** Disaster-recovery encrypted backups age out according to the backup lifecycle and are not falsely claimed to be instantaneously rewritten. Restored clusters must replay immutable disposal/restriction logs.

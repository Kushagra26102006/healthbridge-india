# HealthBridge India — Account Closure & Data Deletion Governance (Day 9 Task 02)

**Endpoints:**
- `POST /api/v1/patient/privacy/deletion-requests` (Patient)
- `GET /api/v1/patient/privacy/deletion-requests` (Patient)
- `POST /api/v1/admin/privacy/legal-holds` (Authorized Admin)
- `PATCH /api/v1/admin/privacy/requests/:id/review` (Authorized Admin)

---

## 1. Explicit Separation of Disposal Actions

HealthBridge distinguishes five distinct outcomes rather than offering a misleading blanket "delete everything" button:

1. **Account Deactivation (`ACCOUNT_DEACTIVATION`):** Reversible suspension of login access; all records remain preserved.
2. **Account Closure (`ACCOUNT_CLOSURE`):** Permanent closure of patient login & revocation of sessions; protected clinical records transition to restricted read-only archival.
3. **Eligible Personal Data Deletion (`DATA_DELETION`):** Erasure/redaction of eligible personal/notification fields where no active legal hold or clinical integrity dependency applies.
4. **Restricted Retention (`PARTIAL_RESTRICTED_RETENTION`):** Finalized clinical records (`CLINICAL_RECORDS`, `PRESCRIPTIONS`, `LABORATORY_REPORTS`, `AUDIT_LOGS`) remain retained under configured healthcare & medico-legal policies.
5. **Data Anonymization (`DATA_ANONYMIZATION`):** Removal of direct identifiers where operationally justified without compromising clinical/audit integrity.

---

## 2. Legal Hold, Backup & External System Transparency

- **Legal Hold Blocking:** If an active `LegalHold` exists for the patient, `createDeletionRequest` sets `legalHoldBlocked: true`, `actualDisposalOutcome: 'DEFERRED_LEGAL_HOLD'`, escalates the request, and `reviewAdminPrivacyRequest` rejects premature `COMPLETED` disposal with `400 BAD_REQUEST`.
- **Honest Backup & External HIP Caveats:** Every deletion request records explicit caveats noting that:
  - Local closure unlinks local ABHA references only and cannot remotely erase records stored independently at external hospitals, laboratories, pharmacies, or ABDM HIPs.
  - Encrypted disaster-recovery backups expire on their backup lifecycle rather than claiming instantaneous selective erasure.

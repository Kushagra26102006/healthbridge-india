# HealthBridge India — Field-Level Data Classification Framework (Day 9 Task 02)

**Code Registry:** `apps/api/src/modules/privacy/data-governance.registry.ts` (`DATA_CLASSIFICATION_REGISTRY`)

Data is classified at the **field level** (not merely by collection name), because a single collection (such as `users`) holds `PUBLIC`/display fields (`name`), `PERSONAL` contact fields (`email`, `phone`), and `AUTHENTICATION_AND_SECURITY` secrets (`passwordHash`).

---

## 1. Classification Matrix

| Tier | Inspected Field Examples | Permitted Purposes | Authorized Roles | Storage & Logging Restrictions | Retention Policy Key | Export Eligible | Deletion Eligible |
|---|---|---|---|---|---|---|---|
| **PUBLIC** | `doctorProfile.specialization`, `pharmacy.publicName`, `privacyNotice.sections` | Public discovery, transparency | Public + all 5 roles | Standard storage & operational logs permitted. | `ACCOUNT_INFORMATION` | No (already public) | Yes |
| **INTERNAL** | `outboxEvent.status`, `labSample.accessionStatus`, `pharmacyInventory.batchQuantity` | Healthcare coordination, platform operations | `DOCTOR`, `PHARMACY`, `LABORATORY`, `ADMIN` | Operational telemetry only; exclude patient identifiers. | `NOTIFICATION_RECORDS` | No | Restricted operational |
| **PERSONAL** | `user.name`, `user.email`, `user.phone`, `patientProfile.dateOfBirth`, `patientProfile.address` | Patient self-access, treatment, coordination, account administration | `PATIENT` (self), `DOCTOR` (care scope), `ADMIN` (account admin) | Minimize in logs; mask contact details where non-essential. | `ACCOUNT_INFORMATION` | **Yes** | **Eligible on request** (subject to legal hold / clinical linkage stub) |
| **SENSITIVE HEALTH INFORMATION** | `medicalRecord.description`, `medicalRecord.fileData`, `encounter.diagnosis`, `prescription.medications`, `labReport.observations` | Patient self-access, treatment, pharmacy fulfillment, lab service, consented ABDM exchange | `PATIENT` (self), `DOCTOR` (consented/assigned), `PHARMACY` (eligible Rx), `LABORATORY` (assigned order). **ADMIN denied automatic unrestricted access.** | Encrypted in transit/at rest; **STRICTLY PROHIBITED** in application logs, audit metadata, search logs, and notification previews. | `CLINICAL_RECORDS`, `PRESCRIPTIONS`, `LABORATORY_REPORTS`, `UPLOADED_DOCUMENTS` | **Yes** (eligible patient copy) | **Restricted Retention** (never auto-deleted on account closure) |
| **AUTHENTICATION & SECURITY DATA** | `user.passwordHash`, `refreshToken.tokenHash`, `verificationToken.tokenHash`, `auditLog.*` | Authentication, breach containment, security non-repudiation | `ADMIN` (audit metadata only; hashes never exposed to any role) | `select: false` + `toJSON`/`toObject` stripping; Pino redaction; append-only immutability on `AuditLog` & `DataAccessEvent`. | `AUTHENTICATION_LOGS`, `AUDIT_LOGS` | **Never** (scrubbed via `SECRET_FIELDS_REGEX`) | Tokens TTL-expire; `AuditLog` non-deletable |
| **EXTERNAL INTEGRATION DATA** | `abhaLink.abhaNumberEncrypted`, `consentArtifact.*`, `abdmImportedRecord.*` | Consented ABDM health information exchange, patient self-access | `PATIENT` (self), `DOCTOR` (consented), `ADMIN` (integration health metadata) | ABHA numbers & OTPs redacted in logs; external provenance preserved (`source: 'ABDM_INGESTION'`). | `EXTERNAL_INTEGRATION_RECORDS` | **Yes** (consent history & eligible refs, excluding raw secrets) | **Restricted** (local unlink only; external HIP copies unaffected) |

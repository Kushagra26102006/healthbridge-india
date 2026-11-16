# Laboratory Report Generation Workflow

## 1. Overview
The Laboratory Report Generation module in HealthBridge India compiles actual structured diagnostic observations recorded during pre-analytical and analytical processing into verified, professional healthcare reports. Conforming to NABL ISO 15189, ABDM, and HL7 FHIR standards, diagnostic reports never contain simulated results or invented biological reference ranges.

---

## 2. State Machine Lifecycle

```
[ ORDER PLACED ]
        │
        ▼
[ SAMPLES COLLECTED & ACCESSIONED ]
        │
        ▼
[ TEST RESULTS ENTERED ] (TestResultModel)
        │
        ▼
[ DRAFT COMPILED ] (LaboratoryReportModel, v1.0)
        │
        ├──▶ [ PENDING_REVIEW ] ──▶ [ UNDER_REVIEW ]
        │            │
        │            ├──▶ REJECTED (Reverts to DRAFT with justification)
        │            └──▶ CORRECTION_REQUESTED (Reverts to DRAFT with notes)
        │
        ▼
[ APPROVED ] (Pathologist identity, designation & registration bound)
        │
        ▼
[ PUBLISHED ] (Official PDF-1.4 generated, SHA-256 seal, notifications dispatched)
        │
        ├──▶ [ AMENDMENT REQUESTED ] ──▶ v1.0 Archived in LabReportVersionModel
        │                                  │
        │                                  ▼
        │                              [ DRAFT v2.0 ] (Requires re-review & re-approval)
        │                                  │
        ▼                                  ▼
   [ AMENDED ] ◀─────────────────── [ PUBLISHED v2.0 ]
```

---

## 3. Eligibility Validation Rules

Before compilation of any report draft, the backend executes rigorous eligibility checks:

1. **Order Existence & Ownership**: The referenced `LaboratoryOrder` must exist, must not be in `CANCELLED` status, and must belong to the requesting laboratory tenant.
2. **Specimen Accessioning Guard**: All associated specimens (`LabSampleModel`) must be in valid pre-analytical states (`ACCESSIONED` or `RECEIVED`). If any specimen has been rejected (`REJECTED`) or is still awaiting collection (`COLLECTION_PENDING`), report generation is rejected immediately (`400 Bad Request`).
3. **Persisted Test Results Check**: Completed parameter results (`TestResultModel`) must be present in the database. Drafting fails if results have not yet been registered.
4. **Duplicate Prevention Guard**: If an existing report for the order is already in `PUBLISHED` or `AMENDED` status, compiling a new draft directly is blocked (`409 Conflict`). Corrections must follow the formal amendment workflow.

---

## 4. Multi-Test Result Composition

Diagnostic orders frequently encompass multiple test batteries (e.g., Complete Blood Count, Lipid Profile, Liver Function Tests). The report compiler:
- Merges all parameter entries from `TestResultModel` into an immutable `observations` array.
- Evaluates parameter values against biological reference ranges:
  - Numeric values: flags `LOW`, `HIGH`, `CRITICAL` based on normal and panic threshold ranges.
  - Qualitative values: flags `NORMAL` or `ABNORMAL`.
- Sets global report severity flags (`hasAbnormalResults: boolean`, `hasCriticalResults: boolean`).
- Assigns a unique reference number formatted as `LBR-YYYY-XXXXXX`.

---

## 5. Security & Privacy Controls

- **Tenant Isolation**: Laboratory A cannot draft or access Laboratory B reports.
- **Patient Privacy**: Draft and unapproved reports are completely hidden from patient endpoints (`403 Forbidden`).
- **Audit Ledger**: Every draft compilation event records an immutable entry in `AuditLogModel` capturing actor, order reference, generated report ID, and timestamp.
- **Privacy-Safe Notifications**: Notifications sent upon draft compilation (`LAB_REPORT_GENERATED`) contain operational references only—never leaking sensitive diagnostic or numerical data in previews.

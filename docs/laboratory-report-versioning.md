# Laboratory Report Versioning & Amendment Workflow

## 1. Overview
In clinical laboratory medicine, once a diagnostic report has been released to a patient or ordering doctor, it **must never be silently overwritten or deleted**. HealthBridge India implements an immutable version ledger architecture via `LabReportVersionModel` that archives full historical report snapshots upon every statutory amendment.

---

## 2. Inviolable Immutability Principles

1. **No In-Place Modification of Published Reports**: A report in `PUBLISHED` or `AMENDED` status cannot be directly modified through standard update APIs.
2. **Permanent Snapshot Archival**: Before any correction can take effect, a complete snapshot of the current version (including document hash, binary PDF buffer, observations, and approval metadata) is saved into `LabReportVersionModel`.
3. **Mandatory Amendment Justification**: Every amendment request requires an explicit statutory reason (min 5 chars) and a detailed clinical explanation (min 10 chars).
4. **Re-Review & Re-Approval Cycle**: When an amendment is initiated, the report's `currentVersion` is incremented (e.g., v1 -> v2) and its status reverts to `DRAFT`. It must undergo full pathologist review and approval again before publication as `AMENDED`.
5. **No Historical Concealment**: Earlier report versions remain accessible to authorized reviewers and auditors according to healthcare record retention policy.

---

## 3. Database Model Architecture (`LabReportVersionModel`)

```typescript
export interface ILabReportVersionDocument extends Document {
  reportId: Types.ObjectId;                  // Reference to LaboratoryReport
  reportNumber: string;                      // Stable report identifier (e.g., LBR-2026-9041)
  version: number;                           // Sequence counter (1, 2, 3...)
  status: LabReportStatus;                   // Status snapshot (PUBLISHED / AMENDED)
  contentSnapshot: Record<string, unknown>;  // Full immutable document payload
  documentHash: string;                      // SHA-256 hash of the generated PDF
  documentBuffer?: Buffer;                   // Binary archive of the rendered PDF
  documentFileSize?: number;                 // Byte length
  createdBy: Types.ObjectId;                 // Staff who initiated amendment
  createdByName?: string;                    // Staff display name
  createdAt: Date;                           // Timestamp of archival
  amendmentReason?: string;                  // Statutory reason
  changedFields?: string[];                  // Affected parameter codes (e.g. ['HB', 'WBC'])
  approvalSnapshot?: {                       // Approval attribution snapshot
    approvedByName: string;
    approvedAt: Date;
    comments?: string;
  };
}
```

Compound Index: `{ reportId: 1, version: 1 }` (Unique).

---

## 4. Frontend Version Ledger (`/laboratory/reports/[id]/versions`)

The version history view renders:
- Chronological timeline of all historical versions.
- Visual distinction between **CURRENT ACTIVE** and **SUPERSEDED ARCHIVE** versions.
- Explicit display of statutory amendment reasons and modified parameter codes.
- Cryptographic SHA-256 seal for each archived version.
- Action button to download the historical PDF buffer matching that exact revision snapshot.

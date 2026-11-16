# Professional PDF Reports & Document Security

## 1. Overview
Diagnostic reports produced by HealthBridge India must meet standard healthcare presentation criteria, maintain high typographic consistency, support multi-page examination batteries, and provide tamper-evident cryptographic integrity seals.

---

## 2. Server-Side PDF Generation Service (`ReportPdfService`)

Report rendering is executed securely server-side:
- **Standard Conformance**: Generates valid PDF-1.4 documents without requiring client-side binary execution.
- **Header Section**:
  - Laboratory name in prominent uppercase typography.
  - Accreditation statement: `NABL ACCREDITED MEDICAL TESTING LABORATORY • ABDM DIAGNOSTIC COMPLIANT`.
  - Facility address and contact information.
  - Report reference, current version badge (`v1.0` or `v2.0 (AMENDED)`), and status.
- **Patient Context**: Patient name, ABHA identifier, referring doctor, order reference number.
- **Tabular Parameters**:
  - Investigation parameter name (truncated safely to prevent overflow).
  - Observed numerical or text value with unit.
  - Biological reference range.
  - Abnormal / Critical alert indicators (`[HIGH]`, `[LOW]`, `[CRITICAL]`).
- **Clinical Impression**: Pathologist interpretation and pre-analytical laboratory notes.
- **Attestation & Signature**: Reviewer name, designation, and Medical Council registration number.

---

## 3. Cryptographic Document Seal (SHA-256)

Upon PDF generation, `ReportPdfService` calculates a SHA-256 cryptographic digest of the raw binary buffer:
```typescript
const hash = crypto.createHash('sha256').update(buffer).digest('hex');
```
- The hash is persisted in `LaboratoryReportModel.documentHash` and `signatureMetadata.documentHash`.
- The hash is transmitted in the HTTP response header `X-Document-SHA256` during document streaming.
- Any unauthorized post-generation tampering immediately invalidates the cryptographic checksum.

> **Important Security Limitation Note**: In this milestone, the digital seal utilizes internal SHA-256 cryptographic digests and server-side attestation. External Aadhaar eSign, Digital Signature Certificates (DSC Class 3), and hardware security modules (HSM) are deferred to dedicated statutory gateway integrations.

---

## 4. Secure Document Access & RBAC Matrix

PDF documents are served exclusively via authorized server-side streaming endpoints (`GET /api/v1/laboratory/reports/:id/pdf` and `GET /api/v1/lab-reports/:id/download`). Direct, unauthenticated file paths or cloud storage URLs are never exposed.

| Role | Permitted Access Scope | Draft Access Policy |
| :--- | :--- | :--- |
| `LABORATORY` | Access to reports matching authenticated laboratory ID | Full read, review, and approve access |
| `PATIENT` | Access exclusively to own reports (`patientId === req.user.id`) | **Strictly blocked (403 Forbidden)**; only published/amended reports visible |
| `DOCTOR` | Access to reports for ordering encounters or consented patients | Read-only; draft reports blocked without explicit clinical delegation |
| `PHARMACY` | None | **Strictly blocked (403 Forbidden)**; laboratory reports inaccessible |
| `ADMIN` | System audit and regulatory review | Full read access with immutable audit logging |

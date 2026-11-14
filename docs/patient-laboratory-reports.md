# HealthBridge India — Patient Laboratory Reports & Diagnostic Results Management

## 1. Architectural Overview

The **Patient Laboratory Reports & Diagnostic Results Management** module provides an authenticated, patient-facing diagnostic information portal within India's ABHA/ABDM unified digital health architecture. It empowers Indian citizens to securely access, review, and download their laboratory test results and monitor pending diagnostic test orders issued by registered medical practitioners.

### Core Architectural Pillars
- **Zero-Trust Patient Scoping**: Every query and document streaming request is authenticated against server-verified JWT claims (`req.user.userId`). Direct object reference (IDOR) attempts to access reports belonging to other patients are rejected immediately with `403 Forbidden`.
- **Structured Observation Schema**: Test results are stored as structured quantitative observations (LOINC-aligned) with test codes, measured values, units, biological reference intervals, and evaluation flags (`NORMAL`, `ABOVE_RANGE`, `BELOW_RANGE`, `NOT_AVAILABLE`).
- **NABL Laboratory Verification**: Highlights NABL accreditation status, laboratory license identifiers, and verifying pathologist details to establish medical trust.
- **Controlled Document Streaming**: Medical PDF reports are streamed securely over authorized HTTP endpoints (`/api/v1/lab-reports/:reportId/download`) rather than exposing unprotected public storage bucket URLs.
- **Clear Clinical Disclaimer & Boundary**: In compliance with medical safety guidelines, the platform strictly presents verified clinical laboratory findings. It explicitly **does not** perform automated diagnostic interpretations or alter therapeutic guidance.

---

## 2. API Endpoints Specification

### 2.1 Laboratory Reports API (`/api/v1/lab-reports`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/lab-reports` | JWT Bearer | `PATIENT` | Paginated diagnostic reports for authenticated patient with search, category, status, and date range filters |
| `GET` | `/api/v1/lab-reports/summary` | JWT Bearer | `PATIENT` | Aggregate counts: total reports, completed, pending verification, and reports with abnormal observations |
| `GET` | `/api/v1/lab-reports/:reportId` | JWT Bearer | `PATIENT` | Full report details including structured quantitative observation table, pathologist verification, and PDF metadata |
| `GET` | `/api/v1/lab-reports/:reportId/download` | JWT Bearer | `PATIENT` | Authorized streaming PDF download with `Content-Disposition: attachment` |

### 2.2 Diagnostic Test Orders API (`/api/v1/lab-orders`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/lab-orders` | JWT Bearer | `PATIENT` | Paginated requisition orders issued by doctors, with status tabs (`ORDERED`, `SAMPLE_COLLECTED`, `IN_ANALYSIS`, `COMPLETED`, `CANCELLED`) |
| `GET` | `/api/v1/lab-orders/:orderId` | JWT Bearer | `PATIENT` | Individual diagnostic order details, ordered tests breakdown, collection instructions, and direct link to completed report |

---

## 3. Database Schema & Models

### 3.1 Laboratory Report (`LabReport`) Model
Defined in `apps/api/src/modules/healthcare/models/lab-report.model.ts`:

```typescript
const ObservationSchema = new Schema({
  code: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  unit: { type: String, trim: true, default: '' },
  referenceRange: { type: String, trim: true, default: '' },
  interpretation: {
    type: String,
    enum: ['NORMAL', 'ABOVE_RANGE', 'BELOW_RANGE', 'NOT_AVAILABLE', 'ABNORMAL', 'CRITICAL'],
    default: 'NORMAL',
  },
  notes: { type: String, trim: true },
});

const LabReportSchema = new Schema({
  reportNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'LabOrder', index: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
  facilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
  testName: { type: String, required: true, trim: true, index: true },
  category: {
    type: String,
    enum: ['BLOOD_TESTS', 'URINE_TESTS', 'BIOCHEMISTRY', 'HEMATOLOGY', 'IMAGING', 'MICROBIOLOGY', 'OTHER'],
    default: 'BLOOD_TESTS',
    index: true,
  },
  testDate: { type: Date, required: true, index: true },
  reportDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['DRAFT', 'PRELIMINARY', 'COMPLETED', 'AMENDED', 'CANCELLED'],
    default: 'COMPLETED',
    index: true,
  },
  observations: [ObservationSchema],
  documentUrl: { type: String },
  documentMimeType: { type: String, default: 'application/pdf' },
  documentFileSize: { type: Number },
  documentBuffer: { type: Buffer, select: false },
  laboratoryName: { type: String, required: true },
  nablAccreditationNumber: { type: String },
  performedBy: { type: String },
  verifiedBy: { type: String },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'VERIFIED',
  },
  clinicalNotes: { type: String },
}, { timestamps: true });

// Compound indexes for rapid patient queries
LabReportSchema.index({ patientId: 1, testDate: -1 });
LabReportSchema.index({ patientId: 1, category: 1, testDate: -1 });
```

### 3.2 Diagnostic Requisition Order (`LabOrder`) Model
Defined in `apps/api/src/modules/healthcare/models/lab-order.model.ts`:

```typescript
const LabOrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  laboratoryId: { type: Schema.Types.ObjectId, ref: 'User' },
  facilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
  tests: [{
    code: { type: String },
    name: { type: String, required: true },
    category: { type: String },
    instructions: { type: String },
  }],
  orderDate: { type: Date, default: Date.now, index: true },
  collectionDate: { type: Date },
  collectionStatus: {
    type: String,
    enum: ['PENDING', 'COLLECTED'],
    default: 'PENDING',
  },
  status: {
    type: String,
    enum: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED'],
    default: 'ORDERED',
    index: true,
  },
  clinicalNotes: { type: String },
  reportId: { type: Schema.Types.ObjectId, ref: 'LabReport' },
}, { timestamps: true });

LabOrderSchema.index({ patientId: 1, status: 1, orderDate: -1 });
```

---

## 4. Structured Quantitative Observations & Reference Ranges

Diagnostic reports store individual test analytes in an array of `LabObservationDto`:

```typescript
export interface LabObservationDto {
  code?: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: 'NORMAL' | 'ABOVE_RANGE' | 'BELOW_RANGE' | 'NOT_AVAILABLE' | 'ABNORMAL' | 'CRITICAL';
  notes?: string;
}
```

### Visual Evaluation & Status Indicators
In the `LabResultTable` component (`apps/web/src/components/patient/lab-reports/LabResultTable.tsx`):
- **Normal (`NORMAL`)**: Soft emerald badge (`bg-emerald-500/10 text-emerald-700`) with check indicator.
- **Above Range (`ABOVE_RANGE` / `ABNORMAL`)**: Amber warning badge (`bg-amber-500/10 text-amber-700`) with upward alert icon.
- **Below Range (`BELOW_RANGE`)**: Blue information badge (`bg-sky-500/10 text-sky-700`) with downward alert icon.
- **Critical (`CRITICAL`)**: Rose danger badge (`bg-rose-500/10 text-rose-700`) with high-priority alert.
- **Not Available (`NOT_AVAILABLE`)**: Neutral slate badge (`bg-slate-100 text-slate-500`).

---

## 5. Document Streaming & Security Architecture

### 5.1 Authorization & Patient Verification
When a patient requests document download:
1. `authenticateToken` decodes the JWT and validates active session state.
2. `requireRole('PATIENT')` ensures only authorized patient sessions proceed.
3. The query strictly verifies:
   ```typescript
   const report = await LabReport.findOne({ _id: reportId, patientId: currentUserId });
   if (!report) {
     return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
   }
   ```
4. If the report belongs to another patient, a `403 Forbidden` response is returned immediately.

### 5.2 PDF Generation & Streaming Headers
Reports stream with standard binary payload headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="${safeReportNumber}.pdf"`
- `Content-Length: <size_in_bytes>`
- `Cache-Control: private, no-cache, no-store, must-revalidate`

If no binary buffer exists on disk, the service dynamically generates an NABL-formatted clinical PDF using standard PDF/A metadata including patient ABHA address, requesting physician, testing facility, and structured observation table.

---

## 6. ABDM / FHIR R4 Diagnostic Integration Mapping

The module models align with Ayushman Bharat Digital Mission (ABDM) and HL7 FHIR R4 diagnostic standards:

| HealthBridge Concept | FHIR R4 Resource | Path / Field Mapping |
|---|---|---|
| Laboratory Report | `DiagnosticReport` | `status`: `final` / `amended`<br>`category`: `http://terminology.hl7.org/CodeSystem/v2-0074`<br>`code`: Diagnostic test panel code |
| Quantitative Result | `Observation` | `code.coding.system`: `http://loinc.org`<br>`valueQuantity.value` / `valueQuantity.unit`<br>`referenceRange.low` / `referenceRange.high`<br>`interpretation`: `http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation` |
| Lab Order Requisition | `ServiceRequest` | `intent`: `order`<br>`priority`: `routine` / `urgent`<br>`code`: Ordered laboratory procedure |
| Specimen & Collection | `Specimen` | `collection.collectedDateTime`<br>`type`: Blood / Urine specimen |

---

## 7. Frontend User Experience Architecture

The frontend implementation is organized under `apps/web/src/components/patient/lab-reports/` and `apps/web/src/features/lab-reports/`:

1. **Overview & Metrics (`/patient/lab-reports`)**:
   - `LabReportSummary`: Visual KPI cards summarizing total, completed, pending, and abnormal reports.
   - `LabReportFilters`: Multi-criteria filter bar supporting keyword search, category pills (`BLOOD_TESTS`, `URINE_TESTS`, `BIOCHEMISTRY`, `HEMATOLOGY`, `IMAGING`, `MICROBIOLOGY`, `OTHER`), status filters, and date picker ranges.
   - `LabReportList` & `LabReportCard`: Displays accredited laboratory, test date, observation count, abnormal badge, and direct download CTA.

2. **Detailed Observation View (`/patient/lab-reports/[reportId]`)**:
   - `LabReportDetails`: Comprehensive header with NABL accreditation number, pathologist sign-off, and laboratory details.
   - `LabResultTable`: Full quantitative observation table with reference ranges.
   - `LabDocumentPreview`: Sandboxed interactive PDF viewer with fallback download buttons.

3. **Requisition Tracking (`/patient/lab-orders`)**:
   - `LabOrderCard` & `LabOrderList`: Status tracker for ordered tests (`ORDERED` -> `SAMPLE_COLLECTED` -> `IN_ANALYSIS` -> `COMPLETED`).
   - `[orderId]/page.tsx`: Breakdown of requested analytes, fasting instructions, and direct link to completed report once verified.

---

## 8. Clinical Disclaimer & Non-Diagnostic Boundary

To uphold medical safety and regulatory standards:
- Every page presents a permanent notice:
  > **Clinical Disclaimer**: "Laboratory results should always be reviewed with a qualified healthcare professional. Biological reference ranges and interpretation vary according to laboratory instrumentation, age, gender, and clinical context. This platform does not provide automated diagnostic decisions."
- The system never suggests diagnoses, differential diagnoses, or drug prescriptions based on abnormal flags.

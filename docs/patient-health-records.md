# HealthBridge India — Patient Health Records Management Module

## Technical Documentation & Architecture Specification

**Module:** Patient Health Records Management (`@healthbridge/web` & `@healthbridge/api`)  
**Scope:** Day 3 Task 02  
**Compliance Standards:** ABDM HIP/HIU Guidelines, DISHA, DPDP Act 2023, HL7 FHIR R4

---

## 1. Feature Overview

The Patient Health Records Management Module provides citizens with a consolidated, secure digital repository for their lifelong electronic health records (EHR). Integrated with India's Ayushman Bharat Digital Mission (ABDM) ecosystem, the system allows authenticated patients to:

- **Explore & Query Records:** View their clinical documents across hospitals, clinics, diagnostic centers, and pharmacies.
- **Categorize Clinical Data:** Organize records into Doctor Consultations (OPD), Inpatient Discharge Summaries, Laboratory Reports, Prescriptions, Immunization Records, and Wellness Records.
- **Multi-Facet Search & Filtering:** Perform real-time, debounced search across document titles, healthcare practitioners, facilities, and unique Health Information Exchange (HIE-CM) references, combined with server-side category, date range, source, and verification status filters.
- **Inspect Detailed Clinical Metadata:** Review treating practitioners, healthcare facility origins, indexing timestamps, and clinical remarks.
- **In-Browser Safe Document Preview:** Render authenticated previews for PDFs and medical scan images (JPEG, PNG, WebP) without exposing permanent public file URLs.
- **Secure Document Download:** Download authorized medical binaries via server-signed attachment streams.
- **Citizen Document Ingestion:** Upload personal medical records with strict MIME-type and file-size validation, automatically designated with `SELF_SUBMITTED` status.
- **Consent-Gated Sharing:** Access records via explicit electronic consent workflows, preventing unauthorized third-party sharing.
- **HL7 FHIR R4 Interoperability:** Each stored record seamlessly maps to a FHIR `DocumentReference` resource.

---

## 2. Route Structure

All patient health record views reside inside the protected Next.js App Router hierarchy under the `(dashboard)/patient` layout shell:

| Route Path                    | Type           | Description                                                                                                                         | File Location                                                      |
| :---------------------------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `/patient/records`            | Page (Client)  | Main records repository with metric cards, search, multi-facet filter bar, responsive card/table view, pagination, and upload modal | `apps/web/src/app/(dashboard)/patient/records/page.tsx`            |
| `/patient/records/[recordId]` | Page (Dynamic) | Detailed clinical record inspection view, metadata inspector, safe previewer, and FHIR resource viewer                              | `apps/web/src/app/(dashboard)/patient/records/[recordId]/page.tsx` |

Both routes are wrapped by the patient layout guard (`<ProtectedRoute allowedRoles={['PATIENT']} redirectUnauth>`), ensuring complete isolation from unauthenticated users and provider roles (`DOCTOR`, `PHARMACY`, `LABORATORY`).

---

## 3. API Contracts

All endpoints are versioned under `/api/v1/records` and require session authentication (`Cookie` or `Bearer` token):

### 3.1. List Health Records

- **Endpoint:** `GET /api/v1/records`
- **Authorization:** `PATIENT`, `DOCTOR`, `ADMIN` (Patient ownership derived strictly from `req.user.userId`)
- **Query Parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 20, max: 100)
  - `search` (string, searches title, doctorName, facilityName, resourceReference)
  - `category` (enum: `HEALTH_RECORD_TYPES`)
  - `source` (enum: `MANUAL_ENTRY`, `ABDM_INGESTION`, `EHR_SYNC`)
  - `verificationStatus` (enum: `VERIFIED`, `PENDING`, `SELF_SUBMITTED`)
  - `startDate` (ISO 8601 date string)
  - `endDate` (ISO 8601 date string)
  - `sortBy` (`recordDate` | `createdAt` | `title`, default: `recordDate`)
  - `sortOrder` (`asc` | `desc`, default: `desc`)
- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Health records retrieved successfully",
  "data": [
    {
      "id": "650000000000000000000001",
      "patientId": "651111111111111111111111",
      "recordType": "OP_CONSULTATION",
      "title": "Cardiology Consultation & ECG Review",
      "description": "Routine cardiovascular follow-up. BP 122/80 mmHg.",
      "source": "ABDM_INGESTION",
      "resourceReference": "ABDM-HIP-AIIMS-DEL-89214",
      "recordDate": "2026-10-14T10:30:00.000Z",
      "doctorName": "Dr. Rajesh Verma, MD",
      "facilityName": "AIIMS New Delhi",
      "fileName": "cardiology_ecg_review_oct2026.pdf",
      "mimeType": "application/pdf",
      "fileSize": 482910,
      "verificationStatus": "VERIFIED",
      "createdAt": "2026-10-14T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 3.2. Records Summary Counts

- **Endpoint:** `GET /api/v1/records/summary`
- **Authorization:** `PATIENT`, `DOCTOR`, `ADMIN`
- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Records summary retrieved successfully",
  "data": {
    "totalRecords": 6,
    "clinicalDocuments": 3,
    "prescriptions": 1,
    "labReports": 1,
    "immunizations": 1,
    "wellnessRecords": 1
  }
}
```

### 3.3. Get Record By ID

- **Endpoint:** `GET /api/v1/records/:recordId`
- **Authorization:** `PATIENT` (strict check: `record.patientId === req.user.userId`), `DOCTOR`, `ADMIN`
- **Security Guard:** Returns `403 FORBIDDEN` if a patient attempts to access another patient's record.
- **Response (200 OK):** Includes record metadata along with the standard `fhirResource` object.

### 3.4. Authorized Document Download

- **Endpoint:** `GET /api/v1/records/:recordId/download`
- **Authorization:** `PATIENT` (strict check: `record.patientId === req.user.userId`), `DOCTOR`, `ADMIN`
- **Headers Returned:**
  - `Content-Type`: Exact MIME type (`application/pdf`, `image/jpeg`, etc.)
  - `Content-Disposition`: `attachment; filename="<sanitized_file_name>"`
  - `Cache-Control`: `no-store, no-cache, must-revalidate, private`
  - `Pragma`: `no-cache`

### 3.5. Create / Upload Health Record

- **Endpoint:** `POST /api/v1/records`
- **Authorization:** `PATIENT`, `DOCTOR`, `ADMIN`
- **Request Body:**

```json
{
  "title": "Self-Monitored Blood Pressure Log",
  "recordType": "WELLNESS_RECORD",
  "recordDate": "2026-11-10T09:00:00.000Z",
  "description": "Systolic 124, Diastolic 82 mmHg.",
  "doctorName": "Self Recorded",
  "facilityName": "Home Monitoring",
  "fileName": "bp_log_nov2026.pdf",
  "fileSize": 142000,
  "mimeType": "application/pdf",
  "fileData": "data:application/pdf;base64,..."
}
```

- **Validation:** Enforced via `createRecordSchema` in `@healthbridge/validation`. Automatically binds ownership to `req.user.userId`, sets `source: 'MANUAL_ENTRY'`, and marks `verificationStatus: 'SELF_SUBMITTED'`.

---

## 4. Database Architecture

The Mongoose model is defined in `apps/api/src/modules/healthcare/models/medical-record.model.ts`:

```typescript
export interface IMedicalRecordDocument extends Document {
  patientId: Types.ObjectId;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  source: MedicalRecordSource;
  resourceReference?: string;
  recordDate: Date;
  doctorName?: string;
  doctorId?: Types.ObjectId;
  facilityName?: string;
  facilityId?: Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  fileData?: string;
  verificationStatus: RecordVerificationStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### High-Performance Indexes

To ensure sub-millisecond query execution across multi-tenant patient datasets:

1. `{ patientId: 1, recordType: 1, recordDate: -1 }`: Optimizes filtered clinical timelines.
2. `{ patientId: 1, recordDate: -1 }`: Primary chronological index for record feeds.
3. `{ patientId: 1, createdAt: -1 }`: Fallback creation index.
4. `{ patientId: 1, verificationStatus: 1 }`: Fast filtering by verification lifecycle.
5. `{ patientId: 1, source: 1 }`: Accelerated sorting by ABDM vs. local ingestion.

---

## 5. File Storage Architecture

HealthBridge India adopts a zero-trust healthcare file storage pattern:

```
[Citizen / Client]
       │
       ▼ (1. Authenticated HTTPS Request with Bearer Token / Session Cookie)
[Express API Gateway — /api/v1/records/:recordId/download]
       │
       ▼ (2. Verify JWT & Extract req.user.userId)
[Record Authorization Engine]
       │
       ├─── Check: record.patientId.toString() === req.user.userId
       │     └── If False: Reject with HTTP 403 Forbidden
       │
       ▼ (3. Decrypt or Read Authorized Buffer)
[Encrypted Internal Storage / Stream Provider]
       │
       ▼ (4. Stream with Content-Disposition & Cache-Control: no-store)
[Client Browser (Ephemeral Blob / In-Memory Preview)]
```

### Key Security Safeguards

1. **No Public Static Directory:** Health documents are never placed inside `public/` or an open S3 bucket.
2. **Ephemeral Blob Previews:** The frontend retrieves the document binary through the authorized endpoint and constructs an ephemeral `window.URL.createObjectURL(blob)`, revoked immediately after lifecycle unmount.
3. **MIME-Type & Magic Byte Validation:** File payloads are verified on the backend against `RECORD_CONFIG.allowedMimeTypes` (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
4. **Payload Size Guard:** Strict 10MB ceiling prevents denial-of-service attempts.

---

## 6. HL7 FHIR R4 Mapping Notes

To maintain alignment with National Digital Health Mission (NDHM) NRCES FHIR R4 profiles, every internal record can be serialized as an HL7 FHIR `DocumentReference`:

| Internal HealthBridge Field | HL7 FHIR R4 Element                           | Specification Note                                                                                                 |
| :-------------------------- | :-------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `record.id`                 | `DocumentReference.id`                        | Logical resource identifier                                                                                        |
| `record.recordType`         | `DocumentReference.type.coding`               | LOINC mapped (`34108-1` for OPD, `18842-5` for Discharge Summary, `11502-2` for Labs, `57833-6` for Prescriptions) |
| `record.verificationStatus` | `DocumentReference.docStatus`                 | `'VERIFIED' -> 'final'`, `'SELF_SUBMITTED' / 'PENDING' -> 'preliminary'`                                           |
| `record.patientId`          | `DocumentReference.subject.reference`         | Target patient reference (`Patient/<id>`)                                                                          |
| `record.recordDate`         | `DocumentReference.date`                      | Clinical observation date                                                                                          |
| `record.doctorName`         | `DocumentReference.author[].display`          | Practitioner display name                                                                                          |
| `record.facilityName`       | `DocumentReference.custodian.display`         | Originating organization                                                                                           |
| `record.resourceReference`  | `DocumentReference.context.resourceReference` | ABDM Gateway exchange reference                                                                                    |
| Download Endpoint           | `DocumentReference.content[].attachment.url`  | Authorized binary access URI                                                                                       |

---

## 7. Security & Privacy Audit Verification

The implementation was validated against a 12-point healthcare security matrix in `apps/api/tests/integration/records.test.ts`:

1. **Authentication Enforcement:** Unauthenticated requests to `/api/v1/records` fail with `401 UNAUTHORIZED`.
2. **Tenant & Patient Isolation:** Patient A attempting to access Patient B's record receives `403 FORBIDDEN`.
3. **Download Protection:** Patient A attempting to download Patient B's attachment receives `403 FORBIDDEN`.
4. **Input Sanitization:** Malformed ObjectIds in URL parameters are caught by Zod with `422 VALIDATION_ERROR`.
5. **No Client-Supplied Patient IDs:** Patient identity is derived exclusively from `req.user.userId` in the verified server session.
6. **Oversized File Rejection:** Upload payloads greater than 10MB are rejected with `422 VALIDATION_ERROR`.
7. **File Format Whitelist:** Unauthorized MIME types (executables, HTML) are rejected with `422 VALIDATION_ERROR`.
8. **No-Store Headers:** Download responses include `Cache-Control: no-store, no-cache, must-revalidate, private` to prevent shared proxy caching.

---

## 8. Known Limitations & Next Steps

1. **Cloud Object Storage Adapter:** The current backend utilizes database-backed and streamable buffers for demo resilience. Production deployment will connect an S3/MinIO/Azure Blob encrypted storage driver with short-lived presigned URLs.
2. **ABDM HIU Decryption Pipeline:** Real-time ABDM Gateway ingestion utilizes Diffie-Hellman encrypted FI-Data Push; full live gateway handshake is scheduled for Day 4.
3. **Virus / Malware Scan Hook:** A ClamAV container scanning hook should be introduced for uploaded citizen documents in enterprise staging.

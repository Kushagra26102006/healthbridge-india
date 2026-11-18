# ABDM FHIR R4 DocumentBundle Generation & Validation

> **Service:** `apps/api/src/modules/abdm/services/abdm-fhir-bundle.service.ts`  
> **Validator:** `apps/api/src/modules/abdm/validators/fhir-r4.validator.ts`  
> **Telemetry Model:** `AbdmFhirMappingResultModel`  
> **Honesty Statement:** `officialIgConformanceClaimed: false` — internal structural validation verifies NRCeS ABDM DocumentBundle rules deterministically, but official NRCeS `ndhm.in` IG conformance is **NOT** claimed until validated externally using the HAPI FHIR CLI Validator against the official `package.tgz`.

## 1. Supported ABDM Document Profiles
| HI Type | NRCeS Composition Profile | Bundled Resources |
|---|---|---|
| `OPConsultation` | `OPConsultRecord` | `Composition`, `Patient`, `Practitioner`, `Organization`, `Encounter`, `Observation` (vitals), `MedicationRequest` (optional), `Provenance` |
| `Prescription` | `PrescriptionRecord` | `Composition`, `Patient`, `Practitioner`, `Organization`, `MedicationRequest`, `Provenance` |
| `DiagnosticReport` | `DiagnosticReportRecord` | `Composition`, `Patient`, `Practitioner`, `Organization`, `DiagnosticReport`, `Observation`, `ServiceRequest`, `Specimen`, `Provenance` |
| `DischargeSummary` | `DischargeSummaryRecord` | `Composition`, `Patient`, `Practitioner`, `Organization`, `Encounter`, `Observation`, `Provenance` |
| `HealthDocumentRecord` | `HealthDocumentRecord` | `Composition`, `Patient`, `Practitioner`, `Organization`, `DocumentReference`, `Provenance` |

## 2. Structural Validation Rules Enforced
1. `Bundle.type === 'document'` and `Bundle.entry[0].resource.resourceType === 'Composition'`.
2. Mandatory `Patient` resource presence (`BUNDLE_PATIENT_RESOURCE_MISSING`).
3. Valid RFC 4122 `urn:uuid:` `fullUrl` on every entry.
4. Full internal reference resolution (`UNRESOLVED_BUNDLE_REFERENCE`).
5. Duplicate resource prevention across both `fullUrl` and `resourceType/id` (`DUPLICATE_BUNDLE_RESOURCE`).
6. Strict resource-type allowlist (`UNSUPPORTED_RESOURCE_TYPE`) and resource-specific checks for `Patient`, `Practitioner`, `Organization`, `Encounter`, `Observation`, `DiagnosticReport`, `ServiceRequest`, `Specimen`, `MedicationRequest`, `DocumentReference`, `Consent`, `Composition`, and `Provenance`.

## 3. Clinical Data Integrity
- Source HealthBridge documents are never modified during mapping.
- Numeric/string lab values, units (`http://unitsofmeasure.org`), reference ranges, timestamps, and amendment flags (`status: "amended"`) are preserved verbatim.
- Unmapped fields are always enumerated explicitly in `unmappedFields[]` and recorded in `AbdmFhirMappingResultModel` without plaintext PHI.

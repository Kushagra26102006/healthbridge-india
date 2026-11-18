# HealthBridge India — FHIR R4 Resource Mapping & Validation (Phase 17)

## 1. Architecture & Profile Target

- **Standard Version:** HL7 FHIR R4 targeting **NRCeS ABDM Implementation Guide** (`https://nrces.in/ndhm/fhir/r4/StructureDefinition/*`).
- **Core Modules:**
  - Mapper Service: `apps/api/src/modules/abdm/mappers/abdm-fhir.mapper.ts` (`ABDM_FHIR_MAPPING_VERSION = '2026.11-nrces-r4-foundation'`)
  - Consent Mapper: `apps/api/src/modules/abdm/mappers/abdm-consent-fhir.mapper.ts`
  - Structural Validator: `apps/api/src/modules/abdm/validators/fhir-r4.validator.ts`
  - Document Bundle Service: `apps/api/src/modules/abdm/services/abdm-fhir-bundle.service.ts`
- **Source Preservation & Traceability:** Every mapper returns a structured `FhirMappingResultDto` recording `sourceEntityType`, `sourceEntityId`, `targetResourceType`, `targetProfileUrl`, `mappingStatus` (`MAPPED | MAPPED_WITH_WARNINGS | FAILED`), `validationErrors`, `warnings`, and explicit `unmappedFields` so no internal clinical attribute is silently dropped.

---

## 2. Supported Resource Mapping Matrix

| FHIR R4 Resource | NRCeS Profile URL | Mapper Method | Validator Support | Unmapped / Notes |
| --- | --- | --- | --- | --- |
| **Patient** | `.../StructureDefinition/Patient` | `mapPatient` | Yes | Unverified `abhaNumber` is omitted with warning; `bloodGroup` flagged as requiring separate `Observation`. |
| **Practitioner** | `.../StructureDefinition/Practitioner` | `mapPractitioner` | Yes | Maps HPR ID (`https://doctor.ndhm.gov.in`); `specialization` flagged for `PractitionerRole`. |
| **Organization** | `.../StructureDefinition/Organization` | `mapOrganization` | Yes | Maps HFR Facility ID (`https://facility.ndhm.gov.in`) & accreditation/license IDs. |
| **Encounter** | `.../StructureDefinition/Encounter` | `mapEncounter` | Yes | Maps internal encounter type (`AMBULATORY`→`AMB`, `VIRTUAL`→`VR`, etc.) & status (`COMPLETED`→`finished`). |
| **Appointment** | `.../StructureDefinition/Appointment` | `mapAppointment` | Yes | Maps status (`CONFIRMED`→`booked`, `COMPLETED`→`fulfilled`), ISO-8601 `start`/`end`, participants; `consultationType` preserved in `description` & noted in `unmappedFields`. |
| **Observation** | `.../StructureDefinition/Observation` | `mapObservation` | Yes | Uses `http://loinc.org` when LOINC code present; emits `LOCAL_OBSERVATION_CODE` warning when local code is used. |
| **DiagnosticReport** | `.../StructureDefinition/DiagnosticReportLab` | `mapDiagnosticReportDocumentBundle` | Yes | Produces full self-contained `DocumentBundle` (`Composition` at `entry[0]`, `urn:uuid:` internal references). |
| **MedicationRequest** | `.../StructureDefinition/MedicationRequest` | `mapMedicationRequest` | Yes | Maps Rx status, SNOMED-CT coding (optional), dosage instructions, requester, and `authoredOn`. |
| **MedicationStatement** | `.../StructureDefinition/MedicationStatement` | `mapMedicationStatement` | Yes | Maps active/reported patient medications with dosage text & status validation. |
| **Condition** | `.../StructureDefinition/Condition` | `mapCondition` | Yes | Supports SNOMED-CT (`http://snomed.info/sct`) and ICD-10 (`http://hl7.org/fhir/sid/icd-10`); emits warning if free-text only. |
| **AllergyIntolerance** | `.../StructureDefinition/AllergyIntolerance` | `mapAllergyIntolerance` | Yes | Validates clinical status, criticality (`low | high | unable-to-assess`), reaction manifestations; warns if no SNOMED-CT code. |
| **DocumentReference** | `.../StructureDefinition/DocumentReference` | `mapDocumentReference` / `mapToFHIRDocumentReference` | Yes | Maps all 9 canonical `HEALTH_RECORD_TYPES` to LOINC document codes & attachment metadata. |
| **Consent** | `.../StructureDefinition/Consent` | `abdm-consent-fhir.mapper.ts` | Yes | Projects signed ABDM Consent Artefacts to FHIR R4 `Consent` without claiming live IG certification. |
| **Bundle / Composition** | `.../StructureDefinition/DocumentBundle` | `mapDiagnosticReportDocumentBundle` | Yes | Enforces `Composition` at `entry[0]`, `urn:uuid` reference resolution, and ISO-8601 timestamps. |

---

## 3. Structural Validation & Limitations

- Admins can validate synthetic non-PII FHIR R4 JSON payloads interactively via `POST /api/v1/abdm/fhir/validate` on `/admin/integrations/abdm`.
- **Known Limitation:** `fhirR4Validator` performs deterministic in-app structural validation (required fields, ISO-8601 dates, terminology system URIs, `urn:uuid:` bundle resolution). Official NRCeS `ndhm.in` Implementation Guide conformance verification using the external **HAPI FHIR CLI Validator** remains a required pre-production milestone.

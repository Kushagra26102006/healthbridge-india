# FHIR R4 & NRCeS ABDM Architecture Review — HealthBridge India

> **Conformance Statement:** HealthBridge India implements an internal FHIR R4 mapping and structural validation foundation aligned with published NRCeS ABDM IG v6.5.0+ guidelines (`https://nrces.in/ndhm/fhir/r4/`). Official ABDM FHIR conformance is **NOT claimed** until generated bundles are validated against the official `ndhm.in` NPM package using the HAPI FHIR CLI validator.

---

## 1. Audit of Existing FHIR Implementation in HealthBridge India
Prior to Day 7 Task 01, the repository contained a single FHIR mapper:
- `apps/api/src/modules/laboratory/services/fhir-diagnostic-report.service.ts`

### Gaps Identified Against Official NRCeS ABDM FHIR R4 IG (v6.5.0+)
1. **Missing `Composition` at `Bundle.entry[0]`:** The legacy service placed `DiagnosticReport` as `entry[0]` in a `type: 'document'` bundle. Official NRCeS `DocumentBundle` / `DiagnosticReportRecord` profiles strictly require a `Composition` resource as `Bundle.entry[0]` (referencing `subject`, `author`, `custodian`, and section entries).
2. **Non-RFC-4122 `fullUrl` Values:** Legacy code emitted `urn:uuid:${report.reportNumber}`, which is not a valid RFC 4122 UUID.
3. **Unbundled References:** `Patient`, `Practitioner`, and `Organization` were referenced via relative paths (`Patient/${id}`) without being included as self-contained entries inside the Document Bundle.
4. **Terminology System Mismatches:** Local parameter codes (e.g., `LOCAL-HB`) were emitted under `http://loinc.org` instead of separating standard LOINC codes from local facility codes.
5. **Misaligned `encounter` Reference:** Legacy `DiagnosticReport.encounter` pointed to `ServiceRequest/${orderId}` rather than `basedOn`.

---

## 2. New Day 7 Task 01 FHIR Validation & Mapping Foundation
Implemented cleanly in `apps/api/src/modules/abdm/`:
- **Strict Model Separation:** Internal Mongoose schemas remain decoupled from FHIR R4 transport objects.
- **Dedicated Mapper (`mappers/abdm-fhir.mapper.ts`):**
  - Maps `Patient`, `Practitioner`, `Organization`, `Observation`, `DiagnosticReport`, and full self-contained NRCeS Document `Bundle` (`DiagnosticReportRecord` with `Composition` at `entry[0]` and valid `urn:uuid:<uuid-v4>` references).
  - Returns an explicit `FhirMappingResultDto` (`sourceEntityType`, `sourceEntityId`, `targetResourceType`, `targetProfileUrl`, `mappingStatus`, `validationErrors`, `warnings`, `unmappedFields`, `mappingVersion`, `timestamp`).
  - **Never silently discards unmapped clinical fields** (e.g., `bloodGroup`, `specialization` are explicitly listed in `unmappedFields`).
- **Structural Validator (`validators/fhir-r4.validator.ts`):**
  - Validates required FHIR R4 fields, logical IDs, ISO-8601 date/timezones, RFC 4122 `urn:uuid` fullUrls, configured terminology system URIs (`http://loinc.org`, `http://snomed.info/sct`, `http://unitsofmeasure.org`, NRCeS identifier systems), `Composition`-first Document Bundle constraint, and internal reference resolution.
- **Validation Limitation (Documented):** External StructureDefinition profile cardinality, ValueSet expansion, and invariant expressions require running the official HAPI FHIR CLI validator against NRCeS `ndhm.in` `package.tgz` in Milestone 2 CI pipelines.

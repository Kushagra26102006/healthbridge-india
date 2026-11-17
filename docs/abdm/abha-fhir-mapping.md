# ABHA Identity FHIR R4 Mapping Specification

> **Conformance Notice:** HealthBridge aligns its `Patient` FHIR R4 resource structure with the NRCeS ABDM FHIR R4 Implementation Guide (`https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient`). Official profile conformance requires external validation via the HAPI FHIR CLI against the official `ndhm.in` IG package.

## 1. `Patient.identifier` Mapping Rules (`AbdmFhirMapperService.mapPatient`)

Internal patient primary keys and external ABDM identifiers are kept strictly separate in `Patient.identifier`:

| Identifier Role | `use` | `type.coding` | `system` | Condition |
|---|---|---|---|---|
| **Internal HealthBridge MRN** | `usual` | `http://terminology.hl7.org/CodeSystem/v2-0203` — `MR` (`Medical record number`) | `https://healthbridge.in/identifiers` | Always included (`PatientProfile.userId`) |
| **Verified 14-Digit ABHA Number** | `official` | `https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code` — `ABHA` (`ABHA Number`) | `https://healthid.ndhm.gov.in` | Included **ONLY** when `abhaVerified === true` |
| **Verified ABHA Address (PHR Handle)** | `secondary` | `https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code` — `PHR` (`PHR Address`) | `https://healthid.ndhm.gov.in` | Included when verified (`abhaVerified !== false`) |

## 2. Data Minimization & Unverified Identifier Safeguards

- If an ABHA Number is present in input without `abhaVerified: true`, `AbdmFhirMapperService.mapPatient()` **omits** it from `Patient.identifier`, appends `abhaNumber (omitted because ABHA ownership is not verified)` to `unmappedFields`, and emits warning `UNVERIFIED_ABHA_NUMBER_OMITTED`.
- ABHA identifiers are **never** duplicated into unrelated FHIR resources (`Practitioner`, `Organization`, `Observation`, `Specimen`). Clinical resources reference the bundled `Patient` via `urn:uuid:<uuid>`.

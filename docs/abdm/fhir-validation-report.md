# ABDM HL7 FHIR R4 Validation Audit Report (Day 7 Audit)

> **Audit Date:** 2026-11-18  
> **Official HAPI FHIR CLI Validator Status:** `UNAVAILABLE_IN_LOCAL_ENVIRONMENT` (`java` installed at OpenJDK 25, `validator_cli` JAR and NRCeS `ndhm.in` `package.tgz` not present)  
> **Official Conformance Claim:** **`officialIgConformanceClaimed: false`** — HealthBridge India does **NOT** claim official NRCeS ABDM FHIR R4 IG conformance based solely on TypeScript types or internal structural unit tests.

## 1. Audited Resource Coverage (14 Core FHIR R4 Resources)

| FHIR Resource | Mapper / Generator | Structural Checks Executed (`fhir-r4.validator.ts`) | Verified Internally | Official HAPI IG Validation |
|---|---|---|---|---|
| `Patient` | `AbdmFhirMapperService.mapPatient` | `name`, `gender`, `birthDate`, MRN + verified-only ABHA Number & PHR Address identifiers | Yes | Pending HAPI CLI |
| `Practitioner` | `AbdmFhirMapperService.mapPractitioner` | `name`, HPR / Medical Council identifier warning | Yes | Pending HAPI CLI |
| `Organization` | `AbdmFhirMapperService.mapOrganization` | `name`, HFR Facility ID warning | Yes | Pending HAPI CLI |
| `Encounter` | `AbdmFhirBundleService` | `status`, `class`, `subject`, `period`, `serviceProvider` | Yes | Pending HAPI CLI |
| `Observation` | `AbdmFhirMapperService` + `AbdmFhirBundleService` | `status`, `code`, `subject`, ISO `effectiveDateTime`, UCUM units, verbatim `referenceRange`, `interpretation` | Yes | Pending HAPI CLI |
| `DiagnosticReport` | `AbdmFhirMapperService` + `AbdmFhirBundleService` | `status`, `code`, `subject`, ISO `issued`, `performer`, `result` refs, `amended` distinction | Yes | Pending HAPI CLI |
| `ServiceRequest` | `AbdmFhirBundleService` | `status`, `intent`, `subject`, `requester`, `authoredOn` | Yes | Pending HAPI CLI |
| `Specimen` | `AbdmFhirBundleService` | `type`, `subject`, `collection.collectedDateTime` | Yes | Pending HAPI CLI |
| `MedicationRequest` | `AbdmFhirBundleService` | `status`, `intent`, `subject`, `medicationCodeableConcept`, `dosageInstruction` | Yes | Pending HAPI CLI |
| `DocumentReference` | `AbdmFhirBundleService` | `status`, `subject`, `content[]` attachment | Yes | Pending HAPI CLI |
| `Composition` | `AbdmFhirBundleService` | `status`, `type` (SNOMED CT), `subject`, `author`, `title`, ISO `date`, `entry[0]` placement | Yes | Pending HAPI CLI |
| `Consent` | `AbdmConsentFhirMapper` | `status`, `scope`, `category`, `patient`, ISO `dateTime` & `period`, `provision.type`, preserved `originalPayloadSha256` | Yes | Pending HAPI CLI |
| `Provenance` | `AbdmFhirBundleService` | `target[]`, ISO `recorded`, `agent[]` | Yes | Pending HAPI CLI |
| `Bundle` | `AbdmFhirBundleService` | `type: "document"`, `Composition` at `entry[0]`, mandatory `Patient` resource, RFC 4122 `urn:uuid:` `fullUrl`, internal reference resolution, duplicate resource detection, unsupported resource rejection, safe limit `<= 150` entries & `<= 2 MB` | Yes | Pending HAPI CLI |

## 2. Unverified Checks Requiring External HAPI FHIR CLI
- Full FHIRPath invariants & cardinality slices inside NRCeS `ndhm.in` `package.tgz` (e.g., ValueSet expansion against live SNOMED CT India / LOINC terminology servers, narrative `div` XHTML schema rules, strict extension URL bindings).
- Recommended command once `validator_cli.jar` and NRCeS IG package are installed:
  `java -jar validator_cli.jar <bundle.json> -version 4.0.1 -ig nrces.in.ndhm.fhir.r4`

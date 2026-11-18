# FHIR R4 Consent Mapping Specification & Limitations (Day 7 Task 03)

## 1. Fundamental Architectural Distinction

**HL7 FHIR R4 `Consent` resources and ABDM HIE-CM Consent Artefacts are NOT automatically interchangeable.**

- ABDM HIE-CM natively issues and validates its own digitally signed JSON Consent Artefact schema (`consentId`, `consentDetail.purpose`, `consentDetail.hiTypes`, `consentDetail.permission.accessMode`, `permission.frequency`, `permission.dataEraseAt`, `careContexts`, `signature`).
- NRCeS FHIR R4 Implementation Guides focus primarily on clinical Document Bundles (`OPConsultation`, `Prescription`, `DiagnosticReport`, `DischargeSummary`, etc.) while Consent operates dynamically in the HIE-CM layer.
- Therefore, HealthBridge implements a **dedicated mapping adapter** (`AbdmConsentFhirMapper` in `apps/api/src/modules/abdm/mappers/abdm-consent-fhir.mapper.ts`) that projects an ABDM Consent Artefact into a structurally validated HL7 FHIR R4 `Consent` resource while **always preserving the original external artefact (`originalExternalPayload` + `payloadSha256`) unchanged**.

## 2. Field-by-Field Mapping Table

| FHIR R4 `Consent` Element | Source ABDM Consent Artefact Field | Mapping Notes |
|---|---|---|
| `identifier` | `externalConsentId`, `internalReference` | Official `https://abdm.gov.in/consent-artefact` + internal HealthBridge reference |
| `status` | `externalStatus`, `revocationStatus`, `validationStatus`, `expiresAt` | Maps `GRANTED`+`VALID` → `active`, `DENIED` → `rejected`, `REQUESTED` → `draft`, `REVOKED`/`EXPIRED`/`PENDING_CONFIRMATION` → `inactive` |
| `scope` | Fixed privacy scope | `http://terminology.hl7.org/CodeSystem/consentscope` (`patient-privacy`) |
| `category` | Fixed document category | `http://loinc.org` (`59284-0` Consent Document) |
| `patient` | `patientId`, `patientAbhaAddress` | `Patient/<id>` reference + ABHA display |
| `dateTime` | `grantedAt` or `createdAt` | ISO-8601 instant |
| `performer` | `patientId`, `patientAbhaAddress` | Patient acting as consent granter |
| `organization` | `hiuId`, `hiuName`, optional `hipId` | `Organization/<id>` references |
| `sourceReference` | `externalConsentId`, `payloadSha256` | Points to preserved immutable original external artefact |
| `policy` | `purposeCode` | Authority `https://abdm.gov.in`, URI referencing purpose code |
| `period` | `grantedAt` → `expiresAt` | Overall consent validity window |
| `provision.type` | Derived from active status | `permit` when `active`, `deny` otherwise |
| `provision.period` | `dateRange.from` → `dateRange.to` | Permitted clinical record date range |
| `provision.actor` | `hiuId` | Information recipient (`IRCP`) |
| `provision.action` | `accessMode` | `STORE` → `collect`; `VIEW`/`QUERY`/`STREAM` → `access` |
| `provision.purpose` | `purposeCode`, `purposeText` | Coded ABDM purpose |
| `provision.class` | `hiTypes[]` | Coded ABDM health information categories |

## 3. Explicitly Reported Unmapped Fields & Validation Gaps

`mapArtefactToFhirConsent` ALWAYS populates `unmappedFields` and `officialIgConformanceClaimed: false`:
- `signature`: Cryptographic verification MUST execute against the original ABDM JSON artefact, not the FHIR projection.
- `dataEraseAt`: Mandatory HIU data-erasure deadline has no native 1:1 FHIR R4 `Consent.provision` element.
- `frequency`: Fetch repetition rules (`unit`, `value`, `repeats`) have no native FHIR R4 `Consent.provision` element.
- `revocationStatus` / `externalConfirmationReceived`: Operational synchronization metadata preserved on `AbdmConsentArtefactModel`.
- **Conformance Disclaimer:** Structural validation runs via `FhirR4Validator.validateConsent`. Official NRCeS FHIR IG certification is NOT claimed without external HAPI FHIR IG CLI validator execution.

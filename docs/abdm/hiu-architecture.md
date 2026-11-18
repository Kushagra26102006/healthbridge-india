# ABDM Health Information User (HIU) Architecture

> **Status:** `FOUNDATION_IMPLEMENTED_LIVE_EXCHANGE_DISABLED` (`liveExchangeEnabled: false`)  
> **Primary Service:** `apps/api/src/modules/abdm/services/abdm-hiu.service.ts`

## 1. Role Separation & Authorization Preconditions
`AbdmHiuService` governs external health information retrieval and strictly enforces:
1. **ABHA Link != Consent:** Possessing a verified `AbhaLinkModel` or linked care context (`AbdmLinkedHealthRecordModel`) NEVER authorizes HIU data retrieval.
2. **Centralized Consent Enforcement:** Every `initiateHealthInfoRequest` and every incoming `receiveDataPushCallback` validates the referenced `AbdmConsentArtefactModel` through `abdmConsentValidationService.validateAbdmConsentAccess(...)` (`allowPatientSelfAccess: false`).
3. **Read-Only External Records:** Imported records stored in `AbdmImportedRecordModel` carry `readOnly: true` and `immutable: true` on provenance fields. Clinicians (`DOCTOR`) have strictly read-only access to verified records under active consent and zero edit/delete endpoints.

## 2. HIU Retrieval & Validation Pipeline

```mermaid
flowchart TD
  A["Authorized Actor Initiates HIU Request (/api/v1/abdm/hiu/requests)"] --> B["Validate Consent Artefact via Centralized Validator"]
  B --> C["Generate Ephemeral ECDH Key Material (Server Memory Only)"]
  C --> D["Submit /api/hiecm/data-flow/v3/health-information/request"]
  D --> E["Receive Authenticated Data Push Webhook (/webhooks/hiu/data-push)"]
  E --> F["Re-verify Consent & Participant + Reject Unencrypted Payloads"]
  F --> G["Decrypt via AbdmEncryptionAdapter & Purge Ephemeral Private Key"]
  G --> H["Validate FHIR R4 DocumentBundle (fhirR4Validator)"]
  H -->|Invalid| I["Reject Entry (Never Silently Import)"]
  H -->|Valid| J["Check Duplicate Import (patientId + participant + careContext + bundleSha256)"]
  J --> K["Evaluate Patient Identity Match"]
  K -->|Exact ABHA/MRN Match| L["Store IMPORTED_VERIFIED (AES-256-GCM Encrypted Bundle + Immutable Provenance)"]
  K -->|Ambiguous Match| M["Quarantine as QUARANTINED_REVIEW (Patient/Admin Review Required)"]
  L --> N["Send health-information/notify Acknowledgement + Privacy-Safe Notification"]
```

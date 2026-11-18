# HIP & HIU Consent Workflows Architecture (Day 7 Task 03)

> **Scope Boundary:** Day 7 Task 03 implements consent request, artefact validation, revocation, expiry, and authorization architecture for both HIU and HIP roles. **Live Health Information Exchange (Fidelius Curve25519 encrypted clinical bundle push/pull) is explicitly NOT implemented in this task (`liveExchangeEnabled: false`).**

## 1. Health Information User (HIU) Consent Workflow

When HealthBridge operates in the HIU role (e.g., a clinician or hospital requesting external records for a consented patient):

1. **Initiate Consent Request:** Authorized clinical role calls `POST /api/v1/abdm/consent/requests`. HealthBridge validates role permissions, verified patient `AbhaLink`, purpose, HI-types, date range, and expiry, then calls `POST /api/hiecm/consent/v3/request/init`.
2. **Await Authentic Patient Approval:** Request remains `AWAITING_PATIENT_ACTION` (`externalStatus: 'REQUESTED'`). Patient reviews and approves/denies in their official ABDM PHR application.
3. **Receive HIU Notification (`consent/hiu/notify`):** ABDM Gateway delivers `GRANTED` / `DENIED` / `REVOKED` / `EXPIRED` + `consentArtefacts[]`. HealthBridge acknowledges via `POST /api/hiecm/consent/v3/request/hiu/on-notify`.
4. **Fetch & Validate Artefact (`POST /api/hiecm/consent/v3/fetch` → `consent/on-fetch`):** HealthBridge fetches full signed Consent Artefacts, validates schema/identity/signature/expiry, and persists them immutably.
5. **Pre-Exchange Authorization Gate:** Future M3 HIU data-fetch workflows MUST call `validateAbdmConsentAccess(...)` and proceed ONLY on `decision: 'ALLOWED'`, enforcing purpose limitation, HI-types, date range, and `dataEraseAt` retention compliance.

## 2. Health Information Provider (HIP) Consent Workflow

When HealthBridge operates in the HIP role (holding clinical encounters, prescriptions, or lab reports requested by an external HIU):

1. **Receive HIP Consent Notification (`consent/hip/notify`):** ABDM Gateway delivers `GRANTED` consent artefact + care-context mappings (or `REVOKED`/`EXPIRED` updates). HealthBridge validates and persists the artefact immutably and acknowledges via `POST /api/hiecm/consent/v3/request/hip/on-notify`.
2. **Verify Participant & Consent Before Disclosure:** Future M3 HIP data-transfer handlers MUST verify requesting participant identity, validate the Consent Artefact via `validateAbdmConsentAccess(...)`, verify patient ownership, filter eligible records strictly by permitted `hiTypes` and `dateRange`, and deny any request if revoked, expired, unverified, or out of scope.
3. **In-Transit Protection (Future Task):** Eligible FHIR R4 Document Bundles will be encrypted end-to-end using official ABDM Fidelius ECDH (Curve25519 + AES-GCM) before transmission to the HIU data-push URL.

## 3. Onboarding & Eligibility Dependencies

Both HIU and HIP production/sandbox operations remain subject to official NHA/ABDM sandbox registration, HFR facility registration, bridge URL whitelisting, and ABDM Milestone M2/M3 functional testing certification.

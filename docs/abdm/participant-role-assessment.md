# HealthBridge India — ABDM Participant Role Assessment

> **Governance Statement:** HealthBridge India is **NOT currently registered** as an official ABDM HIP, HIU, HFR, or HPR participant. All roles listed below are **proposed architectural targets** pending sandbox onboarding, functional verification, CERT-In WASA audit, and official National Health Authority (NHA) approval.

---

## 1. Participant Role Assessment Matrix

| Participant Role | Potential HealthBridge Use | Official Requirements (Verified) | Current Status |
|---|---|---|---|
| **ABHA Client (Milestone 1)** | Patient registration, ABHA number/address creation & verification (OTP / QR Scan & Share) across Patient, Doctor, Pharmacy, and Laboratory reception flows. | Sandbox registration (`sandbox.abdm.gov.in`), M1 functional exit testing, strict consent & no unauthorized Aadhaar/ABHA storage. | **Planned Architecture** *(Foundation built; live M1 APIs pending sandbox credentials)* |
| **Health Information Provider — HIP (Milestone 2)** | Publishing authorized `OPConsultRecord`, `PrescriptionRecord`, `DiagnosticReportRecord` (Lab portal), and `HealthDocumentRecord` FHIR R4 Bundles linked as Care Contexts to patient ABHA addresses. | Valid HFR Facility ID per participating clinic/lab, M2 sandbox bridge & HTTPS callbacks, NRCeS FHIR R4 IG validation, Fidelius Curve25519 encryption, M2 exit testing. | **Planned Architecture (`PENDING_ONBOARDING`)** |
| **Health Information User — HIU (Milestone 3)** | Enabling treating Doctors (within Doctor Portal) to raise HIE-CM consent requests and view external longitudinal patient health records from other hospitals/labs upon patient consent. | HIU bridge registration, HIE-CM consent-request & notification callbacks, Fidelius decryption, consent expiry/erasure enforcement, M3 exit testing. | **Planned Architecture (`PENDING_ONBOARDING`)** |
| **Health Facility Registry — HFR Participant** | Mapping HealthBridge clinics, diagnostic laboratories, and pharmacies to official NHA HFR Facility IDs for FHIR `Organization.identifier` attribution and HIP/HIU routing. | Organization KYC, facility registration on HFR portal (or M4 API integration once approved). | **Pending Sandbox Account & Facility Registration** |
| **Healthcare Professionals Registry — HPR Participant** | Mapping verified Doctors and Consultant Pathologists to official HPR IDs for FHIR `Practitioner.identifier` attribution and report signing attribution. | Professional registration via HPR portal (MCI/NMC/State Medical Council verification). | **Pending Practitioner Onboarding** |
| **PHR Application / Health Locker** | Not currently targeted as a standalone ABDM PHR App; HealthBridge Patient Portal interacts as a tenant portal while citizens manage ABDM consents through official ABHA/PHR apps. | Separate PHR App certification track with NHA. | **Out of Scope for Day 7** |

---

## 2. Explicit Integration Lifecycle Stage Definitions
To prevent status misrepresentation, HealthBridge India enforces strict separation across six sequential stages:
1. **Planned Architecture** *(Current Stage — Day 7 Task 01)*: Official specs researched, modular backend foundation, FHIR R4 mappers/validators, consent adapter, webhook pipeline, and unit/mock tests built.
2. **Sandbox Onboarding**: Organization registered on `sandbox.abdm.gov.in`; sandbox `Client ID`, `Client Secret`, test HFR/HPR IDs, and public HTTPS callback URLs provisioned.
3. **Sandbox Integration**: Live M1/M2/M3 adapters wired against `https://dev.abdm.gov.in` and `https://abhasbx.abdm.gov.in/abha/api/v3`.
4. **Successful Sandbox Testing**: All NHA functional milestone test cases (M1, M2, M3) and HAPI FHIR CLI `ndhm.in` validations executed and passed.
5. **Official Onboarding & Approval**: CERT-In empanelled WASA (Web Application Security Assessment) Safe-to-Host certificate obtained and NHA Sandbox Exit approval granted.
6. **Production Integration**: Production credentials injected via secure secrets manager and `ABDM_ALLOW_PRODUCTION=true` explicitly enabled.

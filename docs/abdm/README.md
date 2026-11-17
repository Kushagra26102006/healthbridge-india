# HealthBridge India — ABDM Integration Documentation Suite (Day 7 Task 01)

> **Status Disclaimer:** This documentation covers the **ABDM Technical Foundation, Official Ecosystem Research, FHIR R4 Architecture, and Sandbox Onboarding Readiness** implemented in Day 7 Task 01. HealthBridge India is **NOT yet registered** as an official ABDM HIP, HIU, HFR, or HPR participant, and **live ABDM sandbox / production connectivity is disabled** (`ABDM_ENABLED=false`, `ABDM_ALLOW_PRODUCTION=false`) pending official sandbox onboarding, testing, CERT-In WASA security audit, and National Health Authority (NHA) approval.

## Documentation Index
| Document | Purpose |
|---|---|
| [abdm-ecosystem-overview.md](./abdm-ecosystem-overview.md) | Verified analysis of ABDM building blocks (ABHA, HIP, HIU, HFR, HPR, HIE-CM, Consent Artefacts, FHIR R4) |
| [participant-role-assessment.md](./participant-role-assessment.md) | Evaluation of proposed HealthBridge India roles and clear lifecycle stage separation |
| [official-documentation-register.md](./official-documentation-register.md) | Register of official NHA, ABDM, and NRCeS sources researched, with access dates & unverified gaps |
| [sandbox-onboarding-guide.md](./sandbox-onboarding-guide.md) | Practical step-by-step sandbox onboarding checklist tagged by verification and approval status |
| [fhir-r4-architecture.md](./fhir-r4-architecture.md) | Audit of existing HealthBridge FHIR code vs official NRCeS ABDM FHIR R4 IG (v6.5.0+) |
| [fhir-mapping-matrix.md](./fhir-mapping-matrix.md) | Complete Internal-to-FHIR R4 mapping status matrix across 14 resource types |
| [integration-architecture.md](./integration-architecture.md) | Backend `apps/api/src/modules/abdm/` architecture, HTTP client, correlation, error handling |
| [authentication-and-credentials.md](./authentication-and-credentials.md) | ABDM V3 Sessions contract, server-only credential isolation, rotation & token lifecycle |
| [webhook-architecture.md](./webhook-architecture.md) | Asynchronous `on-*` callback pipeline, signature/secret auth, replay window, idempotency |
| [consent-integration-architecture.md](./consent-integration-architecture.md) | Separation of internal HealthBridge consent from ABDM HIE-CM signed Consent Artefacts |
| [health-information-exchange-architecture.md](./health-information-exchange-architecture.md) | Proposed HIP & HIU workflows and Fidelius Curve25519 (Weierstrass) + AES-GCM encryption design |
| [security-and-privacy.md](./security-and-privacy.md) | Privacy-by-design controls, log redaction, data minimization, and non-compliance disclaimer |
| [implementation-roadmap.md](./implementation-roadmap.md) | Phased Day 7+ implementation plan across Milestones M1, M2, M3, M4, and Sandbox Exit |
| [../day-7-task-01-completion.md](../day-7-task-01-completion.md) | Day 7 Task 01 formal completion report (all 18 required sections) |

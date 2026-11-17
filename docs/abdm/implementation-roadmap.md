# ABDM Phased Implementation Roadmap — HealthBridge India

## Current Phase — Completed (Day 7 Task 01)
- Official ABDM V3 & NRCeS FHIR R4 IG research and documentation register.
- Dedicated `apps/api/src/modules/abdm/` integration foundation (config, auth abstraction, HTTP client, redaction, correlation, FHIR R4 validator & mappers, consent adapter, webhook receiver, HIP/HIU readiness adapters).
- Internal admin status dashboard at `/admin/integrations/abdm`.
- Automated unit & integration tests (mocked/local; zero live sandbox calls).

---

## Next Milestones (Sequential)

### Phase 1 — Sandbox Onboarding & Connectivity Verification (User Action + Task 02)
1. Register HealthBridge India organization on `sandbox.abdm.gov.in`.
2. Provision Sandbox `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_WEBHOOK_SECRET`, and public HTTPS callback URL.
3. Implement live V3 session fetcher (`POST /api/hiecm/gateway/v3/sessions`) and verify real sandbox connectivity (`CONNECTIVITY_VERIFIED`).
4. Verify official gateway callback JWT/JWKS public certificate verification mechanism.

### Phase 2 — Milestone 1 (M1): ABHA Creation & Verification
1. Integrate ABHA V3 APIs (`https://abhasbx.abdm.gov.in/abha/api/v3`) with official RSA public-key encryption for sensitive KYC fields.
2. Support ABHA verification (OTP / Scan & Share QR) and linking to Patient Profiles using official sandbox synthetic test accounts.
3. Pass NHA M1 functional test suite.

### Phase 3 — Milestone 2 (M2): Health Information Provider (HIP)
1. Register test HFR Facility IDs and HPR Practitioner IDs in sandbox.
2. Expand `AbdmFhirMapperService` for `OPConsultRecord`, `PrescriptionRecord`, `DischargeSummaryRecord`, `HealthDocumentRecord`, `ServiceRequest`, `Specimen`, and `Provenance`.
3. Add HAPI FHIR CLI validator check against NRCeS `ndhm.in` `package.tgz` into CI.
4. Implement Care Context linking, discovery (`discover`/`on-discover`), consent notification, and **Fidelius Curve25519 (short Weierstrass) + AES-256-GCM** encryption for encrypted bundle transfer.
5. Pass NHA M2 functional test suite.

### Phase 4 — Milestone 3 (M3): Health Information User (HIU)
1. Implement HIE-CM consent request initiation (`consent-requests/init`), notification callbacks, artefact fetch, and Fidelius decryption.
2. Build Doctor Portal read-only external longitudinal record viewer enforcing `dataEraseAt` erasure and revocation.
3. Pass NHA M3 functional test suite.

### Phase 5 — CERT-In WASA Security Audit, Sandbox Exit & Production Go-Live
1. Complete external Web Application Security Assessment (WASA) via CERT-In empanelled auditor.
2. Complete NHA Sandbox Exit review and obtain production credentials.
3. Enable `ABDM_ALLOW_PRODUCTION=true` only after production secrets, TLS, KMS object storage, and monitoring are live.

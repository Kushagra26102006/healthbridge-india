# Official ABDM & NRCeS Documentation Research Register

**Research Date:** 2026-11-18  
**Methodology:** Web research prioritized official Government of India / NHA (`abdm.gov.in`, `sandbox.abdm.gov.in`, `developer.abdm.gov.in`, `nha.gov.in`) and NRCeS (`nrces.in`) publications. Items behind authenticated ABDM Sandbox portal logins are explicitly marked as **Account-Gated / Unverified** and must be verified directly after sandbox onboarding.

---

## 1. Documentation Register

| # | Document / Portal Title | Official Source URL | Version / Publication Context | Date Accessed | Integration Topic | Key Verified Technical Specifications | Dependencies | Implementation Impact |
|---|---|---|---|---|---|---|---|---|
| 1 | **ABDM Official Portal & Ecosystem Overview** | https://abdm.gov.in/ | Current (Milestones M1–M4) | 2026-11-18 | Ecosystem, Milestones, Governance | Defines M1 (ABHA), M2 (HIP), M3 (HIU), M4 (HFR/HPR), data-blind HIE-CM, WASA security audit & Sandbox Exit. | None | Defines phased roadmap and participant role boundaries. |
| 2 | **ABDM Sandbox Portal** | https://sandbox.abdm.gov.in/ | V3 Sandbox | 2026-11-18 | Sandbox Onboarding, Credentials, Bridge Setup | Entry portal for organization registration, Client ID/Secret provisioning, callback registration, and test HFR/HPR setup. | Authorized organization signatory | Required user action before live sandbox testing. |
| 3 | **ABDM Developer Portal (V3 Gateway & Sessions)** | https://developer.abdm.gov.in/ | ABDM V3 APIs | 2026-11-18 | Authentication, Gateway Routing, Callbacks | Sandbox Base URL `https://dev.abdm.gov.in`; ABHA V3 Host `https://abhasbx.abdm.gov.in/abha/api/v3`; Sessions endpoint `POST /api/hiecm/gateway/v3/sessions` with `REQUEST-ID` (UUID), `TIMESTAMP` (ISO-8601), `X-CM-ID: sbx`, `grantType: client_credentials`; async `202 Accepted` + `on-*` callbacks matched by `requestId`. | Sandbox account credentials | Shaped `AbdmConfigurationService`, `AbdmCorrelationService`, `AbdmAuthenticationService`, `AbdmHttpClient`, and `AbdmWebhookService`. |
| 4 | **NRCeS FHIR Implementation Guide for ABDM (R4)** | https://nrces.in/ndhm/fhir/r4/ | FHIR R4 / IG v6.5.0+ (`ndhm.in`) | 2026-11-18 | Clinical Artifacts & FHIR Profiles | Defines `DiagnosticReportRecord`, `PrescriptionRecord`, `OPConsultRecord`, `DischargeSummaryRecord`, `HealthDocumentRecord`. Requires Document `Bundle` with `Composition` at `entry[0]`, valid `urn:uuid` references, and validation against `ndhm.in` package via HAPI FHIR CLI. | HAPI FHIR CLI validator + `package.tgz` | Shaped `FhirR4Validator` and `AbdmFhirMapperService`; exposed gaps in legacy Day 6 `FhirDiagnosticReportService`. |
| 5 | **ABDM HIE-CM Consent & Data Encryption Architecture (Fidelius)** | https://abdm.gov.in/ (HIE-CM / Fidelius Specification) | HIE-CM / Fidelius | 2026-11-18 | Consent Artefacts & End-to-End Encryption | Data-blind gateway; signed Consent Artefacts with `purposeCode`, `hiTypes`, `dateRange`, `dataEraseAt`; ECDH Curve25519 (**short Weierstrass form**, BouncyCastle-compatible, NOT raw Montgomery X25519) + XOR nonces (20-byte salt + 12-byte IV) + HKDF-SHA256 + AES-256-GCM. | BouncyCastle/Weierstrass-compatible crypto library | Informed `AbdmConsentAdapter` and `AbdmHealthInformationAdapter` encryption target specification. |
| 6 | **National Health Authority (NHA) Portal** | https://nha.gov.in/ | Health Data Management Policy | 2026-11-18 | Privacy, Purpose Limitation, Consent Policy | Mandates explicit citizen consent, minimum-necessary disclosure, purpose codes, and revocation/erasure respect. | Legal & compliance review | Informed `security-and-privacy.md` and `AbdmConsentAdapter`. |

---

## 2. Specification Conflicts & Account-Gated Verification Gaps
1. **Legacy V1/V2 Tutorials vs Official V3 Gateway Specs (Conflict Resolved):**
   - Many third-party blogs still reference deprecated V1/V2 endpoints (`/gateway/v0.5/sessions`, `/v1/auth/...`). **Official ABDM V3 documentation (`developer.abdm.gov.in`) governs implementation**: V3 uses `/api/hiecm/gateway/v3/sessions` and `/abha/api/v3` with mandatory `REQUEST-ID`, `TIMESTAMP`, and `X-CM-ID` headers.
2. **Curve25519 Representation Pitfall (Verified):**
   - Standard Node.js `crypto.createECDH` / `X25519` uses Montgomery form, whereas ABDM Fidelius uses Java/BouncyCastle short Weierstrass Curve25519 parameters (mismatch causes `ABDM-9999`). A verified Fidelius-compatible Node/JVM cryptographic adapter will be required in Milestone 2/3.
3. **Account-Gated Items Requiring Sandbox Login to Verify:**
   - Exact downloadable V3 OpenAPI YAML/Postman collections per milestone (M1/M2/M3).
   - Official gateway inbound callback JWT/JWKS public certificate endpoint URL for verifying ABDM-originated webhook requests.
   - Latest sandbox synthetic test ABHA addresses/OTPs and NHA error-code catalog.

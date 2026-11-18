# ABDM V3 HIP & HIU API Verification Matrix

> **Verification Date:** 2026-11-18  
> **Primary Official Sources Checked:** `abdm.gov.in`, `sandbox.abdm.gov.in`, `developer.abdm.gov.in`, `nrces.in/ndhm/fhir/r4`  
> **Honesty & Accuracy Statement:** Every workflow below reflects its verified official ABDM V3 specification status and its exact implementation status in HealthBridge India. Workflows requiring live ABDM Sandbox onboarding, registered HIP/HIU Bridge URLs, or BouncyCastle short-Weierstrass Curve25519 Fidelius cryptographic interoperability are explicitly marked `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` or `PENDING_SANDBOX_ONBOARDING`.

---

## 1. Official Specification Verification Matrix

| Workflow | Official specification | Version | Verified | Implementation status |
|---|---|---|---|---|
| HIP Registration & Bridge Onboarding | ABDM Sandbox Portal + HFR (Health Facility Registry) + Bridge Webhook URL registration (`sandbox.abdm.gov.in`) | V3 / M2 | Verified from official docs | `PENDING_SANDBOX_ONBOARDING` (readiness & config guards implemented) |
| HIU Registration & Bridge Onboarding | ABDM Sandbox Portal + HIU Client Registration + Bridge Callback URL (`sandbox.abdm.gov.in`) | V3 / M3 | Verified from official docs | `PENDING_SANDBOX_ONBOARDING` (readiness & config guards implemented) |
| Gateway API Authentication | `POST /api/hiecm/gateway/v3/sessions` (`clientId`, `clientSecret`, `grantType: "client_credentials"`, `X-CM-ID`) | V3 | Verified from official docs | `IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER` (live call pending credentials) |
| User-Initiated Care Context Discovery (HIP Ingress) | `POST /api/v3/hip/patient/care-context/discover` (`202 Accepted` async callback hosted by HIP) | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| User-Initiated Discovery Response (HIP -> Gateway) | `POST /api/hiecm/user-initiated-linking/v3/patient/care-context/on-discover` | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| User-Initiated Linking Init (HIP Ingress & Response) | Ingress `POST /api/v3/hip/link/care-context/init` -> Outbound `POST /api/hiecm/user-initiated-linking/v3/link/care-context/on-init` | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| User-Initiated Linking Confirm (HIP Ingress & Response) | Ingress `POST /api/v3/hip/link/care-context/confirm` -> Outbound `POST /api/hiecm/user-initiated-linking/v3/link/care-context/on-confirm` | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| HIP-Initiated Link Token Generation | `POST /api/hiecm/v3/token/generate-token` -> Callback `POST /api/v3/hip/token/on-generate-token` | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| HIP-Initiated Care Context Linking | `POST /api/hiecm/v3/link/carecontext` (`X-LINK-TOKEN` header) -> Callback `POST /api/v3/link/on_carecontext` | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| HIU-Initiated Direct Discovery / Record Unlinking | ABDM V3 places discovery & linking in User-Initiated (PHR->HIP) and HIP-Initiated (`link/carecontext`) flows; HIU discovers linked care contexts via granted Consent Artefacts. Care-context unlinking is not universally exposed as a standalone HIU API. | V3 | Verified from official docs (HIU direct unlinking pending/unsupported) | `LOCAL_RECORD_LINK_REGISTRY_AND_PENDING_EXTERNAL_SPEC` (local unlink marked `LOCAL_HEALTHBRIDGE_UNLINK_ONLY`) |
| Consent Validation & Artefact Verification | Centralized HIE-CM V3 Consent Artefact validation (`GRANTED`, active `dataEraseAt`, `hiTypes`, `dateRange`, `purpose`, participant & patient binding) | V3 | Verified from official docs (Day 7 Task 03) | `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS` |
| HIU Health Information Request | `POST /api/hiecm/data-flow/v3/health-information/request` (with `consent.id`, `dateRange`, `dataPushUrl`, `keyMaterial`) -> Callback `/api/v3/hiu/health-information/on-request` | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| HIP Health Information Request Ingress & Ack | Ingress `POST /api/v3/hip/health-information/request` -> Outbound `POST /api/hiecm/data-flow/v3/health-information/hip/on-request` (`ACKNOWLEDGED`) | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| FHIR R4 Clinical Document Packaging | NRCeS ABDM FHIR R4 IG `DocumentBundle` (`type: "document"`, `Composition` at `entry[0]`, `urn:uuid:` internal refs; `OPConsultRecord`, `DiagnosticReportRecord`, `PrescriptionRecord`, `DischargeSummaryRecord`, `HealthDocumentRecord`) | FHIR R4 / NRCeS IG | Verified from official NRCeS docs | `STRUCTURAL_GENERATOR_IMPLEMENTED_UNVALIDATED_BY_HAPI_CLI` |
| Data Encryption & Key Exchange (Fidelius) | ECDH on Curve25519 (**BouncyCastle short-Weierstrass form**) + dual-nonce XOR (`20B` HKDF-SHA256 salt + `12B` AES-GCM IV) + `AES/GCM/NoPadding` (`256-bit`, 16B tag appended, Base64) | Fidelius V3 | Verified from official ABDM Fidelius spec | `MOCK_ADAPTER_ONLY_LIVE_FIDELIUS_NOT_CONFIGURED` |
| Direct Encrypted Health Data Push | Direct HTTPS `POST` from HIP to HIU's `dataPushUrl` (`pageNumber`, `pageCount`, `transactionId`, `entries[]`, `keyMaterial`) | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| Health Information Transfer Notification / Ack | `POST /api/hiecm/data-flow/v3/health-information/notify` (`sessionStatus`: `TRANSFERRED | PARTIAL_TRANSFERRED | FAILED | RECEIVED`, per-care-context `hiStatus`: `OK | ERRORED | DELIVERED`) | V3 | Verified from official docs | `MOCKED_FOUNDATION_PENDING_SANDBOX_VERIFICATION` |
| Callback Authentication, Correlation & Replay Guard | `REQUEST-ID`, `TIMESTAMP`, `X-CM-ID`, `X-HIP-ID` / `X-HIU-ID`, Gateway Bearer/JWKS verification (sandbox/prod); HMAC/shared-secret + ±5m replay window + persistent deduplication in foundation | V3 | Verified (exact Gateway JWKS key rotation pending sandbox verification) | `IMPLEMENTED_FOUNDATION_JWKS_PENDING_SANDBOX` |
| Retry, Timeout & Transaction Tracking | Async `202 Accepted` gateway pattern with `transactionId` + `requestId` correlation, bounded retries on `5xx`/`429`/timeout only, idempotent callback deduplication | V3 | Verified from official docs | `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS` |
| Sandbox M2/M3 Test Scenarios | NHA Sandbox M2 (HIP discovery, linking, consent notify, HI push) & M3 (HIU consent request, HI request, decrypt, FHIR display) certification test suite | V3 M2 / M3 | Verified from official docs | `NOT_EXECUTED_PENDING_SANDBOX_ONBOARDING` |

---

## 2. Explicit Notes on Deprecated & Unverified Areas

1. **Deprecated V0.5 / V1 / V2 Paths Excluded:** Legacy `/v0.5/care-contexts/discover`, `/v0.5/links/link/init`, and `/v0.5/health-information/cm/request` endpoints are **not** used; all adapters target verified ABDM **V3** paths under `/api/hiecm/*` and `/api/v3/*`.
2. **Fidelius Curve25519 Form Requirement:** Official ABDM Fidelius interoperability mandates BouncyCastle's **short-Weierstrass Curve25519** representation rather than standard RFC 7748 Montgomery `X25519`. Because Node.js native `crypto` exposes Montgomery `X25519`, HealthBridge implements an explicit `IAbdmEncryptionProvider` interface with a `MockLocalX25519FideliusProvider` for development/unit tests only and **blocks** sandbox/production transfers (`ABDM_ENCRYPTION_NOT_CONFIGURED`) until an official Java Fidelius sidecar or verified short-Weierstrass Curve25519 KMS provider is attached.
3. **Official FHIR IG Conformance:** Internal structural validation verifies `DocumentBundle`, `Composition` at `entry[0]`, `urn:uuid:` reference resolution, duplicate resource prevention, and terminology code systems, but sets `officialIgConformanceClaimed: false` until validated externally with the HAPI FHIR CLI against NRCeS `ndhm.in` `package.tgz`.

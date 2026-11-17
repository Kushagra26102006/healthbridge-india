# ABDM Sandbox Onboarding Guide & Checklist — HealthBridge India

> **Rule:** Never fabricate credentials, registration IDs, or real citizen ABHA numbers during development. Use only official synthetic sandbox test data provisioned through `sandbox.abdm.gov.in`.

---

## Onboarding Checklist

| Step | Onboarding Task | Verification / Readiness Tag | Action & Notes |
|---|---|---|---|
| **1** | **Developer & Organization Registration** | `PENDING_USER_ACTION` | Register the legal organization entity on [https://sandbox.abdm.gov.in/](https://sandbox.abdm.gov.in/) with authorized signatory email, phone, and organization documentation. |
| **2** | **Sandbox Account Activation** | `DEPENDENT_ON_ACCOUNT_ACCESS` | Confirm sandbox portal login and access to [https://developer.abdm.gov.in/](https://developer.abdm.gov.in/) V3 OpenAPI specifications & Postman collections. |
| **3** | **Organization & Product Profile Details** | `PENDING_USER_ACTION` | Submit HealthBridge India product description, software architecture summary (HMIS/LIMS/EMR), and technical point of contact. |
| **4** | **Participant Role Selection** | `VERIFIED_FROM_DOCS` | Select target milestones sequentially: **M1** (ABHA Creation/Verification), **M2** (HIP), and **M3** (HIU). Do not claim production participation during sandbox onboarding. |
| **5** | **Application / Bridge Registration** | `DEPENDENT_ON_ACCOUNT_ACCESS` | Create sandbox bridge application inside the ABDM Sandbox portal to bind HealthBridge India backend endpoints. |
| **6** | **Client Credentials Provisioning** | `DEPENDENT_ON_ACCOUNT_ACCESS` | Obtain Sandbox `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`. Inject strictly via backend hosting secrets manager (never commit to Git, never expose to `apps/web`). |
| **7** | **Public HTTPS Callback URL Registration** | `PENDING_USER_ACTION` | Expose `https://<your-sandbox-api-domain>/api/v1/abdm/webhooks/callback` (and milestone `/api/v3/...` callback paths once finalized) over TLS 1.2+ and register in the sandbox bridge profile. |
| **8** | **Backend Environment Configuration** | `VERIFIED_FROM_DOCS` | Configure `ABDM_ENABLED=true`, `ABDM_ENVIRONMENT=sandbox`, `ABDM_BASE_URL=https://dev.abdm.gov.in`, `ABDM_ABHA_BASE_URL=https://abhasbx.abdm.gov.in/abha/api/v3`, `ABDM_X_CM_ID=sbx`, `ABDM_CALLBACK_URL`, `ABDM_WEBHOOK_SECRET`, and keep `ABDM_ALLOW_PRODUCTION=false`. |
| **9** | **Test HFR / HPR & Synthetic Test Data** | `DEPENDENT_ON_ACCOUNT_ACCESS` | Register sandbox test Facility IDs (HFR) for synthetic clinic & laboratory tenants, test Doctor/Pathologist HPR IDs, and use only official NHA synthetic sandbox ABHA addresses (`*@sbx`). |
| **10** | **Sandbox Connectivity Verification** | `NOT_YET_VERIFIED` | Execute live `POST /api/hiecm/gateway/v3/sessions` handshake from staging backend; confirm `/admin/integrations/abdm` transitions to `CONNECTIVITY_VERIFIED` only after genuine `200/202` response. |
| **11** | **Milestone Functional Testing & FHIR Validation** | `NOT_YET_VERIFIED` | Run official M1, M2, and M3 test cases and validate generated FHIR R4 Document Bundles using HAPI FHIR CLI against NRCeS `ndhm.in` IG (`package.tgz`). |
| **12** | **CERT-In WASA Security Audit & Sandbox Exit** | `DEPENDENT_ON_OFFICIAL_APPROVAL` | Complete Web Application Security Assessment (WASA) via CERT-In empanelled auditor, obtain Safe-to-Host certificate, and secure NHA Sandbox Exit approval prior to enabling production credentials. |

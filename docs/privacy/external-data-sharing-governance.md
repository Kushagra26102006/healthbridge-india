# HealthBridge India — External Data Sharing & ABDM Governance (Day 9 Task 02)

**Frontend Page:** `/patient/data-sharing`  
**Governance Metadata Endpoint:** `GET /api/v1/privacy/governance`

---

## 1. Core External Sharing Controls

1. **Purpose-Specific & Category-Scoped Sharing:** External sharing via ABDM (`ABDM_HEALTH_INFORMATION_EXCHANGE`) requires explicit, active, time-bound patient consent matching the requested `permittedDataTypes`. Complete health records are never automatically shared in bulk.
2. **Immediate Revocation & Expiry Respect:** Consent expiry and synchronous revocation (`ConsentEnforcementService.invalidateConsentImmediately`) take immediate effect on authoritative authorization decisions.
3. **Provenance & Verification Honesty:** Externally imported health records retain provenance (`source: 'ABDM_INGESTION'`, `resourceReference`) and are **never** automatically treated as independently locally verified clinical facts merely because they arrived from an external system.
4. **Environment Separation:** `ABDM_ENABLED=false` and `ABDM_ALLOW_PRODUCTION=false` by default in this environment; live NHA sandbox/production sharing remains disabled until formal NHA onboarding and certification.
5. **Privacy-Safe Notifications:** All consent, access, export, correction, and deletion notifications use neutral previews without clinical values or direct download links.

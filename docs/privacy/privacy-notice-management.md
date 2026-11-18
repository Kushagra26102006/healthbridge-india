# HealthBridge India — Privacy Notice Management (Day 9 Task 02)

**Public Endpoint:** `GET /api/v1/privacy/notice`  
**Patient Acknowledgement Endpoint:** `POST /api/v1/patient/privacy/notice-acknowledgements`  
**Frontend Pages:** `/privacy-policy`, `/patient/privacy-notice`

---

## 1. Versioned Plain-Language Notice Architecture

- **Current Version:** `1.0.0-draft` (`reviewStatus: 'DRAFT_PENDING_LEGAL_COUNSEL_REVIEW'`).
- **Configurable Operator & Grievance Details:** Reads `PRIVACY_ORG_NAME` and `PRIVACY_GRIEVANCE_CONTACT` from server environment configuration — **zero fabricated legal entity addresses, phone numbers, or Grievance Officer names** are hardcoded.
- **Audited Acknowledgements:** Patient acknowledgements are stored in `PrivacyNoticeAcknowledgementModel` (`{ userId, noticeVersion }` unique compound index, recording `acknowledgedAt`, IP, and user-agent) and audited via `securityAuditMonitor` (`PRIVACY_NOTICE_ACKNOWLEDGED`).
- **Pre-Production Legal Requirement:** Qualified Indian legal counsel must review and approve final statutory language, Data Protection Officer / Grievance Officer details, and multi-language translations (English + scheduled Indian languages as required by notified DPDP Rules) before production launch.

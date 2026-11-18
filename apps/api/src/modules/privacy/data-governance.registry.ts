/**
 * HealthBridge India — Data Classification, Retention Policy & Privacy Notice Registry (Day 9 Task 02)
 *
 * IMPORTANT:
 *   - Does NOT invent universal legal retention periods. All statutory/clinical retention
 *     windows are explicitly marked configurable pending qualified Indian legal counsel review.
 *   - Does NOT fabricate legal entity addresses, DPO names, or statutory grievance contacts;
 *     reads configurable placeholders until production legal configuration is supplied.
 */

export type DataClassificationTier =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'PERSONAL'
  | 'SENSITIVE_HEALTH_INFORMATION'
  | 'AUTHENTICATION_AND_SECURITY'
  | 'EXTERNAL_INTEGRATION';

export interface DataClassificationSpec {
  tier: DataClassificationTier;
  description: string;
  fieldExamples: string[];
  permittedPurposes: string[];
  authorizedRoles: string[];
  loggingRestriction: string;
  retentionPolicyKey: string;
  exportEligible: boolean;
  deletionEligible: 'ELIGIBLE' | 'RESTRICTED_RETENTION' | 'NON_DELETABLE_AUDIT';
}

export const DATA_CLASSIFICATION_REGISTRY: Record<DataClassificationTier, DataClassificationSpec> = {
  PUBLIC: {
    tier: 'PUBLIC',
    description: 'Information intentionally published for public discovery.',
    fieldExamples: ['doctor.specialization', 'pharmacy.publicName', 'privacyNotice.content'],
    permittedPurposes: ['PUBLIC_DISCOVERY', 'TRANSPARENCY'],
    authorizedRoles: ['PUBLIC', 'PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN'],
    loggingRestriction: 'Standard operational logging allowed.',
    retentionPolicyKey: 'ACCOUNT_INFORMATION',
    exportEligible: false,
    deletionEligible: 'ELIGIBLE',
  },
  INTERNAL: {
    tier: 'INTERNAL',
    description: 'Non-public operational metadata such as queue status, schedules, and aggregate counts.',
    fieldExamples: ['outboxEvent.status', 'labSample.accessionStatus', 'pharmacyInventory.batchQty'],
    permittedPurposes: ['ADMINISTRATIVE_OPERATIONS', 'HEALTHCARE_COORDINATION'],
    authorizedRoles: ['DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN'],
    loggingRestriction: 'Operational metadata only; exclude patient identifiers.',
    retentionPolicyKey: 'NOTIFICATION_RECORDS',
    exportEligible: false,
    deletionEligible: 'RESTRICTED_RETENTION',
  },
  PERSONAL: {
    tier: 'PERSONAL',
    description: 'Patient and provider personal account, demographic, and contact fields.',
    fieldExamples: ['user.name', 'user.email', 'user.phone', 'patientProfile.dob', 'patientProfile.address'],
    permittedPurposes: ['PATIENT_SELF_ACCESS', 'TREATMENT', 'HEALTHCARE_COORDINATION', 'ADMINISTRATIVE_OPERATIONS'],
    authorizedRoles: ['PATIENT', 'DOCTOR', 'ADMIN'],
    loggingRestriction: 'Minimize in operational logs; mask contact identifiers where non-essential.',
    retentionPolicyKey: 'ACCOUNT_INFORMATION',
    exportEligible: true,
    deletionEligible: 'ELIGIBLE',
  },
  SENSITIVE_HEALTH_INFORMATION: {
    tier: 'SENSITIVE_HEALTH_INFORMATION',
    description: 'Clinical records, diagnoses, encounters, prescriptions, diagnostic reports, and uploaded documents.',
    fieldExamples: ['medicalRecord.description', 'prescription.medications', 'labReport.results', 'encounter.diagnosis'],
    permittedPurposes: ['PATIENT_SELF_ACCESS', 'TREATMENT', 'LABORATORY_SERVICE', 'PHARMACY_FULFILLMENT', 'ABDM_HEALTH_INFORMATION_EXCHANGE'],
    authorizedRoles: ['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY'],
    loggingRestriction: 'STRICTLY PROHIBITED in application logs, audit metadata, search logs, and notification previews.',
    retentionPolicyKey: 'CLINICAL_RECORDS',
    exportEligible: true,
    deletionEligible: 'RESTRICTED_RETENTION',
  },
  AUTHENTICATION_AND_SECURITY: {
    tier: 'AUTHENTICATION_AND_SECURITY',
    description: 'Password hashes, refresh/verification token hashes, sessions, and immutable security audit logs.',
    fieldExamples: ['user.passwordHash', 'refreshToken.tokenHash', 'auditLog.action', 'auditLog.requestId'],
    permittedPurposes: ['SECURITY_ENFORCEMENT', 'ADMINISTRATIVE_OPERATIONS'],
    authorizedRoles: ['ADMIN'],
    loggingRestriction: 'Secrets/hashes strictly prohibited in logs and API DTOs (`select: false` + JSON strip).',
    retentionPolicyKey: 'AUDIT_LOGS',
    exportEligible: false,
    deletionEligible: 'NON_DELETABLE_AUDIT',
  },
  EXTERNAL_INTEGRATION: {
    tier: 'EXTERNAL_INTEGRATION',
    description: 'ABHA identity mappings, ABDM consent artefacts, callback nonces, and imported external FHIR records.',
    fieldExamples: ['abhaProfile.abhaNumberEncrypted', 'consentArtifact.consentStatus', 'externalRecord.resourceReference'],
    permittedPurposes: ['ABDM_HEALTH_INFORMATION_EXCHANGE', 'PATIENT_SELF_ACCESS'],
    authorizedRoles: ['PATIENT', 'DOCTOR', 'ADMIN'],
    loggingRestriction: 'ABHA numbers and OTPs redacted in Pino logs; external provenance always preserved.',
    retentionPolicyKey: 'EXTERNAL_INTEGRATION_RECORDS',
    exportEligible: true,
    deletionEligible: 'RESTRICTED_RETENTION',
  },
};

export interface DataRetentionPolicyItem {
  policyKey: string;
  policyVersion: string;
  categoryLabel: string;
  businessPurpose: string;
  retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW' | 'OPERATIONAL_DEFAULT';
  configuredRetentionWindow: string;
  legalHoldApplicable: boolean;
  deletionEligibility: 'ELIGIBLE_ON_REQUEST' | 'RESTRICTED_CLINICAL_INTEGRITY' | 'IMMUTABLE_AUDIT_RETENTION';
  archivalStrategy: string;
  disposalMethod: string;
  systemOwner: string;
}

export const DATA_RETENTION_POLICIES: ReadonlyArray<DataRetentionPolicyItem> = [
  {
    policyKey: 'CLINICAL_RECORDS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Clinical Encounters & Medical Records',
    businessPurpose: 'Continuity of patient care, clinical integrity, and medico-legal accountability.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Configurable by legal counsel (never auto-deleted on account closure)',
    legalHoldApplicable: true,
    deletionEligibility: 'RESTRICTED_CLINICAL_INTEGRITY',
    archivalStrategy: 'Restricted read-only clinical archive upon account closure',
    disposalMethod: 'Authorized legal/clinical sign-off + cryptographic erasure after retention expiry',
    systemOwner: 'Clinical Data Governance Team',
  },
  {
    policyKey: 'PRESCRIPTIONS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Prescriptions & Dispensing Records',
    businessPurpose: 'Medication safety, pharmacovigilance, and pharmacy dispensing accountability.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Configurable per applicable pharmacy/medical regulations (pending legal review)',
    legalHoldApplicable: true,
    deletionEligibility: 'RESTRICTED_CLINICAL_INTEGRITY',
    archivalStrategy: 'Immutable dispensing record archive',
    disposalMethod: 'Controlled post-retention disposal with immutable audit record',
    systemOwner: 'Pharmacy & Clinical Governance Team',
  },
  {
    policyKey: 'LABORATORY_REPORTS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Laboratory Orders, Samples & Diagnostic Reports',
    businessPurpose: 'Diagnostic continuity, NABL quality traceability, and clinical accountability.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Configurable per diagnostic laboratory policy & legal review',
    legalHoldApplicable: true,
    deletionEligibility: 'RESTRICTED_CLINICAL_INTEGRITY',
    archivalStrategy: 'Restricted read-only archive with versioned amendments only',
    disposalMethod: 'Authorized post-retention disposal with immutable audit log',
    systemOwner: 'Laboratory Governance Team',
  },
  {
    policyKey: 'APPOINTMENTS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Appointments & Scheduling History',
    businessPurpose: 'Care coordination and scheduling history.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Configurable operational window (pending legal review)',
    legalHoldApplicable: true,
    deletionEligibility: 'RESTRICTED_CLINICAL_INTEGRITY',
    archivalStrategy: 'Anonymization or restricted retention when linked to clinical encounters',
    disposalMethod: 'De-identification or controlled erasure',
    systemOwner: 'Care Coordination Operations',
  },
  {
    policyKey: 'ACCOUNT_INFORMATION',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Personal Account & Profile Contact Details',
    businessPurpose: 'Authentication, account identity, and patient communication.',
    retentionStatus: 'OPERATIONAL_DEFAULT',
    configuredRetentionWindow: 'Active account lifecycle; deactivated/closed upon verified patient request',
    legalHoldApplicable: true,
    deletionEligibility: 'ELIGIBLE_ON_REQUEST',
    archivalStrategy: 'Soft deactivation / restricted pseudonymized stub where linked to retained clinical records',
    disposalMethod: 'Field redaction / erasure once no legal hold or clinical dependency requires identity',
    systemOwner: 'Identity & Privacy Operations',
  },
  {
    policyKey: 'AUTHENTICATION_LOGS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Refresh Tokens, Verification Tokens & Session Records',
    businessPurpose: 'Session security, token reuse detection, and breach containment.',
    retentionStatus: 'OPERATIONAL_DEFAULT',
    configuredRetentionWindow: 'TTL auto-expiry (7 days refresh tokens; 24h post-expiry verification tokens)',
    legalHoldApplicable: false,
    deletionEligibility: 'ELIGIBLE_ON_REQUEST',
    archivalStrategy: 'MongoDB TTL automatic expiration',
    disposalMethod: 'Automated TTL purge + immediate revocation on logout/closure',
    systemOwner: 'Platform Security Team',
  },
  {
    policyKey: 'AUDIT_LOGS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Security Audit Logs & Data Access Transparency Ledger',
    businessPurpose: 'Non-repudiation, incident investigation, and patient access transparency.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Configurable immutable audit retention window (pending legal/CERT-In review)',
    legalHoldApplicable: true,
    deletionEligibility: 'IMMUTABLE_AUDIT_RETENTION',
    archivalStrategy: 'Append-only WORM/SIEM archival',
    disposalMethod: 'Protected from deletion; scheduled archive purge only after legal retention expiry',
    systemOwner: 'Security & Compliance Team',
  },
  {
    policyKey: 'NOTIFICATION_RECORDS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'In-App Notifications & Delivery Logs',
    businessPurpose: 'User workflow alerts and delivery reliability.',
    retentionStatus: 'OPERATIONAL_DEFAULT',
    configuredRetentionWindow: 'Configurable rolling retention (e.g. 90-180 days)',
    legalHoldApplicable: false,
    deletionEligibility: 'ELIGIBLE_ON_REQUEST',
    archivalStrategy: 'Rolling purge of non-security operational notifications',
    disposalMethod: 'Direct deletion of eligible non-clinical notification entries',
    systemOwner: 'Platform Messaging Team',
  },
  {
    policyKey: 'UPLOADED_DOCUMENTS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'Patient-Uploaded Medical Documents',
    businessPurpose: 'Personal health record storage and clinical sharing.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Governed by clinical record policy once linked to care; configurable for unlinked uploads',
    legalHoldApplicable: true,
    deletionEligibility: 'RESTRICTED_CLINICAL_INTEGRITY',
    archivalStrategy: 'Private encrypted storage with restricted retention if clinically referenced',
    disposalMethod: 'Cryptographic key/object erasure + immutable disposal audit event',
    systemOwner: 'Clinical Document Storage Team',
  },
  {
    policyKey: 'EXTERNAL_INTEGRATION_RECORDS',
    policyVersion: 'v1.0-draft',
    categoryLabel: 'ABHA Mappings, Consent Artefacts & ABDM Imported Records',
    businessPurpose: 'Consent provenance, ABDM interoperability, and external record traceability.',
    retentionStatus: 'CONFIGURABLE_PENDING_LEGAL_REVIEW',
    configuredRetentionWindow: 'Configurable per ABDM ecosystem & legal counsel guidance',
    legalHoldApplicable: true,
    deletionEligibility: 'RESTRICTED_CLINICAL_INTEGRITY',
    archivalStrategy: 'Local ABHA unlinking supported; external copies remain governed by external HIPs/ABDM',
    disposalMethod: 'Local unlink & provenance preservation; cannot remotely delete external hospital records',
    systemOwner: 'ABDM Interoperability Team',
  },
];

export interface PrivacyNoticeDocumentDto {
  version: string;
  effectiveDate: string;
  reviewStatus: 'DRAFT_PENDING_LEGAL_COUNSEL_REVIEW';
  organization: {
    name: string;
    grievanceContactConfigured: boolean;
    grievanceChannelLabel: string;
  };
  sections: Array<{
    id: string;
    title: string;
    summary: string;
    points: string[];
  }>;
}

export function getCurrentPrivacyNotice(): PrivacyNoticeDocumentDto {
  const orgName = process.env.PRIVACY_ORG_NAME || 'HealthBridge India (Platform Operator — Configurable)';
  const grievanceEmail = process.env.PRIVACY_GRIEVANCE_CONTACT || '';

  return {
    version: '1.0.0-draft',
    effectiveDate: '2026-11-18',
    reviewStatus: 'DRAFT_PENDING_LEGAL_COUNSEL_REVIEW',
    organization: {
      name: orgName,
      grievanceContactConfigured: Boolean(grievanceEmail),
      grievanceChannelLabel: grievanceEmail
        ? grievanceEmail
        : 'Privacy Grievance Officer contact not yet configured — use the in-app Privacy Request portal until production legal details are provisioned.',
    },
    sections: [
      {
        id: 'collected-data',
        title: 'Information We Collect',
        summary: 'We collect only the information needed to provide healthcare coordination and secure platform access.',
        points: [
          'Account & contact details: name, email address, mobile number, and role profile.',
          'Health & clinical records: appointments, doctor consultation summaries, prescriptions, laboratory reports, and documents you upload.',
          'External healthcare identifiers: ABHA address or linked ABDM references only when you choose to connect them.',
          'Security & access logs: sign-in history, consent actions, and who accessed your records.',
        ],
      },
      {
        id: 'purposes',
        title: 'Why We Use Your Information',
        summary: 'Your data is used strictly for authorized healthcare workflows and never shared broadly upon sign-up.',
        points: [
          'Providing you direct access to your own health timeline, prescriptions, and diagnostic reports.',
          'Supporting treatment, pharmacy dispensing, and diagnostic laboratory services you initiate or authorize.',
          'Sharing health information externally via ABDM only when you explicitly grant time-bound, category-specific consent.',
          'Maintaining account security, fraud prevention, and auditable access transparency.',
        ],
      },
      {
        id: 'sharing-and-abdm',
        title: 'How Your Information Is Shared',
        summary: 'Registering an account does NOT grant blanket permission to share your medical records.',
        points: [
          'Doctors, pharmacies, and laboratories only see records scoped to your active care relationship, order, or explicit consent.',
          'External ABDM/ABHA sharing is currently disabled in local/sandbox environments unless explicitly enabled and consented.',
          'You can review, reject, or immediately revoke active consents at any time from your Privacy Dashboard.',
        ],
      },
      {
        id: 'retention',
        title: 'How Long Information Is Kept',
        summary: 'Different healthcare records follow distinct clinical, operational, and legal retention rules.',
        points: [
          'Finalized clinical records, prescriptions, and lab reports are protected for clinical integrity and medico-legal accountability and are not automatically erased when you close an account.',
          'Authentication tokens expire automatically; personal profile details and non-clinical records can be closed, restricted, or removed subject to active legal holds.',
          'Exact statutory retention durations are configurable and subject to final legal counsel sign-off prior to production launch.',
        ],
      },
      {
        id: 'your-controls',
        title: 'Your Privacy Controls & Rights',
        summary: 'You can exercise practical control over your personal data from the Patient Privacy Dashboard.',
        points: [
          'View who accessed your records, for what purpose, and when.',
          'Export a private copy of your eligible records (time-limited secure download).',
          'Submit correction requests for inaccurate personal details or request authorized clinical amendments.',
          'Request account deactivation, account closure, or eligible personal data deletion with transparent retention feedback.',
        ],
      },
    ],
  };
}

export function evaluateDeletionEligibility(activeLegalHoldIds: string[]) {
  const retentionBlockedCategories = DATA_RETENTION_POLICIES.filter(
    (p) => p.deletionEligibility !== 'ELIGIBLE_ON_REQUEST'
  ).map((p) => p.policyKey);

  const eligibleCategories = DATA_RETENTION_POLICIES.filter(
    (p) => p.deletionEligibility === 'ELIGIBLE_ON_REQUEST'
  ).map((p) => p.policyKey);

  const legalHoldBlocked = activeLegalHoldIds.length > 0;

  return {
    legalHoldBlocked,
    activeLegalHoldIds,
    retentionBlockedCategories: legalHoldBlocked
      ? Array.from(new Set([...retentionBlockedCategories, ...eligibleCategories]))
      : retentionBlockedCategories,
    eligibleCategories: legalHoldBlocked ? [] : eligibleCategories,
    externalIntegrationCaveat:
      'Closing or restricting your HealthBridge account unlinks local ABHA references only; it does not remotely delete records held independently by external hospitals, pharmacies, laboratories, or ABDM Health Information Providers.',
    backupCaveat:
      'Encrypted disaster-recovery database backups age out on their configured backup lifecycle and cannot be selectively rewritten instantaneously; restored environments replay deletion/restriction logs.',
  };
}

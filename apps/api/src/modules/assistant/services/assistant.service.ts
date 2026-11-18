import { z } from 'zod';

export type AssistantRole = 'PUBLIC' | 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

export interface AssistantActionLink {
  label: string;
  href: string;
}

export interface AssistantReplyDto {
  reply: string;
  category:
    | 'EMERGENCY'
    | 'CLINICAL_DISCLAIMER'
    | 'APPOINTMENTS'
    | 'RECORDS'
    | 'PRESCRIPTIONS'
    | 'LABORATORY'
    | 'PHARMACY'
    | 'CONSENT'
    | 'ABHA_ABDM'
    | 'SECURITY_AUDIT'
    | 'NOTIFICATIONS'
    | 'ACCOUNT'
    | 'GENERAL';
  isEmergency: boolean;
  actions: AssistantActionLink[];
  suggestions: string[];
  disclaimer: string;
  timestamp: string;
}

export const assistantChatRequestSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Please enter a message')
    .max(500, 'Message cannot exceed 500 characters'),
  pathname: z.string().trim().max(200).optional(),
});

const STANDARD_DISCLAIMER =
  'HealthBridge Assistant provides platform navigation and general guidance only — it is not a medical diagnosis or prescription tool.';

const EMERGENCY_REGEX =
  /\b(chest pain|heart attack|stroke|can'?t breathe|cannot breathe|difficulty breathing|shortness of breath|severe bleeding|unconscious|seizure|overdose|suicid|self[- ]?harm|poisoning|medical emergency)\b/i;

const CLINICAL_ADVICE_REGEX =
  /\b(diagnose|diagnosis|what medicine should i take|which tablet|dosage for|prescribe me|cure for|symptoms of|am i having|treat my)\b/i;

function getRoleSuggestions(role: AssistantRole): string[] {
  switch (role) {
    case 'PATIENT':
      return [
        'Book an appointment',
        'Upload a medical record',
        'Manage data consent',
        'How does ABHA work?',
      ];
    case 'DOCTOR':
      return [
        'View today’s patient queue',
        'Start a clinical consultation',
        'Write a digital prescription',
        'View clinical analytics',
      ];
    case 'PHARMACY':
      return [
        'Open prescription queue',
        'Check low stock & expiry alerts',
        'Dispense a prescription',
        'Manage medicine inventory',
      ];
    case 'LABORATORY':
      return [
        'Review lab test orders',
        'Scan sample barcode',
        'Authorize diagnostic reports',
        'Open quality control (QMS)',
      ];
    case 'ADMIN':
      return [
        'Open immutable audit logs',
        'Check ABDM readiness',
        'Review security center',
        'Manage role permissions',
      ];
    default:
      return [
        'How do I register on HealthBridge?',
        'What is ABHA & ABDM?',
        'How is my medical data protected?',
        'Explore supported portals',
      ];
  }
}

export class AssistantService {
  respond(rawMessage: string, role: AssistantRole = 'PUBLIC'): AssistantReplyDto {
    const message = rawMessage.trim();
    const lower = message.toLowerCase();
    const timestamp = new Date().toISOString();

    // 1. Highest priority: Medical Emergency Safety Escalation
    if (EMERGENCY_REGEX.test(lower)) {
      return {
        reply:
          'If you or someone near you is experiencing a medical emergency, please stop using this chat and call **112** (India National Emergency Helpline) or **108** (Emergency Ambulance) immediately, or go to the nearest hospital emergency department.',
        category: 'EMERGENCY',
        isEmergency: true,
        actions:
          role === 'PATIENT'
            ? [{ label: 'Book Urgent Clinic Visit', href: '/patient/appointments/book' }]
            : [],
        suggestions: ['How do I book a doctor consultation?', 'View my health records'],
        disclaimer: 'Emergency assistance: Call 112 or 108 immediately in India.',
        timestamp,
      };
    }

    // 2. Clinical diagnosis / medication advice boundary
    if (CLINICAL_ADVICE_REGEX.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'PATIENT'
          ? [
              { label: 'Book Doctor Consultation', href: '/patient/appointments/book' },
              { label: 'View My Prescriptions', href: '/patient/prescriptions' },
            ]
          : role === 'DOCTOR'
            ? [{ label: 'Medication Catalog', href: '/doctor/medications/catalog' }]
            : [{ label: 'Sign In to Book a Doctor', href: '/login' }];

      return {
        reply:
          'I cannot provide medical diagnoses, symptom assessments, or medication dosages. Please consult a verified healthcare practitioner on HealthBridge India for clinical advice tailored to your health history.',
        category: 'CLINICAL_DISCLAIMER',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 3. ABHA & ABDM Interoperability
    if (/\b(abha|abdm|fhir|hip|hiu|health id|ayushman)\b/i.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'PATIENT'
          ? [
              { label: 'Open ABHA Identity Portal', href: '/patient/abha' },
              { label: 'Manage Data Consents', href: '/patient/consent' },
            ]
          : role === 'ADMIN'
            ? [{ label: 'ABDM Integration Console', href: '/admin/integrations/abdm' }]
            : role === 'DOCTOR'
              ? [{ label: 'ABDM Health Records (HIU)', href: '/doctor/abdm/health-records' }]
              : [{ label: 'Sign In / Register', href: '/register' }];

      return {
        reply:
          'HealthBridge India supports ABHA-compatible identity linking and HL7 FHIR R4 interoperability under the Ayushman Bharat Digital Mission (ABDM) framework. Linking an ABHA identity never shares records automatically — every exchange requires explicit patient consent.',
        category: 'ABHA_ABDM',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 4. Consent, Privacy & Security
    if (/\b(consent|revoke|privacy|dpdp|share|permission|data protection)\b/i.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'PATIENT'
          ? [
              { label: 'Consent & Data Sharing', href: '/patient/consent' },
              { label: 'Privacy Controls', href: '/patient/settings/privacy' },
            ]
          : role === 'ADMIN'
            ? [
                { label: 'Consent Oversight', href: '/admin/consent-oversight' },
                { label: 'Privacy Requests', href: '/admin/privacy-requests' },
              ]
            : [{ label: 'Read Privacy Notice', href: '/privacy-policy' }];

      return {
        reply:
          'All health record sharing on HealthBridge India is strictly consent-based. Patients control exact data categories, clinical purpose, and expiry dates — and revoking a consent blocks further access immediately.',
        category: 'CONSENT',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 5. Audit Logs & SecOps (strictly scoped — never reveals admin routes to non-admins)
    if (/\b(audit|security|alert|incident|rbac|role|monitoring)\b/i.test(lower)) {
      if (role === 'ADMIN') {
        return {
          reply:
            'You can inspect append-only immutable audit logs, export formula-safe redacted CSV reports, review SecOps alerts, and verify RBAC policies directly from the Admin Control Center.',
          category: 'SECURITY_AUDIT',
          isEmergency: false,
          actions: [
            { label: 'Immutable Audit Logs', href: '/admin/audit-logs' },
            { label: 'Security Center', href: '/admin/security/overview' },
            { label: 'Role Management', href: '/admin/roles' },
          ],
          suggestions: getRoleSuggestions(role),
          disclaimer: STANDARD_DISCLAIMER,
          timestamp,
        };
      }
      return {
        reply:
          'HealthBridge India enforces server-side role-based access control (RBAC), short-lived signed document links, HTTP-only session cookies, and tamper-resistant audit logging. You can review your active sessions and security settings in your account preferences.',
        category: 'SECURITY_AUDIT',
        isEmergency: false,
        actions:
          role === 'PATIENT'
            ? [{ label: 'Account Security', href: '/patient/settings/security' }]
            : role === 'PHARMACY'
              ? [{ label: 'Pharmacy Security', href: '/pharmacy/settings/security' }]
              : [{ label: 'Privacy & Security Policy', href: '/privacy-policy' }],
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 6. Prescriptions & Pharmacy (checked before generic queue so "prescription queue" routes to Pharmacy)
    if (/\b(prescription|rx|medicine|pharmacy|dispense|inventory|stock|batch|expiry|order)\b/i.test(lower) && !/\blab\b|\blaboratory\b|\btest order/i.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'PHARMACY'
          ? [
              { label: 'Prescription Queue', href: '/pharmacy/prescriptions' },
              { label: 'Medicine Inventory', href: '/pharmacy/inventory' },
              { label: 'Low Stock & Expiry Alerts', href: '/pharmacy/inventory/alerts' },
              { label: 'Dispensing Desk', href: '/pharmacy/dispensing' },
            ]
          : role === 'DOCTOR'
            ? [
                { label: 'Write Prescription', href: '/doctor/prescriptions/new' },
                { label: 'Prescriptions List', href: '/doctor/prescriptions' },
              ]
            : role === 'PATIENT'
              ? [
                  { label: 'My Prescriptions', href: '/patient/prescriptions' },
                  { label: 'Pharmacy Orders', href: '/patient/orders' },
                ]
              : [{ label: 'Sign In to Portal', href: '/login' }];

      return {
        reply:
          role === 'PHARMACY'
            ? 'Verify clinician-issued digital prescriptions, manage batch/expiry stock ledgers, track low-stock alerts, and complete atomic dispensing from your Pharmacy workspace.'
            : 'Digital prescriptions on HealthBridge India include structured dosage instructions, duration, and direct verification pathways for connected pharmacies.',
        category: role === 'PHARMACY' ? 'PHARMACY' : 'PRESCRIPTIONS',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 7. Appointments & Patient Queue
    if (/\b(appointment|book|slot|schedule|reschedule|cancel|queue|consultation|encounter)\b/i.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'PATIENT'
          ? [
              { label: 'Book Appointment', href: '/patient/appointments/book' },
              { label: 'My Appointments', href: '/patient/appointments' },
            ]
          : role === 'DOCTOR'
            ? [
                { label: 'Patient Queue', href: '/doctor/queue' },
                { label: 'Appointments', href: '/doctor/appointments' },
                { label: 'New Consultation', href: '/doctor/encounters/new' },
              ]
            : [{ label: 'Sign In to Book', href: '/login' }];

      return {
        reply:
          role === 'DOCTOR'
            ? 'Manage today’s queue, review scheduled appointments, configure clinic slots, or start a new SOAP clinical consultation from your Doctor workspace.'
            : 'Discover verified doctors by specialization, pick an available in-person or teleconsultation slot, and manage rescheduling or cancellations in your Appointments portal.',
        category: 'APPOINTMENTS',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 8. Medical Documents & Health Records
    if (/\b(record|document|upload|pdf|timeline|vault|ehr|history)\b/i.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'PATIENT'
          ? [{ label: 'Open Health Records Vault', href: '/patient/records' }]
          : role === 'DOCTOR'
            ? [{ label: 'My Consented Patients', href: '/doctor/patients' }]
            : [{ label: 'Sign In to View Records', href: '/login' }];

      return {
        reply:
          'Upload PDF or image medical records (up to 10 MB) into your private Health Records vault with automatic duplicate detection, chronological timeline view, and short-lived secure preview links.',
        category: 'RECORDS',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 9. Laboratory, Samples & Diagnostic Reports
    if (/\b(lab|laboratory|report|sample|barcode|diagnostic|pathology|qc|quality|test order)\b/i.test(lower)) {
      const actions: AssistantActionLink[] =
        role === 'LABORATORY'
          ? [
              { label: 'Lab Test Orders', href: '/laboratory/orders' },
              { label: 'Scan Sample Barcode', href: '/laboratory/samples/scan' },
              { label: 'Diagnostic Reports', href: '/laboratory/reports' },
              { label: 'Quality Control (QMS)', href: '/laboratory/quality' },
            ]
          : role === 'PATIENT'
            ? [
                { label: 'My Lab Reports', href: '/patient/lab-reports' },
                { label: 'Lab Orders', href: '/patient/lab-orders' },
              ]
            : role === 'DOCTOR'
              ? [{ label: 'Patient Workspace', href: '/doctor/patients' }]
              : [{ label: 'Sign In to Portal', href: '/login' }];

      return {
        reply:
          role === 'LABORATORY'
            ? 'Track test orders, scan sample barcodes, enforce Quality Control (QC) release gates, and authorize published diagnostic reports in your Laboratory workspace.'
            : 'Diagnostic laboratory reports are published with structured reference ranges, abnormal result highlights, and secure PDF previews once verified by the laboratory.',
        category: 'LABORATORY',
        isEmergency: false,
        actions,
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 10. Notifications & Global Search
    if (/\b(notification|alert|bell|unread|search|find)\b/i.test(lower)) {
      const notifPath =
        role === 'PATIENT'
          ? '/patient/notifications'
          : role === 'DOCTOR'
            ? '/doctor/notifications'
            : role === 'PHARMACY'
              ? '/pharmacy/notifications'
              : role === 'LABORATORY'
                ? '/laboratory/notifications'
                : role === 'ADMIN'
                  ? '/admin/notifications'
                  : '/login';

      return {
        reply:
          'You can view real-time privacy-safe notifications from your Notification Center or press **Cmd+K / Ctrl+K** anywhere in the dashboard to open Global Search across authorized records and actions.',
        category: 'NOTIFICATIONS',
        isEmergency: false,
        actions:
          role === 'PUBLIC'
            ? [{ label: 'Sign In', href: '/login' }]
            : [
                { label: 'Open Notifications', href: notifPath },
                { label: 'Global Search', href: '/dashboard/search' },
              ],
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 11. Registration, Login & Account Help
    if (/\b(register|sign up|signup|login|sign in|password|account|forgot)\b/i.test(lower)) {
      return {
        reply:
          'Create an account as a Patient, Doctor, Pharmacy, or Diagnostic Laboratory using your email and 10-digit Indian mobile number, or reset a forgotten password securely via email verification.',
        category: 'ACCOUNT',
        isEmergency: false,
        actions: [
          { label: 'Sign In', href: '/login' },
          { label: 'Create Account', href: '/register' },
          { label: 'Forgot Password', href: '/forgot-password' },
        ],
        suggestions: getRoleSuggestions(role),
        disclaimer: STANDARD_DISCLAIMER,
        timestamp,
      };
    }

    // 12. Friendly Greeting / General Overview
    const rolePortalLink: AssistantActionLink[] =
      role === 'PATIENT'
        ? [{ label: 'Patient Dashboard', href: '/patient/dashboard' }]
        : role === 'DOCTOR'
          ? [{ label: 'Doctor Workspace', href: '/doctor/dashboard' }]
          : role === 'PHARMACY'
            ? [{ label: 'Pharmacy Workspace', href: '/pharmacy/dashboard' }]
            : role === 'LABORATORY'
              ? [{ label: 'Laboratory Workspace', href: '/laboratory/dashboard' }]
              : role === 'ADMIN'
                ? [{ label: 'Admin Control Center', href: '/admin/dashboard' }]
                : [
                    { label: 'Create Account', href: '/register' },
                    { label: 'Sign In', href: '/login' },
                  ];

    return {
      reply:
        'Hello! I’m the **HealthBridge Assistant**. Ask me how to book appointments, upload medical records, manage data consent, understand ABHA/ABDM workflows, or jump directly to any feature in your portal.',
      category: 'GENERAL',
      isEmergency: false,
      actions: rolePortalLink,
      suggestions: getRoleSuggestions(role),
      disclaimer: STANDARD_DISCLAIMER,
      timestamp,
    };
  }
}

export const assistantService = new AssistantService();

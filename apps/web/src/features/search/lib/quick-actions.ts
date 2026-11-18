/**
 * HealthBridge India — Role-Aware Quick Actions & Smart Navigation Registry (Phase 15)
 *
 * Every action route maps strictly to an existing, role-authorized Next.js page.
 * Zero placeholder routes, zero cross-role links.
 */

export type SearchPortalRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

export type QuickActionIconKey =
  | 'calendar-plus'
  | 'calendar'
  | 'file-heart'
  | 'pill'
  | 'flask'
  | 'shield-check'
  | 'id-card'
  | 'bar-chart'
  | 'settings'
  | 'users'
  | 'stethoscope'
  | 'clipboard-plus'
  | 'clock'
  | 'package'
  | 'alert-triangle'
  | 'shopping-bag'
  | 'plus-circle'
  | 'scan-barcode'
  | 'test-tube'
  | 'file-check'
  | 'beaker'
  | 'activity'
  | 'lock'
  | 'scroll-text'
  | 'building';

export interface RoleQuickAction {
  id: string;
  role: SearchPortalRole;
  label: string;
  description: string;
  href: string;
  category: string;
  keywords: string[];
  icon: QuickActionIconKey;
}

const ROLE_QUICK_ACTIONS: Record<SearchPortalRole, RoleQuickAction[]> = {
  PATIENT: [
    {
      id: 'patient-book-appointment',
      role: 'PATIENT',
      label: 'Book Appointment',
      description: 'Schedule a consultation with a verified doctor',
      href: '/patient/appointments/book',
      category: 'Appointments',
      keywords: ['book', 'schedule', 'visit', 'doctor', 'slot', 'consultation'],
      icon: 'calendar-plus',
    },
    {
      id: 'patient-appointments',
      role: 'PATIENT',
      label: 'My Appointments',
      description: 'View upcoming and past medical appointments',
      href: '/patient/appointments',
      category: 'Appointments',
      keywords: ['appointments', 'visits', 'bookings', 'schedule'],
      icon: 'calendar',
    },
    {
      id: 'patient-records',
      role: 'PATIENT',
      label: 'Health Records',
      description: 'Access your clinical encounters and health timeline',
      href: '/patient/records',
      category: 'Clinical Records',
      keywords: ['records', 'ehr', 'history', 'medical', 'encounters'],
      icon: 'file-heart',
    },
    {
      id: 'patient-prescriptions',
      role: 'PATIENT',
      label: 'Prescriptions',
      description: 'Review active and historical digital prescriptions',
      href: '/patient/prescriptions',
      category: 'Medications',
      keywords: ['prescriptions', 'rx', 'medicines', 'medications', 'drugs'],
      icon: 'pill',
    },
    {
      id: 'patient-lab-reports',
      role: 'PATIENT',
      label: 'Lab Reports',
      description: 'Inspect published diagnostic test reports',
      href: '/patient/lab-reports',
      category: 'Diagnostics',
      keywords: ['lab', 'reports', 'diagnostics', 'pathology', 'blood', 'tests'],
      icon: 'flask',
    },
    {
      id: 'patient-consent',
      role: 'PATIENT',
      label: 'Consent & Data Sharing',
      description: 'Manage ABDM health data consent requests and artefacts',
      href: '/patient/consent',
      category: 'Privacy & ABDM',
      keywords: ['consent', 'abdm', 'privacy', 'sharing', 'permissions'],
      icon: 'shield-check',
    },
    {
      id: 'patient-abha',
      role: 'PATIENT',
      label: 'ABHA Health ID',
      description: 'View or link your Ayushman Bharat Health Account',
      href: '/patient/abha',
      category: 'Privacy & ABDM',
      keywords: ['abha', 'health id', 'ayushman', 'ndhm', 'abdm'],
      icon: 'id-card',
    },
    {
      id: 'patient-analytics',
      role: 'PATIENT',
      label: 'Health Analytics',
      description: 'Explore personal care activity and trends',
      href: '/patient/analytics',
      category: 'Insights',
      keywords: ['analytics', 'charts', 'trends', 'summary', 'insights'],
      icon: 'bar-chart',
    },
    {
      id: 'patient-settings',
      role: 'PATIENT',
      label: 'Account & Security Settings',
      description: 'Manage notifications, active sessions, and privacy controls',
      href: '/patient/settings',
      category: 'Settings',
      keywords: ['settings', 'security', 'sessions', 'preferences', 'profile'],
      icon: 'settings',
    },
  ],
  DOCTOR: [
    {
      id: 'doctor-queue',
      role: 'DOCTOR',
      label: 'Patient Queue',
      description: "Open today's live consultation queue",
      href: '/doctor/queue',
      category: 'Clinical Workflow',
      keywords: ['queue', 'waiting', 'live', 'today', 'triage', 'opd'],
      icon: 'clock',
    },
    {
      id: 'doctor-appointments',
      role: 'DOCTOR',
      label: 'Appointments',
      description: 'Review scheduled, upcoming, and past appointments',
      href: '/doctor/appointments',
      category: 'Clinical Workflow',
      keywords: ['appointments', 'schedule', 'calendar', 'visits'],
      icon: 'calendar',
    },
    {
      id: 'doctor-new-encounter',
      role: 'DOCTOR',
      label: 'New Consultation',
      description: 'Document a new clinical encounter and assessment',
      href: '/doctor/encounters/new',
      category: 'Clinical Workflow',
      keywords: ['consultation', 'encounter', 'new', 'visit', 'notes', 'soap'],
      icon: 'stethoscope',
    },
    {
      id: 'doctor-new-prescription',
      role: 'DOCTOR',
      label: 'Write Prescription',
      description: 'Issue a new digital prescription for an authorized patient',
      href: '/doctor/prescriptions/new',
      category: 'Prescribing',
      keywords: ['prescription', 'rx', 'write', 'create', 'medication'],
      icon: 'clipboard-plus',
    },
    {
      id: 'doctor-patients',
      role: 'DOCTOR',
      label: 'My Patients',
      description: 'Browse patients under your authorized care',
      href: '/doctor/patients',
      category: 'Patients',
      keywords: ['patients', 'directory', 'records', 'history'],
      icon: 'users',
    },
    {
      id: 'doctor-schedule',
      role: 'DOCTOR',
      label: 'Clinic Schedule',
      description: 'Manage weekly availability slots and blocked dates',
      href: '/doctor/schedule',
      category: 'Practice',
      keywords: ['schedule', 'availability', 'slots', 'hours', 'blocked'],
      icon: 'calendar-plus',
    },
    {
      id: 'doctor-analytics',
      role: 'DOCTOR',
      label: 'Clinical Analytics',
      description: 'View consultation volume and prescription trends',
      href: '/doctor/analytics',
      category: 'Insights',
      keywords: ['analytics', 'metrics', 'charts', 'statistics', 'volume'],
      icon: 'bar-chart',
    },
    {
      id: 'doctor-settings',
      role: 'DOCTOR',
      label: 'Doctor Settings',
      description: 'Configure practice details, notifications, and security',
      href: '/doctor/settings',
      category: 'Settings',
      keywords: ['settings', 'profile', 'security', 'practice', 'notifications'],
      icon: 'settings',
    },
  ],
  PHARMACY: [
    {
      id: 'pharmacy-prescriptions',
      role: 'PHARMACY',
      label: 'Prescription Queue',
      description: 'Verify incoming prescriptions ready for dispensing',
      href: '/pharmacy/prescriptions',
      category: 'Dispensing',
      keywords: ['prescriptions', 'queue', 'rx', 'verify', 'dispense'],
      icon: 'pill',
    },
    {
      id: 'pharmacy-inventory',
      role: 'PHARMACY',
      label: 'Medicine Inventory',
      description: 'Inspect medicine stock levels, batches, and catalogue',
      href: '/pharmacy/inventory',
      category: 'Inventory',
      keywords: ['inventory', 'stock', 'medicines', 'batches', 'catalogue'],
      icon: 'package',
    },
    {
      id: 'pharmacy-alerts',
      role: 'PHARMACY',
      label: 'Low Stock & Expiry Alerts',
      description: 'Review reorder alerts and expiring medicine batches',
      href: '/pharmacy/inventory/alerts',
      category: 'Inventory',
      keywords: ['alerts', 'low stock', 'expiry', 'expiring', 'reorder'],
      icon: 'alert-triangle',
    },
    {
      id: 'pharmacy-dispensing',
      role: 'PHARMACY',
      label: 'Dispensing Desk',
      description: 'Manage active dispensing records and receipts',
      href: '/pharmacy/dispensing',
      category: 'Dispensing',
      keywords: ['dispensing', 'counter', 'receipts', 'fulfill'],
      icon: 'clipboard-plus',
    },
    {
      id: 'pharmacy-orders',
      role: 'PHARMACY',
      label: 'Medicine Orders',
      description: 'Track customer pickup and fulfillment orders',
      href: '/pharmacy/orders',
      category: 'Orders',
      keywords: ['orders', 'pickup', 'fulfillment', 'delivery'],
      icon: 'shopping-bag',
    },
    {
      id: 'pharmacy-add-medicine',
      role: 'PHARMACY',
      label: 'Add Medicine SKU',
      description: 'Register a new medicine item in pharmacy inventory',
      href: '/pharmacy/inventory/medicines/new',
      category: 'Inventory',
      keywords: ['add', 'new medicine', 'sku', 'catalog', 'create'],
      icon: 'plus-circle',
    },
    {
      id: 'pharmacy-analytics',
      role: 'PHARMACY',
      label: 'Pharmacy Analytics',
      description: 'Monitor dispensing throughput and stock health',
      href: '/pharmacy/analytics',
      category: 'Insights',
      keywords: ['analytics', 'charts', 'revenue', 'stock', 'trends'],
      icon: 'bar-chart',
    },
    {
      id: 'pharmacy-settings',
      role: 'PHARMACY',
      label: 'Pharmacy Settings',
      description: 'Manage store profile, operating hours, and staff security',
      href: '/pharmacy/settings',
      category: 'Settings',
      keywords: ['settings', 'hours', 'staff', 'security', 'business'],
      icon: 'settings',
    },
  ],
  LABORATORY: [
    {
      id: 'lab-orders',
      role: 'LABORATORY',
      label: 'Lab Test Orders',
      description: 'Process incoming diagnostic test requests',
      href: '/laboratory/orders',
      category: 'Diagnostics',
      keywords: ['orders', 'requests', 'worklist', 'diagnostic'],
      icon: 'flask',
    },
    {
      id: 'lab-scan-sample',
      role: 'LABORATORY',
      label: 'Scan Sample Barcode',
      description: 'Verify specimen barcode and chain of custody',
      href: '/laboratory/samples/scan',
      category: 'Samples',
      keywords: ['scan', 'barcode', 'specimen', 'sample', 'custody'],
      icon: 'scan-barcode',
    },
    {
      id: 'lab-collect-sample',
      role: 'LABORATORY',
      label: 'Sample Collection',
      description: 'Record specimen collection and phlebotomy intake',
      href: '/laboratory/samples/collect',
      category: 'Samples',
      keywords: ['collect', 'sample', 'specimen', 'phlebotomy', 'intake'],
      icon: 'test-tube',
    },
    {
      id: 'lab-reports',
      role: 'LABORATORY',
      label: 'Diagnostic Reports',
      description: 'Review, approve, and publish laboratory reports',
      href: '/laboratory/reports',
      category: 'Reporting',
      keywords: ['reports', 'results', 'approve', 'publish', 'pathology'],
      icon: 'file-check',
    },
    {
      id: 'lab-tests',
      role: 'LABORATORY',
      label: 'Test Catalogue',
      description: 'Manage diagnostic panels, pricing, and reference ranges',
      href: '/laboratory/tests',
      category: 'Catalogue',
      keywords: ['tests', 'catalogue', 'panels', 'assays'],
      icon: 'beaker',
    },
    {
      id: 'lab-quality-analytics',
      role: 'LABORATORY',
      label: 'Quality & TAT Analytics',
      description: 'Track turnaround time, QC runs, and NABL compliance',
      href: '/laboratory/quality/analytics',
      category: 'Quality',
      keywords: ['quality', 'analytics', 'tat', 'qc', 'nabl', 'charts'],
      icon: 'bar-chart',
    },
    {
      id: 'lab-reagents',
      role: 'LABORATORY',
      label: 'Reagent Inventory',
      description: 'Monitor reagent lots, stock levels, and expiration',
      href: '/laboratory/inventory/reagents',
      category: 'Inventory',
      keywords: ['reagents', 'inventory', 'consumables', 'stock'],
      icon: 'package',
    },
    {
      id: 'lab-settings',
      role: 'LABORATORY',
      label: 'Laboratory Settings',
      description: 'Configure laboratory profile, preferences, and security',
      href: '/laboratory/settings',
      category: 'Settings',
      keywords: ['settings', 'configuration', 'preferences', 'profile'],
      icon: 'settings',
    },
  ],
  ADMIN: [
    {
      id: 'admin-overview',
      role: 'ADMIN',
      label: 'Platform Overview',
      description: 'Inspect operational metrics and platform analytics',
      href: '/admin/platform-overview',
      category: 'Governance',
      keywords: ['overview', 'analytics', 'platform', 'metrics', 'kpi'],
      icon: 'bar-chart',
    },
    {
      id: 'admin-roles',
      role: 'ADMIN',
      label: 'Role & Access Control',
      description: 'Review RBAC permissions and workspace governance',
      href: '/admin/roles',
      category: 'Access Control',
      keywords: ['roles', 'rbac', 'permissions', 'users', 'access'],
      icon: 'lock',
    },
    {
      id: 'admin-consent',
      role: 'ADMIN',
      label: 'Consent Oversight',
      description: 'Monitor ABDM consent artefacts and compliance requests',
      href: '/admin/consent-oversight',
      category: 'Compliance',
      keywords: ['consent', 'abdm', 'privacy', 'oversight', 'dpdp'],
      icon: 'shield-check',
    },
    {
      id: 'admin-audit',
      role: 'ADMIN',
      label: 'Audit Logs',
      description: 'Inspect security and administrative audit trails',
      href: '/admin/audit-logs',
      category: 'Security',
      keywords: ['audit', 'logs', 'trail', 'activity', 'compliance'],
      icon: 'scroll-text',
    },
    {
      id: 'admin-security',
      role: 'ADMIN',
      label: 'Security Center',
      description: 'Review security alerts, incidents, and data protection',
      href: '/admin/security/overview',
      category: 'Security',
      keywords: ['security', 'alerts', 'incidents', 'vulnerabilities', 'encryption'],
      icon: 'alert-triangle',
    },
    {
      id: 'admin-monitoring',
      role: 'ADMIN',
      label: 'System Monitoring',
      description: 'Check service uptime, health status, and platform events',
      href: '/admin/system-monitoring',
      category: 'Operations',
      keywords: ['monitoring', 'health', 'uptime', 'system', 'status'],
      icon: 'activity',
    },
    {
      id: 'admin-abdm',
      role: 'ADMIN',
      label: 'ABDM Integration',
      description: 'Inspect Ayushman Bharat Digital Mission gateway status',
      href: '/admin/integrations/abdm',
      category: 'Integrations',
      keywords: ['abdm', 'integration', 'gateway', 'ndhm', 'hip', 'hiu'],
      icon: 'building',
    },
    {
      id: 'admin-settings',
      role: 'ADMIN',
      label: 'Admin Settings',
      description: 'Manage Super Admin console preferences and notifications',
      href: '/admin/settings',
      category: 'Settings',
      keywords: ['settings', 'preferences', 'configuration', 'admin'],
      icon: 'settings',
    },
  ],
};

function normalizeRole(role?: string | null): SearchPortalRole | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (
    upper === 'PATIENT' ||
    upper === 'DOCTOR' ||
    upper === 'PHARMACY' ||
    upper === 'LABORATORY' ||
    upper === 'ADMIN'
  ) {
    return upper;
  }
  return null;
}

export function getQuickActionsForRole(role?: string | null): RoleQuickAction[] {
  const normalized = normalizeRole(role);
  if (!normalized) return [];
  return ROLE_QUICK_ACTIONS[normalized];
}

export function getAllQuickActions(): RoleQuickAction[] {
  return Object.values(ROLE_QUICK_ACTIONS).flat();
}

export function filterQuickActions(
  role: string | null | undefined,
  query: string,
  limit = 6
): RoleQuickAction[] {
  const actions = getQuickActionsForRole(role);
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return actions.slice(0, limit);
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const scored: Array<{ action: RoleQuickAction; score: number }> = [];

  for (const action of actions) {
    const label = action.label.toLowerCase();
    const desc = action.description.toLowerCase();
    const category = action.category.toLowerCase();
    const keywords = action.keywords.join(' ').toLowerCase();
    const haystack = `${label} ${desc} ${category} ${keywords}`;

    if (!tokens.every((t) => haystack.includes(t))) {
      continue;
    }

    let score = 0;
    if (label.startsWith(trimmed)) score += 100;
    else if (label.includes(trimmed)) score += 70;
    if (action.keywords.some((k) => k.toLowerCase() === trimmed)) score += 60;
    else if (keywords.includes(trimmed)) score += 40;
    if (category.includes(trimmed)) score += 25;
    if (desc.includes(trimmed)) score += 15;

    scored.push({ action, score });
  }

  scored.sort((a, b) => b.score - a.score || a.action.label.localeCompare(b.action.label));
  return scored.slice(0, limit).map((item) => item.action);
}

export function getRoleDashboardHome(role?: string | null): { href: string; label: string } {
  switch (normalizeRole(role)) {
    case 'PATIENT':
      return { href: '/patient/dashboard', label: 'Patient Dashboard' };
    case 'DOCTOR':
      return { href: '/doctor/dashboard', label: 'Doctor Workspace' };
    case 'PHARMACY':
      return { href: '/pharmacy/dashboard', label: 'Pharmacy Workspace' };
    case 'LABORATORY':
      return { href: '/laboratory/dashboard', label: 'Laboratory Workspace' };
    case 'ADMIN':
      return { href: '/admin/dashboard', label: 'Admin Control Center' };
    default:
      return { href: '/dashboard', label: 'Dashboard' };
  }
}

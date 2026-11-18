'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Search,
  Lock,
  Users,
  Stethoscope,
  Building2,
  FlaskConical,
  Info,
} from 'lucide-react';
import type { AdminPlatformOverviewDto } from '@healthbridge/shared-types';
import { platformApi } from '@/features/platform/api/platform-api';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ServerRolePolicy {
  role: 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY';
  label: string;
  scopeBoundary: string;
  description: string;
  permissions: string[];
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Mirrors server-side `apps/api/src/security/permissions.registry.ts` (read-only governance view).
 * Authorization is ALWAYS enforced on the backend — never by frontend checks alone.
 */
const SERVER_ROLE_POLICIES: ServerRolePolicy[] = [
  {
    role: 'ADMIN',
    label: 'Platform Administrator',
    scopeBoundary: 'PLATFORM_OPERATIONS',
    description:
      'Restricted to operational governance, account lifecycle policy, event replay, and audit metadata — never unrestricted clinical records.',
    permissions: [
      'admin:users:manage',
      'admin:platform:monitor',
      'admin:events:manage',
      'admin:audit:read',
      'admin:abdm:monitor',
      'admin:notifications:publish_operational',
    ],
    icon: ShieldCheck,
  },
  {
    role: 'PATIENT',
    label: 'Patient',
    scopeBoundary: 'SELF',
    description:
      'Patient self-service access strictly isolated to own canonical patientId and personal health records.',
    permissions: [
      'patient:profile:read:own',
      'patient:profile:write:own',
      'patient:records:read:own',
      'patient:records:write:own',
      'patient:appointments:manage:own',
      'patient:prescriptions:read:own',
      'patient:lab_reports:read:own',
      'patient:consent:manage:own',
      'patient:timeline:read:own',
    ],
    icon: Users,
  },
  {
    role: 'DOCTOR',
    label: 'Doctor',
    scopeBoundary: 'CARE_RELATIONSHIP_AND_CONSENT',
    description:
      'Licensed clinician scoped to assigned appointments/care relationships and active patient consent.',
    permissions: [
      'doctor:patients:read:assigned',
      'doctor:appointments:manage:assigned',
      'doctor:encounters:manage:assigned',
      'doctor:prescriptions:issue',
      'doctor:lab_orders:create',
      'doctor:lab_reports:read:authorized',
      'doctor:records:read:consented',
      'doctor:consent:request',
    ],
    icon: Stethoscope,
  },
  {
    role: 'PHARMACY',
    label: 'Pharmacy Facility',
    scopeBoundary: 'FACILITY_PHARMACY',
    description:
      'Pharmacy facility scoped to eligible prescriptions, own inventory, procurement, and dispensing.',
    permissions: [
      'pharmacy:prescriptions:read:eligible',
      'pharmacy:dispensing:execute:scoped',
      'pharmacy:inventory:manage:scoped',
      'pharmacy:orders:manage:scoped',
      'pharmacy:procurement:manage:scoped',
    ],
    icon: Building2,
  },
  {
    role: 'LABORATORY',
    label: 'Diagnostic Laboratory',
    scopeBoundary: 'FACILITY_LABORATORY',
    description:
      'Diagnostic laboratory scoped to assigned lab orders, samples, QC, and authorized report publication.',
    permissions: [
      'laboratory:orders:manage:scoped',
      'laboratory:samples:manage:scoped',
      'laboratory:results:enter:scoped',
      'laboratory:reports:publish:scoped',
      'laboratory:quality:manage:scoped',
    ],
    icon: FlaskConical,
  },
];

const SECOPS_SEPARATED_PERMISSIONS = [
  { permission: 'SECURITY_EVENTS_READ', scope: 'Read sanitized security & authentication events' },
  { permission: 'SECURITY_ALERTS_READ', scope: 'View deduplicated rule-generated alerts' },
  { permission: 'SECURITY_ALERTS_MANAGE', scope: 'Acknowledge, investigate, and resolve alerts with audit notes' },
  { permission: 'SECURITY_INCIDENTS_READ', scope: 'Inspect security incident records and timelines' },
  { permission: 'SECURITY_INCIDENTS_MANAGE', scope: 'Open and triage formal security incidents' },
  {
    permission: 'SECURITY_INCIDENTS_RESPOND',
    scope: 'Separated duty required for CONTAINMENT, ERADICATION, and RECOVERY transitions',
  },
  { permission: 'SECURITY_VULNERABILITIES_READ', scope: 'View tracked dependency and runtime advisories' },
  { permission: 'SECURITY_VULNERABILITIES_MANAGE', scope: 'Log advisories and record risk acceptance justifications' },
];

export default function AdminRolesAndPermissionsPage() {
  const [overview, setOverview] = useState<AdminPlatformOverviewDto | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  useEffect(() => {
    platformApi
      .getAdminPlatformOverview()
      .then(setOverview)
      .catch(() => null);
  }, []);

  const roleCounts: Record<string, number | string> = {
    PATIENT: overview?.users.registeredPatients ?? '—',
    DOCTOR: overview?.users.activeDoctors ?? '—',
    PHARMACY: overview?.users.activePharmacies ?? '—',
    LABORATORY: overview?.users.activeLaboratories ?? '—',
    ADMIN: 'Policy-Managed',
  };

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SERVER_ROLE_POLICIES.filter((policy) => {
      if (selectedRole !== 'ALL' && policy.role !== selectedRole) return false;
      if (!q) return true;
      return (
        policy.role.toLowerCase().includes(q) ||
        policy.label.toLowerCase().includes(q) ||
        policy.description.toLowerCase().includes(q) ||
        policy.permissions.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [search, selectedRole]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="primary" size="sm">
            Server-Enforced RBAC
          </Badge>
          <Badge variant="success" size="sm">
            <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
            Unrestricted Clinical Access: Disabled for All Roles
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-secondary" aria-hidden="true" />
          <span>Roles, Permissions &amp; Access Boundaries</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Authoritative server-side role policies across all 5 HealthBridge India roles plus separated Security Operations permissions.
        </p>
      </div>

      {/* Transparent Scope Disclosure */}
      <Alert variant="info" title="Read-Only Governance Policy & Pending Directory APIs">
        <div className="flex items-start gap-2 text-xs">
          <Info className="h-4 w-4 shrink-0 mt-0.5 hidden sm:block" aria-hidden="true" />
          <span>
            Role definitions are enforced server-side in <code className="font-mono">ROLE_PERMISSION_REGISTRY</code> (there is no separate <code className="font-mono">SUPER_ADMIN</code> enum; privileged SecOps actions require explicit <code className="font-mono">AdminProfile.permissions</code> grants). Runtime role assignment, paginated User Directory CRUD (<code className="font-mono">/api/v1/users</code>), and Hospital/Clinic verification approval endpoints are not yet implemented in the backend — preventing any unsafe frontend-only privilege mutation.
          </span>
        </div>
      </Alert>

      {/* Search & Role Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permissions (e.g. consent, dispensing, audit)..."
            aria-label="Search roles and permissions"
            className="pl-9"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          aria-label="Filter by role"
          className="h-10 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-ring"
        >
          <option value="ALL">All Platform Roles (5)</option>
          {SERVER_ROLE_POLICIES.map((p) => (
            <option key={p.role} value={p.role}>
              {p.label} ({p.role})
            </option>
          ))}
        </select>
      </div>

      {/* Role Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredRoles.map((policy) => {
          const Icon = policy.icon;
          return (
            <Card key={policy.role} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{policy.label}</CardTitle>
                      <CardDescription className="font-mono text-[11px] mt-0.5">
                        Role: {policy.role} · Scope: {policy.scopeBoundary}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm" className="font-mono shrink-0">
                    Active: {roleCounts[policy.role]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {policy.description}
                </p>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Granted Permissions ({policy.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {policy.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded-sm bg-muted border border-border/70 font-mono text-[11px] text-foreground"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Separation of Duties: SecOps AdminProfile Permissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
            <span>Least-Privilege SecOps Separation of Duties</span>
          </CardTitle>
          <CardDescription>
            Ordinary ADMIN accounts do NOT automatically receive SecOps permissions. Each capability below must be explicitly assigned on <code className="font-mono">AdminProfile.permissions</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SECOPS_SEPARATED_PERMISSIONS.map((item) => (
              <div
                key={item.permission}
                className="p-3 rounded-lg border border-border bg-muted/25 space-y-1"
              >
                <p className="font-mono text-xs font-semibold text-foreground">{item.permission}</p>
                <p className="text-xs text-muted-foreground">{item.scope}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

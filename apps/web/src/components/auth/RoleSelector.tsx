'use client';

import React from 'react';
import { User, Stethoscope, Pill, FlaskConical, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@healthbridge/shared-types';

export type PublicRegistrationRole = Exclude<UserRole, 'ADMIN'>;

export interface RoleSelectorProps {
  selectedRole: PublicRegistrationRole;
  onSelectRole: (role: PublicRegistrationRole) => void;
  className?: string;
}

interface RoleOption {
  id: PublicRegistrationRole;
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

export function RoleSelector({ selectedRole, onSelectRole, className }: RoleSelectorProps) {
  const roles: RoleOption[] = [
    {
      id: 'PATIENT',
      title: 'Patient',
      badge: 'Individual',
      description:
        'Access personal health records, link your ABHA address, and control doctor consent.',
      icon: <User className="h-5 w-5" />,
    },
    {
      id: 'DOCTOR',
      title: 'Doctor',
      badge: 'Clinician',
      description:
        'Access authorized patient histories, create digital prescriptions, and track encounters.',
      icon: <Stethoscope className="h-5 w-5" />,
    },
    {
      id: 'PHARMACY',
      title: 'Pharmacy',
      badge: 'Dispensary',
      description:
        'Verify digital prescriptions, maintain dispensation logs, and ensure drug authenticity.',
      icon: <Pill className="h-5 w-5" />,
    },
    {
      id: 'LABORATORY',
      title: 'Diagnostic Lab',
      badge: 'Diagnostics',
      description:
        'Upload diagnostic lab reports directly to patient accounts with reference parameters.',
      icon: <FlaskConical className="h-5 w-5" />,
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select Account Role
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose the role that fits your healthcare function. Note: Administrative roles are
          invitation-only.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {roles.map((item) => {
          const isSelected = selectedRole === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRole(item.id)}
              className={cn(
                'relative flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/15 shadow-xs'
                  : 'border-border/80 bg-card hover:bg-accent/60 hover:border-border'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {item.icon}
              </div>

              <div className="space-y-1 flex-1 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{item.title}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                  {item.description}
                </p>
              </div>

              {isSelected && (
                <CheckCircle2 className="h-4 w-4 text-primary absolute top-3 right-3" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RoleSelector;

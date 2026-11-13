'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleSelector, type PublicRegistrationRole } from './RoleSelector';
import { PatientRegistrationForm } from './PatientRegistrationForm';
import { DoctorRegistrationForm } from './DoctorRegistrationForm';
import { PharmacyRegistrationForm } from './PharmacyRegistrationForm';
import { LaboratoryRegistrationForm } from './LaboratoryRegistrationForm';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RegisterRequestDto } from '@healthbridge/shared-types';

export interface RegistrationFormProps {
  initialRole?: PublicRegistrationRole;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegistrationForm({
  initialRole = 'PATIENT',
  onSuccess,
  onSwitchToLogin,
}: RegistrationFormProps) {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<PublicRegistrationRole>(initialRole);

  const handleRegisterSubmit = async (data: RegisterRequestDto) => {
    await register(data);
    if (onSuccess) {
      onSuccess();
    } else {
      // Role-specific redirect
      if (data.role === 'PATIENT') {
        router.push('/patient/dashboard');
      } else if (data.role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else if (data.role === 'PHARMACY') {
        router.push('/pharmacy/dashboard');
      } else if (data.role === 'LABORATORY') {
        router.push('/laboratory/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Role Selection Cards */}
      <RoleSelector selectedRole={selectedRole} onSelectRole={(role) => setSelectedRole(role)} />

      {/* 2. Role-Specific Form Fields */}
      <div className="pt-2 border-t border-border">
        {selectedRole === 'PATIENT' && (
          <PatientRegistrationForm onSubmit={handleRegisterSubmit} isLoading={isLoading} />
        )}
        {selectedRole === 'DOCTOR' && (
          <DoctorRegistrationForm onSubmit={handleRegisterSubmit} isLoading={isLoading} />
        )}
        {selectedRole === 'PHARMACY' && (
          <PharmacyRegistrationForm onSubmit={handleRegisterSubmit} isLoading={isLoading} />
        )}
        {selectedRole === 'LABORATORY' && (
          <LaboratoryRegistrationForm onSubmit={handleRegisterSubmit} isLoading={isLoading} />
        )}
      </div>

      {/* 3. Link to Login */}
      <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border">
        Already have a HealthBridge India account?{' '}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Sign in here
          </button>
        ) : (
          <Link
            href="/login"
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Sign in here
          </Link>
        )}
      </div>
    </div>
  );
}

export default RegistrationForm;

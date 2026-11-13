'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import type { PublicRegistrationRole } from '@/components/auth/RoleSelector';

function RegisterContent() {
  const searchParams = useSearchParams();
  const rawRole = searchParams.get('role')?.toUpperCase();

  const initialRole: PublicRegistrationRole =
    rawRole === 'DOCTOR' || rawRole === 'PHARMACY' || rawRole === 'LABORATORY'
      ? rawRole
      : 'PATIENT';

  return (
    <AuthLayout
      title="Create Your HealthBridge Account"
      subtitle="Register as an individual citizen or verified healthcare professional to participate in India’s unified digital healthcare network."
    >
      <RegistrationForm initialRole={initialRole} />
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading registration portal...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

'use client';

import React, { useState } from 'react';
import { AuthLayout, type PortalShowcaseKey } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const [activePortal, setActivePortal] = useState<PortalShowcaseKey>('PATIENT');

  return (
    <AuthLayout
      title="Welcome Back to HealthBridge India"
      subtitle="Sign in with your verified credentials to access your ABHA personal health records, e-prescriptions, and clinical care authorizations."
      activePortal={activePortal}
      onPortalChange={setActivePortal}
    >
      <LoginForm onRoleSelect={setActivePortal} />
    </AuthLayout>
  );
}

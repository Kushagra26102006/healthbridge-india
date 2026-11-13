'use client';

import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back to HealthBridge India"
      subtitle="Sign in with your verified credentials to access your ABHA personal health records, e-prescriptions, and clinical care authorizations."
    >
      <LoginForm />
    </AuthLayout>
  );
}

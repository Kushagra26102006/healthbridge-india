'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';
import { Loader2 } from 'lucide-react';
import { registerValidationSchema } from '@healthbridge/validation';
import type { RegisterRequestDto } from '@healthbridge/shared-types';

export interface PatientRegistrationFormProps {
  onSubmit: (data: RegisterRequestDto) => Promise<void>;
  isLoading?: boolean;
}

export function PatientRegistrationForm({ onSubmit, isLoading }: PatientRegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('OTHER');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!termsAccepted) {
      setFormError('You must acknowledge the platform terms and privacy policy to register.');
      return;
    }

    const payload: RegisterRequestDto = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      confirmPassword,
      role: 'PATIENT',
    };

    // Client-side schema validation using shared Zod schema
    const validation = registerValidationSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message || 'Invalid input data';
      setFormError(firstIssue);
      return;
    }

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setFormError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <FormError message={formError} />

      <div className="space-y-1.5">
        <label htmlFor="patient-name" className="block text-xs font-semibold text-foreground">
          Full Name
        </label>
        <Input
          id="patient-name"
          placeholder="e.g. Aarav Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="patient-email" className="block text-xs font-semibold text-foreground">
            Email Address
          </label>
          <Input
            id="patient-email"
            type="email"
            placeholder="aarav.sharma@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="patient-phone" className="block text-xs font-semibold text-foreground">
            10-Digit Mobile Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground text-xs font-semibold">
              +91
            </span>
            <Input
              id="patient-phone"
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              className="rounded-l-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="patient-dob" className="block text-xs font-semibold text-foreground">
            Date of Birth (Optional)
          </label>
          <Input
            id="patient-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="patient-gender" className="block text-xs font-semibold text-foreground">
            Gender (Optional)
          </label>
          <select
            id="patient-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other / Prefer not to say</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordField
          id="patient-password"
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 symbol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <PasswordField
          id="patient-confirm-password"
          label="Confirm Password"
          placeholder="Re-type password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start gap-2.5 pt-1">
        <input
          id="patient-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
          required
        />
        <label htmlFor="patient-terms" className="text-xs text-muted-foreground leading-snug">
          I acknowledge the HealthBridge India data sovereignty guidelines and consent to digital
          account creation.
        </label>
      </div>

      <Button
        type="submit"
        variant="teal"
        size="lg"
        className="w-full shadow-sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Patient Account...
          </>
        ) : (
          'Create Patient Account'
        )}
      </Button>
    </form>
  );
}

export default PatientRegistrationForm;

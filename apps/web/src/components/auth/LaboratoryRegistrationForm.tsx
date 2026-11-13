'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';
import { Loader2, FlaskConical } from 'lucide-react';
import { registerValidationSchema } from '@healthbridge/validation';
import type { RegisterRequestDto } from '@healthbridge/shared-types';

export interface LaboratoryRegistrationFormProps {
  onSubmit: (data: RegisterRequestDto) => Promise<void>;
  isLoading?: boolean;
}

export function LaboratoryRegistrationForm({
  onSubmit,
  isLoading,
}: LaboratoryRegistrationFormProps) {
  const [labName, setLabName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nablId, setNablId] = useState('');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!termsAccepted) {
      setFormError('You must acknowledge diagnostic laboratory compliance requirements.');
      return;
    }

    const payload: RegisterRequestDto = {
      name: `${labName.trim()} (${contactName.trim()})`,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      confirmPassword,
      role: 'LABORATORY',
    };

    const validation = registerValidationSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message || 'Invalid input data';
      setFormError(firstIssue);
      return;
    }

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Laboratory registration failed';
      setFormError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <FormError message={formError} />

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs leading-relaxed">
        <FlaskConical className="h-4 w-4 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
        <span>
          <strong>Diagnostic Network Notice:</strong> Laboratory integrations are initiated in{' '}
          <code>PENDING</code> status. Direct publication to patient health lockers requires NABL or
          state clinical establishment verification.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="lab-name" className="block text-xs font-semibold text-foreground">
            Diagnostic Center / Lab Name
          </label>
          <Input
            id="lab-name"
            placeholder="e.g. Metropolis Diagnostics Hub"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lab-contact" className="block text-xs font-semibold text-foreground">
            Lab Director / Authorized Pathologist
          </label>
          <Input
            id="lab-contact"
            placeholder="e.g. Dr. Sanjay Verma (MD Path)"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="lab-email" className="block text-xs font-semibold text-foreground">
            Laboratory Email Address
          </label>
          <Input
            id="lab-email"
            type="email"
            placeholder="reports@metropolisdiagnostics.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lab-phone" className="block text-xs font-semibold text-foreground">
            10-Digit Mobile Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground text-xs font-semibold">
              +91
            </span>
            <Input
              id="lab-phone"
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
          <label htmlFor="nabl-id" className="block text-xs font-semibold text-foreground">
            NABL Accreditation / State Registration ID
          </label>
          <Input
            id="nabl-id"
            placeholder="e.g. MC-4821 / CEA-DL-2023"
            value={nablId}
            onChange={(e) => setNablId(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lab-address" className="block text-xs font-semibold text-foreground">
            Laboratory Address & Pincode
          </label>
          <Input
            id="lab-address"
            placeholder="e.g. Sector 18, Noida, UP 201301"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordField
          id="lab-password"
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 symbol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <PasswordField
          id="lab-confirm-password"
          label="Confirm Password"
          placeholder="Re-type password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start gap-2.5 pt-1">
        <input
          id="lab-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
          required
        />
        <label htmlFor="lab-terms" className="text-xs text-muted-foreground leading-snug">
          I confirm that all diagnostic reports submitted through this account will be verified by a
          qualified pathologist and adhere to NABL accuracy standards.
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
            Connecting Diagnostic Lab...
          </>
        ) : (
          'Connect Diagnostic Lab'
        )}
      </Button>
    </form>
  );
}

export default LaboratoryRegistrationForm;

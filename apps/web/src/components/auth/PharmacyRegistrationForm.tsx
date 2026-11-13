'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';
import { Loader2, Store } from 'lucide-react';
import { registerValidationSchema } from '@healthbridge/validation';
import type { RegisterRequestDto } from '@healthbridge/shared-types';

export interface PharmacyRegistrationFormProps {
  onSubmit: (data: RegisterRequestDto) => Promise<void>;
  isLoading?: boolean;
}

export function PharmacyRegistrationForm({ onSubmit, isLoading }: PharmacyRegistrationFormProps) {
  const [pharmacyName, setPharmacyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!termsAccepted) {
      setFormError('You must acknowledge statutory retail pharmacy regulations.');
      return;
    }

    const payload: RegisterRequestDto = {
      name: `${pharmacyName.trim()} (${contactName.trim()})`,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      confirmPassword,
      role: 'PHARMACY',
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
      const msg = err instanceof Error ? err.message : 'Pharmacy registration failed';
      setFormError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <FormError message={formError} />

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
        <Store className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Pharmacy Onboarding:</strong> Dispensary accounts are initiated in{' '}
          <code>PENDING</code> status. Live prescription fulfillment capabilities require active
          Drug License verification.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="pharmacy-name" className="block text-xs font-semibold text-foreground">
            Pharmacy / Store Name
          </label>
          <Input
            id="pharmacy-name"
            placeholder="e.g. Apollo Pharmacy #214"
            value={pharmacyName}
            onChange={(e) => setPharmacyName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="block text-xs font-semibold text-foreground">
            Authorized Pharmacist / Contact
          </label>
          <Input
            id="contact-name"
            placeholder="e.g. Rajesh Kumar (R.Ph)"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="pharmacy-email" className="block text-xs font-semibold text-foreground">
            Store Email Address
          </label>
          <Input
            id="pharmacy-email"
            type="email"
            placeholder="store.delhi@pharmacy.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pharmacy-phone" className="block text-xs font-semibold text-foreground">
            10-Digit Mobile Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground text-xs font-semibold">
              +91
            </span>
            <Input
              id="pharmacy-phone"
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
          <label htmlFor="license-number" className="block text-xs font-semibold text-foreground">
            Retail Drug License (Form 20/21)
          </label>
          <Input
            id="license-number"
            placeholder="e.g. DL-2024-8842"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pharmacy-address" className="block text-xs font-semibold text-foreground">
            Premises Address & Pincode
          </label>
          <Input
            id="pharmacy-address"
            placeholder="e.g. Shop 12, Connaught Place, New Delhi 110001"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordField
          id="pharmacy-password"
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 symbol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <PasswordField
          id="pharmacy-confirm-password"
          label="Confirm Password"
          placeholder="Re-type password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start gap-2.5 pt-1">
        <input
          id="pharmacy-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
          required
        />
        <label htmlFor="pharmacy-terms" className="text-xs text-muted-foreground leading-snug">
          I certify that our dispensary possesses valid drug licenses and agree to maintain digital
          prescription fulfillment standards.
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
            Registering Pharmacy Account...
          </>
        ) : (
          'Register Pharmacy Account'
        )}
      </Button>
    </form>
  );
}

export default PharmacyRegistrationForm;

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';
import { Loader2, ShieldAlert } from 'lucide-react';
import { registerValidationSchema } from '@healthbridge/validation';
import type { RegisterRequestDto } from '@healthbridge/shared-types';

export interface DoctorRegistrationFormProps {
  onSubmit: (data: RegisterRequestDto) => Promise<void>;
  isLoading?: boolean;
}

export function DoctorRegistrationForm({ onSubmit, isLoading }: DoctorRegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [specialization, setSpecialization] = useState('General Practice');
  const [qualification, setQualification] = useState('MBBS');
  const [experience, setExperience] = useState('5');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!termsAccepted) {
      setFormError('You must acknowledge the clinical credential verification requirements.');
      return;
    }

    const payload: RegisterRequestDto = {
      name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      confirmPassword,
      role: 'DOCTOR',
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
      const msg = err instanceof Error ? err.message : 'Doctor registration failed';
      setFormError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <FormError message={formError} />

      {/* Professional Credential Verification Alert */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Credential Notice:</strong> Clinical accounts are initialized in{' '}
          <code>PENDING</code> status. Full access to patient records requires verification against
          the National Medical Commission (NMC) registry.
        </span>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="doctor-name" className="block text-xs font-semibold text-foreground">
          Doctor Full Name (with prefix)
        </label>
        <Input
          id="doctor-name"
          placeholder="e.g. Dr. Priya Sen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="doctor-email" className="block text-xs font-semibold text-foreground">
            Official Email Address
          </label>
          <Input
            id="doctor-email"
            type="email"
            placeholder="priya.sen@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="doctor-phone" className="block text-xs font-semibold text-foreground">
            10-Digit Mobile Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground text-xs font-semibold">
              +91
            </span>
            <Input
              id="doctor-phone"
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
          <label htmlFor="doctor-reg" className="block text-xs font-semibold text-foreground">
            Medical Council Reg. Number
          </label>
          <Input
            id="doctor-reg"
            placeholder="e.g. MCI-2015-88219"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="doctor-spec" className="block text-xs font-semibold text-foreground">
            Primary Specialization
          </label>
          <Input
            id="doctor-spec"
            placeholder="e.g. General Practice / Cardiology"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="doctor-qual" className="block text-xs font-semibold text-foreground">
            Highest Medical Qualification
          </label>
          <Input
            id="doctor-qual"
            placeholder="e.g. MBBS, MD, DNB"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="doctor-exp" className="block text-xs font-semibold text-foreground">
            Years of Experience
          </label>
          <Input
            id="doctor-exp"
            type="number"
            min={0}
            max={60}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PasswordField
          id="doctor-password"
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 symbol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <PasswordField
          id="doctor-confirm-password"
          label="Confirm Password"
          placeholder="Re-type password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start gap-2.5 pt-1">
        <input
          id="doctor-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
          required
        />
        <label htmlFor="doctor-terms" className="text-xs text-muted-foreground leading-snug">
          I certify that all medical registration credentials provided are authentic and agree to
          statutory ABDM clinical verification guidelines.
        </label>
      </div>

      <Button
        type="submit"
        variant="default"
        size="lg"
        className="w-full shadow-sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering Doctor Profile...
          </>
        ) : (
          'Register Doctor Profile'
        )}
      </Button>
    </form>
  );
}

export default DoctorRegistrationForm;

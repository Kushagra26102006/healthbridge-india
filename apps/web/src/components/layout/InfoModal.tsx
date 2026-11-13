'use client';

import React, { useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type InfoModalType = 'PRIVACY' | 'TERMS' | 'CONSENT' | null;

export interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [type, onClose]);

  if (!type) return null;

  const contentMap = {
    PRIVACY: {
      title: 'Platform Privacy Principles',
      icon: <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      body: (
        <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            HealthBridge India is engineered with privacy as a foundational constraint. We enforce
            strict patient data sovereignty:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Zero Unauthorized Sharing:</strong> No clinical
              record, diagnostic observation, or prescription is shared with any healthcare provider
              without explicit, verifiable patient consent.
            </li>
            <li>
              <strong className="text-foreground">Zero Plaintext Secrets:</strong> User passwords
              and tokens are never stored or logged in plaintext. Session tokens utilize SHA-256
              hashes and automated family revocation upon reuse.
            </li>
            <li>
              <strong className="text-foreground">Audited Access:</strong> Every medical record
              interaction generates an append-only audit trail capturing the actor ID, purpose, and
              timestamp.
            </li>
          </ul>
        </div>
      ),
    },
    TERMS: {
      title: 'Terms of Service Overview',
      icon: <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      body: (
        <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to HealthBridge India. By using our unified digital health record services, you
            agree to the following operational terms:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Platform Scope:</strong> HealthBridge India
              provides digital health information exchange and personal health locker interfaces. It
              does not replace emergency medical triage or clinical judgment.
            </li>
            <li>
              <strong className="text-foreground">Account Responsibility:</strong> Users are
              responsible for maintaining the confidentiality of their credentials and monitoring
              active consent authorizations.
            </li>
            <li>
              <strong className="text-foreground">Participating Facilities:</strong> Clinical
              records are retrieved from participating healthcare organizations that have integrated
              with the digital health framework.
            </li>
          </ul>
        </div>
      ),
    },
    CONSENT: {
      title: 'Consent Management Framework',
      icon: <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      body: (
        <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            In alignment with national Ayushman Bharat Digital Mission (ABDM) standards, consent in
            HealthBridge India operates through structured Consent Artifacts:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Granular Purpose:</strong> Access requests specify
              a specific clinical care purpose (e.g., consultation, diagnostic review) and date
              ranges.
            </li>
            <li>
              <strong className="text-foreground">Time-Bound Expiration:</strong> All consent
              permissions automatically expire after the authorized duration.
            </li>
            <li>
              <strong className="text-foreground">Instant Revocation:</strong> Patients can revoke
              active consent at any moment through their personal health dashboard, terminating
              provider access immediately.
            </li>
          </ul>
        </div>
      ),
    },
  };

  const active = contentMap[type];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200 space-y-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 h-9 w-9 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            {active.icon}
          </div>
          <div>
            <h3 id="info-modal-title" className="text-lg font-bold text-foreground">
              {active.title}
            </h3>
            <p className="text-[11px] text-muted-foreground">HealthBridge India Specification</p>
          </div>
        </div>

        <div className="py-2 border-y border-border">{active.body}</div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;

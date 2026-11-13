'use client';

import React, { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';

export interface AuthModalProps {
  isOpen: boolean;
  view: 'LOGIN' | 'REGISTER';
  defaultRole?: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY';
  onClose: () => void;
  onSwitchView: (view: 'LOGIN' | 'REGISTER') => void;
}

export function AuthModal({ isOpen, view, defaultRole, onClose, onSwitchView }: AuthModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-background/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 h-9 w-9 rounded-full border border-border bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 pr-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span
              id="auth-modal-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              HealthBridge India • Secure Gateway
            </span>
          </div>
          {defaultRole && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {defaultRole}
            </span>
          )}
        </div>

        {/* Active Form */}
        {view === 'LOGIN' ? (
          <LoginForm onSuccess={onClose} onSwitchToRegister={() => onSwitchView('REGISTER')} />
        ) : (
          <RegisterForm onSuccess={onClose} onSwitchToLogin={() => onSwitchView('LOGIN')} />
        )}
      </div>
    </div>
  );
}

export default AuthModal;

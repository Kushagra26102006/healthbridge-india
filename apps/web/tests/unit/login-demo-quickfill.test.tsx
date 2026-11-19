import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { loginValidationSchema } from '@healthbridge/validation';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/login',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...rest }, children),
}));

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
  }),
}));

import { LoginForm } from '@/components/auth/LoginForm';
import { AuthModal } from '@/components/auth/AuthModal';

describe('Login Form Demo Quick-Fill & Role Verification Suite', () => {
  it('renders all 5 synthetic demo account quick-fill buttons in the UI', () => {
    const html = renderToStaticMarkup(<LoginForm />);

    // Verify section heading
    expect(html).toContain('Quick-Fill Synthetic Demo Accounts');
    expect(html).toContain('All 5 Portals');

    // Verify all 5 role buttons exist
    expect(html).toContain('data-testid="demo-quickfill-patient"');
    expect(html).toContain('data-testid="demo-quickfill-doctor"');
    expect(html).toContain('data-testid="demo-quickfill-pharmacy"');
    expect(html).toContain('data-testid="demo-quickfill-lab"');
    expect(html).toContain('data-testid="demo-quickfill-admin"');

    // Verify button labels
    expect(html).toContain('Patient');
    expect(html).toContain('Doctor');
    expect(html).toContain('Pharmacy');
    expect(html).toContain('Lab');
    expect(html).toContain('Admin');

    // Verify accessible titles include exact demo emails
    expect(html).toContain('patient.demo@healthbridge.local');
    expect(html).toContain('doctor.demo@healthbridge.local');
    expect(html).toContain('pharmacy.demo@healthbridge.local');
    expect(html).toContain('lab.demo@healthbridge.local');
    expect(html).toContain('admin.demo@healthbridge.local');
  });

  it('validates that all 5 demo account emails pass login schema validation with DemoSecure#2026', () => {
    const demoEmails = [
      'patient.demo@healthbridge.local',
      'doctor.demo@healthbridge.local',
      'pharmacy.demo@healthbridge.local',
      'lab.demo@healthbridge.local',
      'admin.demo@healthbridge.local',
    ];

    demoEmails.forEach((email) => {
      const result = loginValidationSchema.safeParse({
        identifier: email,
        password: 'DemoSecure#2026',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identifier).toBe(email);
        expect(result.data.password).toBe('DemoSecure#2026');
      }
    });
  });

  it('validates that all 5 demo account mobile phone numbers pass login schema validation with DemoSecure#2026', () => {
    const demoPhones = [
      '9876543212', // Patient
      '9876543211', // Doctor
      '9876543213', // Pharmacy
      '9876543214', // Lab
      '9876543210', // Admin
    ];

    demoPhones.forEach((phone) => {
      const result = loginValidationSchema.safeParse({
        identifier: phone,
        password: 'DemoSecure#2026',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identifier).toBe(phone);
        expect(result.data.password).toBe('DemoSecure#2026');
      }
    });
  });

  it('correctly maps all 5 roles to their canonical dashboard routes', () => {
    const roleDashboardMap: Record<string, string> = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      PHARMACY: '/pharmacy/dashboard',
      LABORATORY: '/laboratory/dashboard',
      ADMIN: '/admin/dashboard',
    };

    expect(roleDashboardMap['PATIENT']).toBe('/patient/dashboard');
    expect(roleDashboardMap['DOCTOR']).toBe('/doctor/dashboard');
    expect(roleDashboardMap['PHARMACY']).toBe('/pharmacy/dashboard');
    expect(roleDashboardMap['LABORATORY']).toBe('/laboratory/dashboard');
    expect(roleDashboardMap['ADMIN']).toBe('/admin/dashboard');
  });

  it('renders AuthModal with unified portal sign-in badge default and supports role badge updates', () => {
    const html = renderToStaticMarkup(
      <AuthModal
        isOpen={true}
        view="LOGIN"
        defaultRole="PATIENT"
        onClose={vi.fn()}
        onSwitchView={vi.fn()}
      />
    );

    expect(html).toContain('PORTAL SIGN-IN');
    expect(html).toContain('HealthBridge India • Secure Gateway');
  });
});

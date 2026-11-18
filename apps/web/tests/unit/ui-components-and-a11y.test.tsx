import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

const mockPush = vi.fn();
const mockAuthState: {
  user: { id: string; role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN'; name: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
} = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: true,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/patient/dashboard',
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

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    priority: _priority,
    unoptimized: _unoptimized,
    ...rest
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    unoptimized?: boolean;
    [key: string]: unknown;
  }) => React.createElement('img', { src, alt, ...rest }),
}));

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => mockAuthState,
}));

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { FormErrorSummary } from '@/components/ui/form-error-summary';
import { HighlightMatch } from '@/components/search/HighlightMatch';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { EmptyState } from '@/components/ui/empty-state';
import { HealthBridgeChatbot } from '@/components/assistant/HealthBridgeChatbot';
import { ALL_VISUAL_ASSETS } from '@/lib/assets/image-manifest';

describe('Reusable UI Components & Accessibility Semantics', () => {
  it('renders Button with accessible disabled and aria-busy states when loading', () => {
    const html = renderToStaticMarkup(
      <Button variant="primary" loading loadingText="Saving...">
        Save Record
      </Button>
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders Input with explicit label association, aria-invalid, and aria-describedby on error', () => {
    const html = renderToStaticMarkup(
      <Input
        id="patient-email"
        label="Email Address"
        required
        error="Please enter a valid email address"
      />
    );

    expect(html).toContain('for="patient-email"');
    expect(html).toContain('id="patient-email"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="patient-email-message"');
    expect(html).toContain('Please enter a valid email address');
  });

  it('renders Badge variants cleanly', () => {
    const html = renderToStaticMarkup(<Badge variant="success">VERIFIED</Badge>);
    expect(html).toContain('VERIFIED');
  });

  it('renders ErrorState with role="alert", safe user guidance, and reauth link on 401', () => {
    const html = renderToStaticMarkup(
      <ErrorState
        error={{ response: { status: 401 } }}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('Session Expired');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/dashboard"');
  });

  it('renders FormErrorSummary with WCAG 3.3.1 alert role, focusable container, and jump links', () => {
    const emptyHtml = renderToStaticMarkup(<FormErrorSummary errors={[]} />);
    expect(emptyHtml).toBe('');

    const html = renderToStaticMarkup(
      <FormErrorSummary
        errors={[
          { fieldId: 'phone', label: 'Phone', message: 'Must be a valid 10-digit Indian mobile' },
        ]}
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('href="#phone"');
    expect(html).toContain('Phone: Must be a valid 10-digit Indian mobile');
  });

  it('renders HighlightMatch using safe <mark> tags and escapes XSS payloads', () => {
    const html = renderToStaticMarkup(
      <HighlightMatch text="Synthetic <script>alert(1)</script> CBC Report" query="cbc" />
    );

    expect(html).toContain('<mark');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('Permission-Aware UI Behavior — ProtectedRoute', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
    mockAuthState.isInitialized = true;
  });

  it('renders loading security context indicator while auth is initializing', () => {
    mockAuthState.isInitialized = false;
    const html = renderToStaticMarkup(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>Secret Admin Console</div>
      </ProtectedRoute>
    );

    expect(html).toContain('Verifying security context...');
    expect(html).not.toContain('Secret Admin Console');
  });

  it('blocks unauthenticated users from protected children and prompts sign-in', () => {
    const html = renderToStaticMarkup(
      <ProtectedRoute allowedRoles={['PATIENT']}>
        <div>Private Patient Records</div>
      </ProtectedRoute>
    );

    expect(html).toContain('Authentication Required');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('Private Patient Records');
  });

  it('blocks cross-role access (PATIENT attempting ADMIN portal) and shows Access Restricted', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'u1', role: 'PATIENT', name: 'Aarav Synthetic' };

    const html = renderToStaticMarkup(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>Admin Audit Console</div>
      </ProtectedRoute>
    );

    expect(html).toContain('Access Restricted');
    expect(html).toContain('PATIENT');
    expect(html).not.toContain('Admin Audit Console');
  });

  it('renders protected healthcare workspace when user holds an allowed role', () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'u2', role: 'DOCTOR', name: 'Dr. Kavita Synthetic' };

    const html = renderToStaticMarkup(
      <ProtectedRoute allowedRoles={['DOCTOR']}>
        <div>Authorized Doctor Clinical Workspace</div>
      </ProtectedRoute>
    );

    expect(html).toContain('Authorized Doctor Clinical Workspace');
    expect(html).not.toContain('Access Restricted');
  });
});

describe('Visual Asset System — Manifest Integrity, File Existence & Accessibility', () => {
  it('verifies every manifest asset exists in public/, has valid dimensions, license, and WCAG alt text', () => {
    expect(ALL_VISUAL_ASSETS.length).toBe(30);
    const publicDir = path.resolve(process.cwd(), 'public');

    for (const asset of ALL_VISUAL_ASSETS) {
      const fullPath = path.join(publicDir, asset.src);
      expect(fs.existsSync(fullPath), `Missing image asset on disk: ${asset.src}`).toBe(true);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.license.length).toBeGreaterThan(5);

      if (asset.decorative) {
        expect(asset.alt).toBe('');
      } else {
        expect(asset.alt.length).toBeGreaterThan(15);
      }
    }
  });

  it('renders EmptyState with decorative SVG illustration marked aria-hidden="true" and alt=""', () => {
    const html = renderToStaticMarkup(
      <EmptyState
        illustration="no-appointments"
        title="No upcoming appointments"
        description="Schedule your next consultation."
      />
    );

    expect(html).toContain('/images/empty-states/no-appointments.svg');
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders HealthBridgeChatbot launcher button with accessible label and collapsed state', () => {
    const html = renderToStaticMarkup(<HealthBridgeChatbot />);
    expect(html).toContain('Open HealthBridge Assistant');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Health Assistant');
  });
});

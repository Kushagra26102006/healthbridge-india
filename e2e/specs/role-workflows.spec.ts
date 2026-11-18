import { test, expect, type Page } from '@playwright/test';
import {
  SYNTHETIC_E2E_ACCOUNTS,
  assertSafeE2ETarget,
  type E2ERole,
} from '../fixtures/synthetic-users';

async function signInAs(page: Page, role: E2ERole) {
  const account = SYNTHETIC_E2E_ACCOUNTS[role];
  await page.goto('/login');
  await page.getByLabel(/email|mobile|identifier/i).first().fill(account.identifier);
  await page.getByLabel(/password/i).first().fill(account.password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(`**${account.dashboardPath}**`, { timeout: 15_000 });
}

test.beforeEach(async ({ baseURL }) => {
  assertSafeE2ETarget(baseURL || 'http://127.0.0.1:3000');
});

test.describe('Public Auth & Route Protection', () => {
  test('landing page, login, and registration forms render cleanly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();

    await page.goto('/register');
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('unauthenticated access to protected portals shows authentication guard', async ({
    page,
  }) => {
    await page.goto('/admin/audit-logs');
    await expect(
      page.getByText(/Authentication Required|Sign In to Continue/i).first()
    ).toBeVisible();
  });
});

test.describe('PATIENT End-to-End Workflows', () => {
  test('navigates dashboard, appointments, records, prescriptions, lab reports, consent & notifications', async ({
    page,
  }) => {
    await signInAs(page, 'PATIENT');

    const patientRoutes = [
      '/patient/dashboard',
      '/patient/profile',
      '/patient/appointments/book',
      '/patient/appointments',
      '/patient/records',
      '/patient/prescriptions',
      '/patient/lab-reports',
      '/patient/consent',
      '/patient/notifications',
    ];

    for (const route of patientRoutes) {
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible();
    }

    // Cross-role enforcement: patient must be blocked from Admin Audit Logs
    await page.goto('/admin/audit-logs');
    await expect(page.getByText(/Access Restricted/i)).toBeVisible();
  });
});

test.describe('DOCTOR End-to-End Workflows', () => {
  test('navigates doctor dashboard, appointments, patients, consultations & prescriptions', async ({
    page,
  }) => {
    await signInAs(page, 'DOCTOR');

    for (const route of [
      '/doctor/dashboard',
      '/doctor/appointments',
      '/doctor/patients',
      '/doctor/encounters',
      '/doctor/prescriptions',
      '/doctor/analytics',
    ]) {
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible();
    }
  });
});

test.describe('PHARMACY End-to-End Workflows', () => {
  test('navigates inventory, prescription queue, dispensing desk & stock alerts', async ({
    page,
  }) => {
    await signInAs(page, 'PHARMACY');

    for (const route of [
      '/pharmacy/dashboard',
      '/pharmacy/inventory',
      '/pharmacy/prescriptions',
      '/pharmacy/dispensing',
      '/pharmacy/inventory/alerts',
    ]) {
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible();
    }
  });
});

test.describe('LABORATORY End-to-End Workflows', () => {
  test('navigates test orders, sample tracking, quality control & diagnostic reports', async ({
    page,
  }) => {
    await signInAs(page, 'LABORATORY');

    for (const route of [
      '/laboratory/dashboard',
      '/laboratory/orders',
      '/laboratory/samples',
      '/laboratory/reports',
      '/laboratory/quality',
    ]) {
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible();
    }
  });
});

test.describe('ADMIN End-to-End Workflows', () => {
  test('navigates overview, roles, audit logs, security center & ABDM integration console', async ({
    page,
  }) => {
    await signInAs(page, 'ADMIN');

    for (const route of [
      '/admin/dashboard',
      '/admin/platform-overview',
      '/admin/roles',
      '/admin/audit-logs',
      '/admin/security/overview',
      '/admin/integrations/abdm',
    ]) {
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';
import { assertSafeE2ETarget } from '../fixtures/synthetic-users';

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

const PUBLIC_AND_SHELL_ROUTES = ['/', '/login', '/register', '/privacy-policy'];

test.beforeEach(async ({ baseURL }) => {
  assertSafeE2ETarget(baseURL || 'http://127.0.0.1:3000');
});

test.describe('Responsive Layout Matrix (320px - 1440px, Light & Dark Modes)', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const vp of VIEWPORTS) {
      test(`zero horizontal overflow at ${vp.width}px in ${theme} mode`, async ({ page }) => {
        await page.setViewportSize(vp);

        for (const route of PUBLIC_AND_SHELL_ROUTES) {
          await page.goto(route, { waitUntil: 'networkidle' });
          await page.evaluate((mode) => {
            document.documentElement.classList.toggle('dark', mode === 'dark');
          }, theme);

          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth - window.innerWidth;
          });

          expect(
            overflow,
            `Horizontal overflow detected on ${route} at ${vp.width}px (${theme} mode): ${overflow}px`
          ).toBeLessThanOrEqual(2);
        }
      });
    }
  }
});

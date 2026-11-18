#!/usr/bin/env node
/**
 * HealthBridge India — Live Headless Chrome CDP Responsive, Accessibility (axe-core) & Performance Auditor
 *
 * Uses locally installed Google Chrome + vendored axe-core@4.14.0 + Node built-in WebSocket (zero external deps).
 * Runs against a local Next.js server (http://127.0.0.1:<port>) and emits structured JSON measurements.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3019';
const CHROME_PATH =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = Number(process.env.QA_CDP_PORT || 9229);

const VIEWPORTS = [320, 375, 390, 430, 768, 1024, 1280, 1440];
const AUDIT_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/privacy-policy',
  '/patient/dashboard',
  '/doctor/dashboard',
  '/pharmacy/dashboard',
  '/laboratory/dashboard',
  '/admin/audit-logs',
  '/dashboard/search',
];

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

function findAxeSource() {
  const pnpmRoot = path.resolve(REPO_ROOT, 'node_modules/.pnpm');
  const axeDir = fs
    .readdirSync(pnpmRoot)
    .find((entry) => entry.startsWith('axe-core@'));
  if (!axeDir) throw new Error('axe-core not found in node_modules/.pnpm');
  return fs.readFileSync(
    path.join(pnpmRoot, axeDir, 'node_modules/axe-core/axe.min.js'),
    'utf8'
  );
}

async function waitForHttp(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(String(evt.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        for (const fn of this.listeners.get(msg.method)) fn(msg.params);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeoutMs = 15_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`CDP timeout waiting for ${method}`)), timeoutMs);
      const list = this.listeners.get(method) || [];
      const handler = (params) => {
        clearTimeout(timer);
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((f) => f !== handler)
        );
        resolve(params);
      };
      list.push(handler);
      this.listeners.set(method, list);
    });
  }

  async eval(expression, awaitPromise = true) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'JS eval failed');
    }
    return res.result?.value;
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
  }
}

async function main() {
  const axeSource = findAxeSource();
  const shouldStartServer = process.argv.includes('--start-server');
  let nextServer = null;

  if (shouldStartServer) {
    const port = new URL(BASE_URL).port || '3019';
    const webDir = path.join(REPO_ROOT, 'apps/web');
    const nextBin = path.join(webDir, 'node_modules/.bin/next');
    nextServer = spawn(nextBin, ['start', '-H', '127.0.0.1', '-p', port], {
      cwd: webDir,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    nextServer.stderr?.on('data', (chunk) => {
      process.stderr.write(`[next start] ${chunk}`);
    });
    await waitForHttp(`${BASE_URL}/`, 30_000);
  }

  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const accessibilityResults = [];
    const performanceResults = [];
    const responsiveResults = [];

    // 1. Accessibility + Performance across all audited routes at 1440px (Light)
    for (const route of AUDIT_ROUTES) {
      const loadPromise = cdp.once('Page.loadEventFired');
      const navStart = Date.now();
      await cdp.send('Page.navigate', { url: `${BASE_URL}${route}` });
      await loadPromise;
      await new Promise((r) => setTimeout(r, 500));
      // Scroll through page so below-the-fold loading="lazy" images enter viewport and finish decoding
      await cdp.eval(`(async () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        for (const img of imgs) {
          img.scrollIntoView({ behavior: 'instant', block: 'center' });
          await new Promise((r) => setTimeout(r, 80));
        }
        await Promise.all(
          imgs.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise((resolve) => {
                  const timer = setTimeout(resolve, 2500);
                  img.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
                  img.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
                })
          )
        );
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 200));
      })()`);
      const wallMs = Date.now() - navStart;

      const perf = await cdp.eval(`(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paints = performance.getEntriesByType('paint');
        const fcp = paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null;
        const resources = performance.getEntriesByType('resource');
        const totalTransferBytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const imgs = Array.from(document.querySelectorAll('img'));
        const brokenImages = imgs
          .filter((img) => !img.complete || img.naturalWidth === 0)
          .map((img) => img.getAttribute('src') || 'unknown');
        return {
          ttfbMs: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
          fcpMs: fcp !== null ? Math.round(fcp) : null,
          resourceCount: resources.length,
          transferKB: Math.round(totalTransferBytes / 1024),
          imageCount: imgs.length,
          brokenImages,
          hasMainLandmark: Boolean(document.querySelector('main')),
          h1Count: document.querySelectorAll('h1').length,
          title: document.title,
        };
      })()`);

      performanceResults.push({ route, wallMs, ...perf });

      await cdp.eval(axeSource, false);
      const axeReport = await cdp.eval(`(async () => {
        const res = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
        });
        return {
          passes: res.passes.length,
          incomplete: res.incomplete.length,
          violations: res.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
            sampleTarget: v.nodes[0]?.target?.join(' ') || '',
          })),
        };
      })()`);

      accessibilityResults.push({ route, ...axeReport });
    }

    // 2. Responsive 8-Viewport x 2-Theme Matrix across key layouts
    const responsiveRoutes = ['/', '/login', '/register', '/patient/dashboard', '/admin/audit-logs'];
    for (const route of responsiveRoutes) {
      for (const width of VIEWPORTS) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width,
          height: 844,
          deviceScaleFactor: 1,
          mobile: width < 768,
        });
        const loadPromise = cdp.once('Page.loadEventFired');
        await cdp.send('Page.navigate', { url: `${BASE_URL}${route}` });
        await loadPromise;
        await new Promise((r) => setTimeout(r, 300));

        for (const theme of ['light', 'dark']) {
          const check = await cdp.eval(`(() => {
            document.documentElement.classList.toggle('dark', ${JSON.stringify(theme === 'dark')});
            const overflowPx = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
            return {
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth: window.innerWidth,
              overflowPx,
            };
          })()`);
          responsiveResults.push({ route, width, theme, ...check });
        }
      }
    }

    cdp.close();

    const summary = {
      auditedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      routesAudited: AUDIT_ROUTES.length,
      responsiveChecksTotal: responsiveResults.length,
      responsiveOverflowFailures: responsiveResults.filter((r) => r.overflowPx > 2),
      accessibilityViolationsTotal: accessibilityResults.reduce(
        (sum, r) => sum + r.violations.length,
        0
      ),
      accessibilityResults,
      performanceResults,
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    chrome.kill('SIGTERM');
    if (nextServer) {
      nextServer.kill('SIGTERM');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

# HealthBridge India — Developer Onboarding & Operational Setup Guide

> **Platform:** HealthBridge India — One Nation One Health Record  
> **Target Audience:** Full-Stack Engineers, DevOps Engineers, QA Engineers  
> **Prerequisites:** Git, Node.js (>=20.x), pnpm (>=9.x), MongoDB (Local or Atlas)

---

## 1. System Requirements

Ensure the following runtimes and utilities are installed on your workstation:

| Tool        | Minimum Version | Verified Runtime | Installation Command                                             |
| :---------- | :-------------- | :--------------- | :--------------------------------------------------------------- |
| **Node.js** | `>= 20.0.0`     | `v26.13.0`       | [nodejs.org](https://nodejs.org/) or `nvm install 20`            |
| **pnpm**    | `>= 9.0.0`      | `v9.15.5`        | `npm install -g pnpm`                                            |
| **Git**     | `>= 2.30.0`     | `v2.56.0`        | macOS: `brew install git`                                        |
| **MongoDB** | `>= 6.0`        | Atlas / Local    | macOS: `brew tap mongodb/brew && brew install mongodb-community` |

---

## 2. Monorepo Installation & Bootstrapping

### Step 1: Clone the Repository

```bash
git clone <repository-url> healthbridge-india
cd healthbridge-india
```

### Step 2: Install Workspace Dependencies

Execute the install command from the monorepo root:

```bash
pnpm install
```

_Note: pnpm uses content-addressable storage, symlinking shared packages (`packages/shared-types`, `packages/validation`, `packages/config`) into `apps/web` and `apps/api`._

---

## 3. Environment Variable Configuration

The platform uses Zod-validated environment configurations. Follow the steps below to initialize configuration files.

### 3.1 Backend Configuration (`apps/api/.env`)

Copy the template into `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
```

Review the values in `apps/api/.env`:

```ini
# Application Mode
NODE_ENV=development
PORT=5001

# MongoDB Connection (Local or Atlas URI)
MONGODB_URI=mongodb://127.0.0.1:27017/healthbridge_dev

# CORS Settings (Frontend Web URL)
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Cryptographic Keys (Min 32 characters in production)
JWT_ACCESS_SECRET=hb_dev_access_token_secret_key_change_in_production_32chars
JWT_REFRESH_SECRET=hb_dev_refresh_token_secret_key_change_in_production_32chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=hb_dev_cookie_signing_secret_key_min_16chars

# Administrative Registration Key (Required for ADMIN role registration)
ADMIN_REGISTRATION_KEY=hb_dev_admin_registration_secret_key_2026
```

### 3.2 Frontend Configuration (`apps/web/.env.local`)

Copy the template into `apps/web/.env.local`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Review the values in `apps/web/.env.local`:

```ini
NEXT_PUBLIC_APP_NAME="HealthBridge India"
NEXT_PUBLIC_API_URL="http://localhost:5001/api/v1"
```

---

## 4. Root Development & Operational Commands

All daily developer commands can be run directly from the root of the repository:

| Command                   | Action                                                           | Scope           |
| :------------------------ | :--------------------------------------------------------------- | :-------------- |
| `pnpm dev`                | Starts frontend (port 3000) and backend (port 5001) concurrently | Entire Monorepo |
| `pnpm dev:web`            | Starts Next.js frontend development server                       | `apps/web`      |
| `pnpm dev:api`            | Starts Express API backend server with `tsx watch`               | `apps/api`      |
| `pnpm build`              | Compiles production builds for both web and api                  | Entire Monorepo |
| `pnpm typecheck`          | Validates TypeScript types across all 5 workspace projects       | Entire Monorepo |
| `pnpm lint`               | Runs ESLint and checks code formatting                           | Entire Monorepo |
| `pnpm test`               | Runs Vitest unit and integration test suite                      | `apps/api`      |
| `pnpm test:unit`          | Runs Vitest unit tests (30 tests)                                | `apps/api`      |
| `pnpm test:integration`   | Runs Vitest integration tests with Supertest (13 tests)          | `apps/api`      |
| `pnpm test:auth`          | Runs 16-point Authentication & RBAC security test suite          | `apps/api`      |
| `pnpm test:db`            | Runs 17-point Database & Mongoose schema test suite              | `apps/api`      |
| `pnpm verify:integration` | Runs full frontend-backend integration verification script       | Entire Monorepo |
| `pnpm seed`               | Seeds database with demo healthcare accounts and facilities      | `apps/api`      |
| `pnpm clean`              | Cleans `.next`, `dist`, and cached build artifacts               | Entire Monorepo |

---

## 5. Development Verification & Health Checks

Once both services are running:

1. **Verify Backend Health Endpoint:**

   ```bash
   curl -i http://localhost:5001/api/v1/health
   ```

   Expected response: HTTP 200 with JSON payload `{ "success": true, "data": { "application": "HealthBridge India", "status": "healthy" } }`.

2. **Verify Frontend UI:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.
   - The **System Status** bar at the top will indicate "Operational" with green indicator.
   - Click "Sign In" or "Register" to test interactive authentication workflows.

3. **Verify API Documentation:**
   Open [http://localhost:5001/api/v1/docs](http://localhost:5001/api/v1/docs) or [http://localhost:5001/api/v1/docs/openapi.json](http://localhost:5001/api/v1/docs/openapi.json).

---

## 6. Troubleshooting & Common Issues

### Issue 1: `connect EPERM 127.0.0.1:27017`

- **Cause:** Local MongoDB service is not started on your machine.
- **Fix:** Start MongoDB locally (`brew services start mongodb-community`) or set a cloud MongoDB Atlas URI in `apps/api/.env` (`MONGODB_URI=mongodb+srv://...`). Note: Offline tests pass schema verification even if MongoDB is in standby.

### Issue 2: `Port 5001 or 3000 already in use`

- **Cause:** A previous Node.js server instance is still bound to the port.
- **Fix:** Terminate stale processes:
  ```bash
  lsof -ti :5001 | xargs kill -9
  lsof -ti :3000 | xargs kill -9
  ```

### Issue 3: CORS Rejection in Browser (`Origin not allowed`)

- **Cause:** `CORS_ORIGIN` in `apps/api/.env` does not match the frontend origin.
- **Fix:** Verify `CORS_ORIGIN=http://localhost:3000` is present in `apps/api/.env`.

### Issue 4: Next.js PostCSS Worker IPC Error (`ERR_STREAM_DESTROYED`)

- **Cause:** Experimental Node.js versions on macOS paths containing spaces with Turbopack.
- **Fix:** Standard `next dev` runs smoothly. If encountering worker issues, run `pnpm --filter @healthbridge/web dev`.

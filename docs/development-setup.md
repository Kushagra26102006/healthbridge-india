# HealthBridge India — Developer Onboarding & Setup Guide

> **Target Audience:** Full-Stack Engineers, DevOps Engineers, QA Engineers  
> **Prerequisites:** Git, Node.js (>=20.x), pnpm (>=9.x), MongoDB (Local or Atlas)  

---

## 1. System Requirements

Ensure the following runtimes and utilities are installed on your workstation:

| Tool | Minimum Version | Verified Version | Installation Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `v26.13.0` | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| **pnpm** | `>= 9.0.0` | `v9.15.5` | `npm install -g pnpm` |
| **Git** | `>= 2.30.0` | `v2.56.0` | macOS: `brew install git` |
| **MongoDB** | `>= 6.0` | Atlas / Local | macOS: `brew tap mongodb/brew && brew install mongodb-community` |

---

## 2. Initial Monorepo Setup

### Step 1: Clone and Enter the Repository
```bash
git clone <repository-url> healthbridge-india
cd healthbridge-india
```

### Step 2: Install Workspace Dependencies
Execute the install command from the monorepo root:
```bash
pnpm install
```
*Note: pnpm uses content-addressable storage, symlinking shared packages across `apps/` and `packages/`.*

---

## 3. Environment Configuration

The repository uses environment-driven configuration validated via Zod schemas.

### Backend Environment Configuration
Copy the template into `apps/api/.env`:
```bash
cp apps/api/.env.example apps/api/.env
```

Review and adjust the default values in `apps/api/.env`:
```ini
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/healthbridge_dev
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=hb_dev_access_token_secret_key_change_in_production_32chars
JWT_REFRESH_SECRET=hb_dev_refresh_token_secret_key_change_in_production_32chars
COOKIE_SECRET=hb_dev_cookie_signing_secret_key_min_16chars
```

### Frontend Environment Configuration
Copy the template into `apps/web/.env.local`:
```bash
cp apps/web/.env.example apps/web/.env.local
```

Default content:
```ini
NEXT_PUBLIC_APP_NAME="HealthBridge India"
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

---

## 4. Development Workflow & Commands

### Running Services Concurrently
To boot both Next.js frontend and Express backend concurrently:
```bash
pnpm dev
```

### Running Services Independently
In dedicated terminal sessions:

```bash
# Terminal 1 — Start Express API Gateway (Live reload with tsx)
pnpm dev:api

# Terminal 2 — Start Next.js Frontend with Turbopack
pnpm dev:web
```

---

## 5. Verification & Testing

### 1. Verify Backend Health Endpoint
Run in your terminal:
```bash
curl -i http://localhost:5001/api/v1/health
```

Expected HTTP status: `200 OK`
Expected payload structure:
```json
{
  "success": true,
  "message": "HealthBridge India API is operational",
  "data": {
    "application": "HealthBridge India",
    "environment": "development",
    "status": "healthy",
    "timestamp": "2026-11-13T06:50:00.000Z",
    "uptime": 12,
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "connected",
        "latencyMs": 4
      }
    }
  },
  "timestamp": "2026-11-13T06:50:00.000Z"
}
```

### 2. Verify Frontend Interface
Open your browser at [http://localhost:3000](http://localhost:3000).  
The foundation page displays live system telemetry, API connectivity, and architectural components.

### 3. Run Static Analysis & Type Checking
```bash
# Type check all apps and packages
pnpm type-check

# Run ESLint across workspace
pnpm lint
```

---

## 6. Common Pitfalls & Troubleshooting

### Issue 1: Port 5001 or 3000 already occupied
**Resolution:** Locate and stop the conflicting process or change the port in `.env`:
```bash
# Check port 5001
lsof -i :5001
# Kill PID if needed
kill -9 <PID>
```

### Issue 2: MongoDB Connection Error
**Symptoms:** Logs report `Failed to connect to MongoDB Atlas during initialization`.  
**Resolution:**
- If using local MongoDB, ensure service is running: `brew services start mongodb/brew/mongodb-community`.
- If using MongoDB Atlas, check that your workstation's IP is added to the Atlas Network Access whitelist (`0.0.0.0/0` for dev).
- Note: The API server will still boot in degraded mode to allow local frontend UI development even if the database is offline.

### Issue 3: pnpm Workspace Dependency Issues
**Resolution:** Clear workspace caches and reinstall:
```bash
pnpm clean
pnpm install
```

---

## 7. Git & Commit Guidelines

1. Never commit `.env` or `.env.local` files containing sensitive credentials.
2. Commit messages must follow conventional commits:
   - `feat(api): add patient registration endpoint`
   - `fix(web): correct health check interval`
   - `chore(deps): update mongoose to latest stable`
3. Always verify `pnpm type-check` and `pnpm lint` pass before opening a Pull Request.


# HealthBridge India

> **One Nation One Health Record — ABHA Integrated Unified Healthcare Platform**

HealthBridge India is an enterprise-grade, ABDM-compliant (Ayushman Bharat Digital Mission) digital healthcare platform designed to bridge patients, medical practitioners, hospitals, and diagnostic centres across India into a unified, consent-driven electronic health records (EHR) ecosystem.

---

## 🏛️ System Architecture

This project is structured as a high-performance **pnpm Monorepo** engineered for strict separation of concerns, maximum code reusability, end-to-end type safety, and zero deployment friction.

```
healthbridge-india/
├── apps/
│   ├── web/                    # Next.js 14 App Router Frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router pages and layout
│   │   │   ├── components/ui/  # shadcn/ui design system primitives
│   │   │   ├── lib/            # Axios API client & utils
│   │   │   ├── providers/      # TanStack Query & Redux Toolkit providers
│   │   │   └── store/          # Global state management
│   │   └── package.json
│   │
│   └── api/                    # Express.js + TypeScript REST API Gateway
│       ├── src/
│       │   ├── app.ts          # Express application initialization & middleware
│       │   ├── server.ts       # Server bootstrap & graceful shutdown hooks
│       │   ├── config/         # MongoDB Atlas connection & Zod env validation
│       │   ├── middleware/     # Error handler, 404, request logger
│       │   ├── modules/        # Modular domain services (Health, Auth, EHR)
│       │   ├── shared/         # Custom AppError & HTTP status constants
│       │   └── utils/          # Standardized API response wrappers & logging
│       └── package.json
│
├── packages/
│   ├── shared-types/           # Common TypeScript types (ABHA, User, API contracts)
│   ├── validation/             # Shared Zod validation schemas (Auth, ABHA, Env)
│   └── config/                 # Platform constants & configurations
│
├── docs/
│   ├── architecture.md         # Monorepo, ABDM/ABHA & system architecture
│   └── development-setup.md    # Developer onboarding & operational guide
│
├── .env.example                # Root environment variable template
├── pnpm-workspace.yaml         # Monorepo workspace definition
└── tsconfig.base.json          # Strict baseline TypeScript configuration
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo Engine** | [pnpm Workspaces](https://pnpm.io/workspaces) (v9.15+) |
| **Frontend App** | [Next.js 14](https://nextjs.org/) (App Router, Turbopack), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Client State & Cache**| [Redux Toolkit](https://redux-toolkit.js.org/), [TanStack React Query v5](https://tanstack.com/query) |
| **Backend API** | [Express.js](https://expressjs.com/), [Node.js](https://nodejs.org/) (v20+ / v26+), [tsx](https://github.com/privatenumber/tsx) |
| **Database & ODM** | [MongoDB Atlas](https://www.mongodb.com/atlas) / Local MongoDB, [Mongoose v8](https://mongoosejs.com/) |
| **Security & Utilities**| [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [Zod](https://zod.dev/), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [cookie-parser](https://github.com/expressjs/cookie-parser) |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: `v20.x` or higher (verified on `v26.13.0`)
- **pnpm**: `v9.x` (`npm install -g pnpm`)
- **Git**
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas cluster

### 2. Installation
Clone the repository and install all workspace dependencies from the root:

```bash
git clone <repository-url>
cd healthbridge-india
pnpm install
```

### 3. Environment Setup
Generate local environment files:

```bash
# Setup Backend environment
cp apps/api/.env.example apps/api/.env

# Setup Frontend environment
cp apps/web/.env.example apps/web/.env.local
```

### 4. Running the Development Servers

To run both Frontend and Backend concurrently:
```bash
pnpm dev
```

Or run services independently in separate terminal tabs:
```bash
# Terminal 1: Run Express Backend API (Port 5001)
pnpm dev:api

# Terminal 2: Run Next.js Frontend with Turbopack (Port 3000)
pnpm dev:web
```

### 5. Accessing the Platform
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Root**: [http://localhost:5001](http://localhost:5001)
- **Health Check Endpoint**: [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)

---

## 🩺 Health Check Verification

The API provides a standardized health check endpoint at `GET /api/v1/health`:

```bash
curl http://localhost:5001/api/v1/health
```

Example JSON response:
```json
{
  "success": true,
  "message": "HealthBridge India API is operational",
  "data": {
    "application": "HealthBridge India",
    "environment": "development",
    "status": "healthy",
    "timestamp": "2026-11-13T06:45:00.000Z",
    "uptime": 42,
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "connected",
        "latencyMs": 3
      }
    }
  },
  "timestamp": "2026-11-13T06:45:00.000Z"
}
```

---

## 📜 Monorepo Scripts Reference

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts all applications in parallel |
| `pnpm dev:web` | Starts Next.js frontend with Turbopack on port 3000 |
| `pnpm dev:api` | Starts Express backend in live-reload mode on port 5001 |
| `pnpm build` | Compiles packages and builds production bundles |
| `pnpm type-check` | Runs strict TypeScript verification across all apps & packages |
| `pnpm lint` | Executes ESLint across all projects |
| `pnpm clean` | Purges `node_modules`, `.next`, and build artifacts |

---

## 🛡️ Security & Healthcare Compliance

HealthBridge India is architected from day one in compliance with:
- **DISHA** (Digital Information Security in Healthcare Act)
- **ABDM Standards** (Ayushman Bharat Digital Mission Milestone 1-3)
- **FHIR R4** (Fast Healthcare Interoperability Resources)
- Strict cryptographic token issuance, secure HTTP-only cookies, and sanitized CORS origins.

For more technical details, consult [docs/architecture.md](file:///Users/kushagrayadav/Desktop/untitled%20folder%206/healthbridge-india/docs/architecture.md) and [docs/development-setup.md](file:///Users/kushagrayadav/Desktop/untitled%20folder%206/healthbridge-india/docs/development-setup.md).


# HealthBridge India

> **One Nation One Health Record — ABHA Integrated Unified Healthcare Platform**

HealthBridge India is an enterprise-grade, ABDM-compliant (Ayushman Bharat Digital Mission) digital healthcare platform designed to bridge patients, medical practitioners, hospitals, and diagnostic centres across India into a unified, consent-driven electronic health records (EHR) ecosystem.

---

## 🏛️ System Architecture

This project is structured as a high-performance **pnpm Monorepo** engineered for strict separation of concerns, maximum code reusability, end-to-end type safety, and zero deployment friction.

```
healthbridge-india/
├── apps/
│   ├── web/                    # Next.js 14 App Router Frontend (React, Tailwind, Redux, TanStack Query)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages and layout
│   │   │   ├── components/ui/  # shadcn/ui design system primitives
│   │   │   ├── features/auth/  # Authentication views, forms, and RBAC protected route guard
│   │   │   ├── features/system/# System health status hook & telemetry
│   │   │   ├── lib/api/        # Typed Axios API client, endpoints, error normalizer & mutex
│   │   │   ├── providers/      # QueryProvider, ReduxProvider, AppProviders
│   │   │   └── store/          # Redux Toolkit slices (auth, system)
│   │   └── package.json
│   │
│   └── api/                    # Express.js + TypeScript REST API Service
│       ├── src/
│       │   ├── app.ts          # Express application initialization & middleware stack
│       │   ├── server.ts       # Server bootstrap & graceful shutdown hooks
│       │   ├── config/         # MongoDB Atlas connection, Pino logger & Zod env validation
│       │   ├── middleware/     # Auth, RBAC, Rate-limit, Request ID, Zod validate, Error handler
│       │   ├── modules/        # Modular domains (auth, health, docs, users, patients, doctors, etc.)
│       │   ├── routes/         # Centralized /api/v1 router
│       │   ├── shared/         # AppError class, ErrorCode catalog, HTTP status constants
│       │   └── utils/          # Standardized API response wrappers, pagination, sanitization
│       ├── tests/              # Vitest unit & integration test suites
│       └── package.json
│
├── packages/
│   ├── shared-types/           # Common TypeScript contracts (roles, api, user, auth, healthcare, appointment, consent)
│   ├── validation/             # Shared Zod validation schemas (auth, user, profile, appointment, pagination, env)
│   └── config/                 # Platform constants, route registry, env defaults, and base TSConfig
│
├── docs/
│   ├── architecture.md         # Monorepo architecture & communication topology
│   ├── development-setup.md    # Developer onboarding, commands, & operational guide
│   ├── database.md             # Complete database schema, Mongoose models, & ERD
│   ├── authentication.md       # IAM, JWT access tokens, token rotation sequence, & RBAC
│   ├── security.md             # STRIDE threat model, redaction rules, & defense-in-depth
│   └── api-specification.md    # API specification, standard envelopes, & OpenAPI 3.1.0 documentation
│
├── scripts/
│   └── verify-integration.ts   # Automated monorepo integration verification runner
├── .env.example                # Root environment variable template
├── pnpm-workspace.yaml         # Monorepo workspace definition
└── tsconfig.base.json          # Strict baseline TypeScript configuration
```

---

## 🛠️ Technology Stack

| Layer                    | Technologies                                                                                                                                                                                                                                                |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo Engine**      | [pnpm Workspaces](https://pnpm.io/workspaces) (v9.15+)                                                                                                                                                                                                      |
| **Frontend App**         | [Next.js 14](https://nextjs.org/) (App Router, Turbopack), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)                                                                                                                    |
| **Styling & UI**         | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)                                                                                         |
| **Client State & Cache** | [Redux Toolkit](https://redux-toolkit.js.org/), [TanStack React Query v5](https://tanstack.com/query)                                                                                                                                                       |
| **Frontend API Client**  | [Axios](https://axios-http.com/) (Typed client, HttpOnly cookies, request ID tracing, refresh mutex)                                                                                                                                                        |
| **Backend API**          | [Express.js](https://expressjs.com/), [Node.js](https://nodejs.org/), [tsx](https://github.com/privatenumber/tsx), [Pino](https://getpino.io/)                                                                                                              |
| **Database & ODM**       | [MongoDB Atlas](https://www.mongodb.com/atlas), [Mongoose 8](https://mongoosejs.com/)                                                                                                                                                                       |
| **Validation Layer**     | [Zod 3](https://zod.dev/) (Strict schemas across frontend, backend, and environment)                                                                                                                                                                        |
| **Testing Engine**       | [Vitest](https://vitest.dev/), [Supertest](https://github.com/ladjs/supertest)                                                                                                                                                                              |
| **Security & Auth**      | [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [cookie-parser](https://github.com/expressjs/cookie-parser) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites

Ensure Node.js (`>= 20.x`) and pnpm (`>= 9.x`) are installed.

### 2. Install Workspace Dependencies

```bash
git clone <repository-url> healthbridge-india
cd healthbridge-india
pnpm install
```

### 3. Setup Environment Configurations

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Run Both Applications (Concurrently)

```bash
pnpm dev
```

- **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:5001/api/v1](http://localhost:5001/api/v1)
- **Health Check**: [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)
- **API Documentation**: [http://localhost:5001/api/v1/docs](http://localhost:5001/api/v1/docs)

---

## 📋 Root Development & Quality Commands

```bash
# Development servers
pnpm dev                     # Starts both web (3000) and api (5001) in parallel
pnpm dev:web                 # Starts Next.js web application
pnpm dev:api                 # Starts Express API server with hot-reload

# Quality & Type Safety
pnpm typecheck               # Strict TypeScript checks across all 5 workspace projects
pnpm lint                    # ESLint verification across frontend and backend
pnpm build                   # Compiles production builds for @healthbridge/web and @healthbridge/api

# Test Suites
pnpm test                    # Runs Vitest test suite (43 unit & integration tests)
pnpm test:unit               # Runs isolated unit tests (30 tests)
pnpm test:auth               # Runs 16-point Authentication & RBAC test suite
pnpm test:db                 # Runs 17-point Database & Mongoose schema test suite
pnpm verify:integration      # Runs end-to-end frontend-backend monorepo verification
```

---

## 🛡️ Security & National Health Standards

1. **DISHA & ABDM Compliance:** Patient consent records govern electronic health data sharing. All PHI/PII data transfers strictly follow consent-artifact validation.
2. **HttpOnly Cookie Authentication:** Access (`15m`) and Refresh (`7d`) tokens are exchanged via secure, HttpOnly, SameSite cookies. Zero access tokens reside in `localStorage`.
3. **Cryptographic Tracing (`X-Request-Id`):** Automatically injected on all requests and correlated across logs, responses, and error traces.
4. **Structured Logging & Redaction:** Pino logger automatically redacts passwords, tokens, cookies, OTPs, and ABHA numbers from all logs.
5. **Rate Limiting:** Distinct sliding-window limits protect authentication, public discovery, and healthcare APIs from denial-of-service without interrupting hospital operations.

---

## 📚 Technical Documentation Index

- [Architecture Specification](docs/architecture.md) — System topology, communication layer, and state management.
- [Developer Setup Guide](docs/development-setup.md) — Workstation onboarding, port mapping, and troubleshooting.
- [Database Architecture](docs/database.md) — MongoDB collections, Mongoose schemas, and ERD.
- [Authentication & IAM](docs/authentication.md) — Token rotation, recovery workflows, and RBAC policies.
- [Security Architecture](docs/security.md) — STRIDE threat model, redaction rules, and defense controls.
- [API Specification](docs/api-specification.md) — Envelopes, error codes, and OpenAPI 3.1.0 specification.

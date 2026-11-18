# HealthBridge India — Production Architecture

## 1. Architecture Overview (Aligned With Existing Stack)

The production architecture preserves the exact existing pnpm monorepo stack (**Next.js 14** + **Express 4** + **MongoDB/Mongoose** + **SSE** + **Durable MongoDB Outbox Worker**) without introducing unnecessary middleware or rewriting working services.

```mermaid
flowchart TB
    User["Citizens, Doctors, Pharmacies, Labs, Admins (HTTPS / TLS 1.3)"]
    Edge["CDN / WAF / TLS Termination (Cloudflare or Cloud ALB)"]

    subgraph Compute["Managed Container / App Tier (India Region: ap-south-1)"]
        Web["@healthbridge/web (Next.js 14, 2+ Replicas, Non-Root Node 20)"]
        Api["@healthbridge/api (Express 4, 2+ Replicas, ENABLE_BACKGROUND_WORKER=false)"]
        Worker["@healthbridge/api Outbox Worker (1 Singleton Replica, ENABLE_BACKGROUND_WORKER=true)"]
    end

    subgraph Data["Managed Data & Private Storage Tier (India Data Residency)"]
        Mongo["MongoDB Atlas Replica Set (M10+, TLS Enforced, PITR Backups, Auto-Encryption)"]
        ObjStore["Private Object Storage Bucket (S3/GCS ap-south-1, KMS Encrypted, Block Public Access)"]
        AV["Malware Scanner Boundary (ClamAV / Cloud AV Service)"]
    end

    subgraph External["External Integrations & Observability"]
        ABDM["NHA ABDM Gateway V3 (Disabled Until Official Onboarding & ABDM_ALLOW_PRODUCTION=true)"]
        Comms["Transactional Email / SMS Gateway (External Provider)"]
        Obs["Structured Pino Logs -> Log Aggregator + Uptime/Metrics + Error Tracking (Zero PHI)"]
    end

    User --> Edge
    Edge --> Web
    Edge --> Api
    Web --> Api
    Api --> Mongo
    Worker --> Mongo
    Api --> ObjStore
    Api -.-> AV
    Api -.-> ABDM
    Worker -.-> Comms
    Api --> Obs
    Worker --> Obs
    Web --> Obs
```

---

## 2. Hosting & Infrastructure Evaluation

| Component | Recommended Option (India Region `ap-south-1`) | Why Chosen Over Alternatives |
| --- | --- | --- |
| **Frontend (`@healthbridge/web`)** | Containerized Next.js (`apps/web/Dockerfile`) on AWS ECS Fargate / Cloud Run / Render, or Vercel Pro with India edge | Direct Docker compatibility (`apps/web/Dockerfile`), predictable pricing, custom CSP/security headers preserved in `next.config.mjs`. |
| **Backend (`@healthbridge/api`)** | Containerized Node 20 (`apps/api/Dockerfile`) behind HTTPS ALB (`TRUST_PROXY_HOPS=1`) | Native SSE (`/api/v1/notifications/stream`) requires long-lived HTTP connections; serverless functions break SSE streams. |
| **Background Outbox Worker** | Dedicated single container using the exact same `apps/api/Dockerfile` with `ENABLE_BACKGROUND_WORKER=true` | Prevents duplicate polling across horizontally scaled API replicas while reusing the existing durable MongoDB outbox without requiring Redis on Day 1. |
| **Database** | MongoDB Atlas M10+ Dedicated Replica Set (`ap-south-1` Mumbai) | Required for ACID multi-document transactions, automated Continuous Cloud Backup (PITR), India data residency, TLS 1.2+, and IP allowlisting / VPC peering. |
| **Redis (Future Scale Trigger)** | **Not required initially**; introduce managed Redis only when scaling API horizontally for shared distributed rate-limiting & cross-replica SSE fan-out | Avoids premature operational complexity while clearly identifying the scale threshold (>1 API replica serving concurrent SSE/rate-limit buckets). |
| **Medical Document Storage** | Private S3 / GCS bucket (`ap-south-1`, SSE-KMS, public access blocked) accessed strictly via backend signed-token endpoints | Current Base64 document storage works for low-volume MVP/testing; external encrypted object storage is required before high-volume clinical document traffic. |

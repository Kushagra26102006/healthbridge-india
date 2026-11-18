# HealthBridge India — Database Production Readiness

## 1. Connection Pooling, TLS & Runtime Safeguards (`apps/api/src/config/database.ts`)

- **TLS Enforcement:** When `NODE_ENV=production`, `connectDatabase()` rejects any URI containing `tls=false`, `ssl=false`, `tlsAllowInvalidCertificates=true`, or `tlsAllowInvalidHostnames=true`.
- **Credential Masking:** Startup connection logs always redact passwords (`//$1:****@`).
- **Connection Pool:** Configurable via `DB_MAX_POOL_SIZE` (default `20`, bounded `5–100`) and `DB_MIN_POOL_SIZE` (default `5`, bounded `1–20`), with `serverSelectionTimeoutMS: 5000`, `connectTimeoutMS: 10000`, `socketTimeoutMS: 45000`.
- **Automatic Index Builds Disabled in Production:** `mongoose.set('autoIndex', false)` is enforced when `NODE_ENV=production` to prevent startup collection locks.

---

## 2. Non-Destructive Migration & Index Synchronization Strategy

1. **Controlled Index Sync CLI (`apps/api/src/database/sync-indexes.ts`):**
   - Command: `pnpm --filter @healthbridge/api db:sync-indexes` (or root `pnpm db:sync-indexes`).
   - Run against staging first, take an on-demand Atlas snapshot before production execution, then run during a controlled maintenance window or pre-deployment job.
2. **Schema Evolution Rules:**
   - All Mongoose schema additions must be backward-compatible (optional fields or safe defaults) so rolling deployments can run `N` and `N+1` API replicas simultaneously.
   - Destructive field drops or renames require a two-release expand-and-contract migration.
3. **Production Seed Protection (`apps/api/src/database/seed.ts`):**
   - `seedDatabase()` throws `SECURITY_BLOCK` unconditionally when `NODE_ENV=production`, preventing accidental insertion of synthetic demo users (`DemoSecure#2026`) into production.
4. **Audit Log Append-Only Integrity (`apps/api/src/modules/security/models/audit-log.model.ts`):**
   - Mongoose pre-hooks reject `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, and `findOneAndDelete`; database user permissions in production should further restrict `auditlogs` to insert/find only (where collection-level RBAC is configured).

---

## 3. Capacity Planning & Scaling Guidance

- **Baseline Launch Tier:** MongoDB Atlas `M10` (3-node replica set, `ap-south-1` Mumbai, 2 GB RAM, 10–40 GB NVMe storage, Continuous PITR backups enabled).
- **Vertical Scale Trigger:** Upgrade to `M20` / `M30` when sustained wiredTiger cache utilization exceeds 75%, p95 query latency exceeds 100 ms, or active connections exceed 60% of cluster limit.
- **Document Storage Offload:** Before medical document volume exceeds 10,000 uploaded PDFs/images, migrate binary payloads from MongoDB documents to private KMS-encrypted S3/GCS storage (keeping only metadata, SHA-256 checksums, and object keys in `MedicalRecordModel`).

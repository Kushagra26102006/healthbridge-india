# HealthBridge India — Database Security Architecture (Day 9 Task 01)

**Database Engine:** MongoDB Atlas / Mongoose 8.8.1  
**Primary Connection Module:** `apps/api/src/config/database.ts`  
**Collections Audited:** 73 Mongoose model definitions across `apps/api/src/modules/`

---

## 1. Connection & Transport Security (`apps/api/src/config/database.ts`)

- **Environment-Based Credentials:** Connection string read exclusively from validated `env.MONGODB_URI`.
- **Credential Masking in Logs:** `connectDatabase()` masks `//user:password@` to `//user:****@` before logging connection status.
- **Production Index Safety:** `mongoose.set('autoIndex', false)` in `NODE_ENV === 'production'` to avoid runtime foreground index locks; explicit controlled synchronization via `syncDatabaseIndexes()`.
- **Bounded Connection Pool & Timeouts:** `maxPoolSize: 20`, `minPoolSize: 5`, `serverSelectionTimeoutMS: 5000`, `connectTimeoutMS: 10000`, `socketTimeoutMS: 45000`.
- **TLS & Network Restrictions (Atlas Deployment Requirement):** Production URIs must use `mongodb+srv://` (TLS enforced by default), dedicated least-privilege database user (`readWrite` scoped strictly to the target application database — never `atlasAdmin`), and private VPC peering / IP allow-listing.

---

## 2. Sensitive-Field Protection & Serialization Audit

| Model | Sensitive Fields | Protection Verified |
|---|---|---|
| `UserModel` (`user.model.ts`) | `passwordHash` | `select: false` + deleted in `toJSON` and `toObject` transforms. |
| `RefreshTokenModel` (`refresh-token.model.ts`) | `tokenHash` | Stored as SHA-256 hash (never raw token) + **Day 9 Fix:** deleted in `toJSON` and `toObject` transforms + automatic TTL cleanup index (`expiresAt`). |
| `VerificationTokenModel` (`verification-token.model.ts`) | `tokenHash` | Stored as hash + **Day 9 Fix:** deleted in `toJSON` and `toObject` transforms + automatic TTL cleanup index (`86400s` post-expiry). |
| `AuditLogModel` (`audit-log.model.ts`) | Append-only integrity & metadata | Blocks `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, plus **Day 9 Fix:** `deleteMany` and `findOneAndDelete`; schema validator blocks `password`, `token`, `secret` metadata keys. |
| ABDM / ABHA Models (`modules/abdm/`) | ABHA numbers, link tokens | Masked/encrypted at rest using `ABDM_IDENTIFIER_ENCRYPTION_KEY`; redacted in Pino logs. |

---

## 3. Safe Query Patterns & NoSQL Injection Prevention

- **Global Express Guard:** `nosqlSanitizerMiddleware` (`apps/api/src/security/input-security.middleware.ts`) rejects any `req.body`, `req.query`, or `req.params` containing `$`-prefixed operator keys or `__proto__`/`constructor`/`prototype` before Mongoose ever sees the request.
- **ReDoS-Safe Regex Queries:** Global search and notification search escape all regex metacharacters (`escapeRegexSpecialChars`) and bound query length (`<= 100 chars`).
- **Allowlisted Updates:** Zod validation + `pickAllowedFields(...)` prevents mass assignment on Mongoose update operations.

---

## 4. Backup & Restore Strategy (Staging / Production Operations)

- **Required Atlas Configuration:** Continuous cloud backups with Point-in-Time Recovery (PITR) enabled, encrypted snapshots (KMS/CMK), minimum 30-day retention, and quarterly documented restore drills into an isolated staging cluster verifying `AuditLog` and `OutboxEvent` consistency.
- **Honest Status:** Live MongoDB Atlas cluster backup/restore drills and IP allow-list enforcement have **not** been executed in this local/offline development environment and are tracked as pre-production deployment blockers.

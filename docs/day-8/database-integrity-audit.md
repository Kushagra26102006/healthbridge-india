# HealthBridge India — Database & Data Integrity Audit (Day 8 Task 06)

**Audit Date:** 2026-11-18  
**Database Engine:** MongoDB (Mongoose ODM)  
**Model Inventory:** 73 Mongoose model files across `apps/api/src/modules/`

---

## 1. Model Inventory by Domain

| Domain Directory | Model Count | Key Collections / Entities |
|---|---|---|
| `modules/abdm` | 15 | ABHA profiles, link tokens, care contexts, consent requests/artefacts, HIU requests, FHIR bundles, callback logs, audit records |
| `modules/laboratory` | 19 | Lab profiles, test catalog, lab orders, samples, barcodes, results, diagnostic reports, approval logs, QC runs, instruments, reagent lots, staff/shifts |
| `modules/pharmacy` | 11 | Pharmacy profiles, inventory batches, suppliers, purchase orders, pharmacy orders, prescriptions queue, dispensing records, returns, staff/roles |
| `modules/healthcare` | 9 | Appointments, clinical encounters, prescriptions, medical records, medication catalog, timeline references |
| `modules/users` | 6 | Base User, PatientProfile, DoctorProfile, PharmacyProfile, LaboratoryProfile, AdminProfile |
| `modules/events` | 4 | `DomainEventModel`, `OutboxEventModel`, `EventDeliveryLogModel`, `DeadLetterEventModel` |
| `modules/notifications` | 3 | `NotificationModel`, `NotificationPreferenceModel`, `NotificationDeliveryModel` |
| `modules/consent` | 2 | `ConsentRequestModel`, `ConsentArtifactModel` |
| `modules/security` | 2 | `AuditLogModel`, security session/revocation tracking |
| `modules/auth` | 1 | `RefreshTokenModel` |

**Result:** Zero duplicate Mongoose model names (`OverwriteModelError` prevented via consistent `models.X || model<IDoc>(...)` exports with explicit `: Model<IDoc>` annotations).

---

## 2. Referential & Cross-Module Identity Integrity

- **Canonical Patient Identity:** Every cross-module patient reference (`Appointment`, `Encounter`, `Prescription`, `LabOrder`, `LabReport`, `DispensingRecord`, `ConsentArtifact`, `AbhaIdentityMapping`) anchors to canonical `patientId` (`ObjectId` referencing `User` / `PatientProfile`), with ABHA number/address stored strictly in the identity-mapping layer and omitted from public DTOs and notifications.
- **No Unbounded Subdocument Growth:** High-volume logs (`AuditLog`, `DomainEvent`, `OutboxEvent`, `Notification`, `EventDeliveryLog`, `DispensingRecord`, `LabSampleEvent`) are stored in dedicated top-level collections rather than embedded arrays on `User` or `PatientProfile`.
- **Immutable Clinical / Dispensing Records:** Finalized lab reports, dispensing records, and audit logs use append-only patterns or versioned amendments rather than silent destructive overwrites.

---

## 3. Indexing & Query Boundedness Audit

- **Tenant-Scoped Compound Indexes:** Core operational collections define indexes on ownership keys (`userId`, `patientId`, `doctorId`, `pharmacyId`, `laboratoryId`) combined with `status` and `createdAt` (`-1`) to support dashboard lists, notification streams, and timeline pagination without full collection scans.
- **Event Outbox Indexes:** `OutboxEventModel` indexes `{ status: 1, nextRetryAt: 1 }` for worker polling and enforces unique `idempotencyKey` to prevent duplicate event delivery.
- **Global Search Boundedness:** `apps/api/src/modules/search/search.repository.ts` enforces strict `.limit(...)` caps per resource bucket, uses `escapeRegexSpecialChars` to eliminate ReDoS risk, prefers prefix regex (`^...`) where applicable, and applies `.select(...)` field projections + `.lean()` so password hashes, refresh tokens, and sensitive clinical blobs are never hydrated.
- **Pagination Safety:** All list endpoints (`notifications`, `search`, `events`, `orders`, `prescriptions`, `lab-orders`) validate `page` and bounded `limit` via `@healthbridge/validation` Zod schemas.

---

## 4. Transactional Outbox & Atlas Readiness Notes

- **Replica-Set Mode (`REPLICA_SET_TX`):** When connected to MongoDB Atlas (replica set), `EventPublisher` wraps domain mutations and outbox insertion inside a MongoDB multi-document session transaction.
- **Standalone / Test Fallback (`COMPENSATED_FALLBACK`):** On standalone MongoDB instances without replica-set support, the publisher falls back cleanly and records the mode transparently. In unit tests without an active database socket (`mongoose.connection.readyState !== 1`), `publishSafe` safely avoids Mongoose command-buffering timeouts.
- **Unverified in Live Environment:** Live MongoDB Atlas M10+ replica-set failover and `explain("executionStats")` index-plan benchmarking on production-scale datasets remain pending staging deployment.

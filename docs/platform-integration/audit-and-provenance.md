# Central Audit Trail & Clinical Data Provenance (Day 8 Task 01)

## 1. Unified Audit Metadata
All cross-module platform actions (`PlatformEventService`, `DoctorWorkspaceService`, `DoctorLabOrderService`, `DoctorEncounterService`, `AbdmHipService`, `AbdmHiuService`) record structured `AuditLogModel` events with `actorId`, `actorRole`, `action`, `resourceType`, `resourceId`, `requestId` (correlation ID), `timestamp`, `outcome`, and `metadata` (`sourceModule`, `stateTransition`, `referenceNumber`) — never storing plaintext clinical payloads or secrets.

## 2. Provenance Preservation Across Boundaries
- **Internal HealthBridge Records:** Preserves issuing doctor, facility, pharmacy dispenser, laboratory report version (`currentVersion`), amendment status (`isAmended`), and immutable `DispensingRecord` / `LabReportVersion` histories.
- **External ABDM Records (`AbdmImportedRecordModel`):** Tagged explicitly with `provenance.origin = 'ABDM_EXTERNAL_IMPORT'`, `sourceParticipantId`, `sourceOrganizationName`, `externalConsentId`, `bundleSha256`, `isMocked`, `isAmended`, and `readOnly: true`.
- **Strict Separation:** Internal records, external imported records, ABDM sandbox records, and mocked development records are visibly distinguished across backend DTOs and frontend badges.

# Laboratory End-to-End Synthetic Workflow — HealthBridge India (Day 6)

## 1. Purpose
This document describes the complete 29-step synthetic diagnostic laboratory workflow verified end-to-end by automated integration tests (`apps/api/tests/integration/laboratory-e2e-workflow-and-failures.test.ts`). All test records use strictly synthetic identifiers (`SYNTH-LAB`, `Synthetic Patient Alpha`, `Dr. Synthetic Clinician`).

---

## 2. Verified End-to-End Workflow Sequence

```
[1–5] Setup & Workforce          [6–10] Analytical Readiness       [11–16] Pre-Analytical
  Lab Account & Profile  ─────►    Register Analyzer (SYNTH-HEM)    Receive Synthetic Order
  Create Department                Create Test Catalogue (CBC)      Accept & Assign Tests
  Invite Tech & Pathologist        Configure QC Profile (L1)        Collect Specimen & Barcode
  Accept Single-Use Tokens         Register Reagent & Lot           Scan Barcode & Accession
  Configure Permissions            Pass QC Run (PASSED)                     │
                                                                            ▼
[25–29] Delivery & Audit         [20–24] Authorization & Release   [17–19] Analytical Phase
  Patient Views Report & PDF ◄──   QC Release Gate Check (PASS) ◄── Validate Reagent Lot
  Doctor Views Report & FHIR       Submit Draft for Review          Consume Stock Atomically
  Privacy-Safe Notifications       SoD Blocks Tech Self-Approval    Tech Enters CBC Results
  Immutable Audit Trail            Pathologist Approves & Publishes Compile Report Draft
```

### Step-by-Step Verification Trace
1. **Laboratory Profile (`PATCH /api/v1/laboratory/profile`):** Configured synthetic facility details while enforcing the zero self-approval guard on verification status.
2. **Department Setup (`POST /api/v1/laboratory/departments`):** Created `Synthetic Hematology` (`SYNHEM`) scoped to Laboratory A.
3. **Staff Invitations & Onboarding (`POST /staff/invite`, `POST /staff/accept-invite`):** Invited `Synthetic Tech One` (`LAB_TECHNICIAN`) and `Dr. Synthetic Pathologist` (`LAB_PATHOLOGIST`). Single-use SHA-256 hashed tokens were accepted and cleared upon activation.
4. **Granular Permission Overrides (`PUT /staff/:id/permissions`):** Granted `lab.inventory.consume` to the bench technician with an audited reason.
5. **Instrument Registration (`POST /quality/instruments`):** Registered `SYNTH-HEM-01` (`ANALYZER`, `ACTIVE`) mapped to `CBC`.
6. **Diagnostic Test Configuration (`POST /tests`):** Registered `CBC` with `HEMATOLOGY`, `BLOOD` specimen, price, and turnaround time.
7. **QC Profile Configuration (`POST /quality/profiles`):** Created quantitative (`NUMERIC`) Hemoglobin Control `LEVEL_1` (`13.2–14.8 g/dL`).
8. **Reagent & Lot Registration (`POST /inventory/reagents`, `POST /inventory/reagents/lots`):** Registered `SYNTH-DIL-01` and `LOT-SYNTH-2026A` (500 mL initial receipt, expiry 2028-12-31) with an initial `RECEIPT` ledger entry.
9. **Passing QC Run (`POST /quality/runs`):** Executed control run (`14.1 g/dL`), evaluated automatically as `PASSED`.
10. **Order Acceptance (`POST /orders/:id/accept`):** Accepted incoming synthetic order `LBO-SYNTH-2026-0001` (`ORDERED` → `ACCEPTED`).
11. **Sample Collection, Barcode & Scan (`POST /samples/collect`, `GET /samples/barcode/:barcode`):** Collected `BLOOD` specimen in EDTA tube, generated unique barcode, and verified barcode resolution.
12. **Sample Accessioning (`POST /samples/accession`):** Transitioned specimen to `ACCESSIONED`.
13. **Reagent Validation & Atomic Stock Consumption (`GET /lots/:id/validate`, `POST /transactions`):** Validated lot eligibility (`valid: true`) and atomically consumed 5 mL (`balanceAfter: 495`) with immutable ledger recording.
14. **Result Entry (`POST /reports/test-results`):** Technician submitted Hemoglobin `14.3 g/dL` (`NORMAL`), attributing `enteredById` to the technician.
15. **QC Release Gate Verification (`GET /quality/release-gate/check`):** Confirmed `eligible: true` across instrument status, calibration validity, and latest QC run.
16. **Draft Compilation & Submission (`POST /reports/draft`, `POST /reports/:id/submit-review`):** Compiled structured results into `DRAFT` report and queued as `PENDING_REVIEW`.
17. **Segregation of Duties Enforcement (`POST /reports/:id/approve`):** Confirmed technician self-approval is rejected (`403 Forbidden`).
18. **Independent Pathologist Approval (`POST /reports/:id/approve`):** Pathologist approved report (`APPROVED`, `VERIFIED`).
19. **Publication & Idempotency (`POST /reports/:id/publish`):** Generated authoritative PDF with SHA-256 `documentHash`, persisted immutable `v1` snapshot in `LabReportVersionModel`, updated parent order to `COMPLETED`, and verified repeat publish is idempotent.
20. **Authorized Patient & Doctor Delivery (`GET /api/v1/lab-reports/:id`, `/pdf`, `/fhir`):** Verified Patient retrieves published report & PDF (`application/pdf`), and ordering Doctor retrieves report & HL7 FHIR R4 `DiagnosticReport` Bundle.
21. **Notifications & Immutable Audit Trail:** Verified privacy-safe `LAB_REPORT_PUBLISHED` notifications (no raw clinical values in notification text) dispatched to both Patient and Doctor, and verified chronological `AuditLogModel` records across the lifecycle.

---

## 3. Verified Failure Scenarios (Part B)
All negative paths were executed and verified in automated tests:
- **Sample Failures:** Invalid barcode (`404`), rejected specimen blocking draft compilation (`400`), missing test results blocking draft (`400`), invalid state transitions (`400`).
- **QC & Instrument Failures:** Failed QC run blocks report publication (`400`), unauthorized QC override by technician blocked (`403`), `OUT_OF_SERVICE`, `RETIRED`, `IN_MAINTENANCE`, `FAILED` calibration, and `OVERDUE` calibration block release gate.
- **Reagent Failures:** Consumption from `QUARANTINED`, `RECALLED`, or `EXPIRED` lot rejected (`400`), insufficient stock rejected (`400`), negative stock adjustment beyond available balance rejected (`400`).
- **Report Failures:** Technician self-approval blocked (`403`), unauthorized `LAB_TECHNICIAN` amendment blocked (`403`), publishing unapproved report blocked (`400`), duplicate publish idempotent (`200`, retains `v1`).
- **Access & Tenant Isolation Failures:** `X-Laboratory-Id` header spoofing on QMS endpoints blocked (`403`), cross-laboratory report amendment blocked (`403`), Patient `?status=DRAFT` filter bypass returns `0` items, Doctor access to unpublished `DRAFT` blocked (`403`), cross-patient and cross-doctor access blocked (`403`), Pharmacy access to laboratory endpoints blocked (`403`).

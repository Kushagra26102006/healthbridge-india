# HealthBridge India — Laboratory Order to Published Report E2E Flow (Day 8 Task 05)

## Workflow Diagram

```mermaid
flowchart LR
    A[Doctor Creates Lab Order<br/>POST /api/v1/lab-orders] --> B[Outbox LAB_ORDER_CREATED<br/>-> Assigned Lab Work Queue]
    B --> C[Lab Accepts Order<br/>POST /laboratory/orders/:id/accept]
    C --> D[Sample Collection & Barcode<br/>POST /laboratory/samples/collect]
    D --> E[Accessioning & Result Entry<br/>Reference Range Snapshot]
    E --> F[QC Release Gate Check<br/>+ Pathologist Sign-Off]
    F -- Unapproved / QC Fail --> G[Publication Blocked 400]
    F -- Approved & QC Pass --> H[POST /laboratory/reports/:id/publish<br/>Immutable Version Ledger + PDF Hash]
    H --> I[Outbox REPORT_PUBLISHED / REPORT_AMENDED<br/>-> Patient Timeline + Authorized Doctor View]
```

## Verified Integrity Controls
- Ordering requires `DOCTOR` role and active patient relationship/consent (`PATIENT` role blocked `403`).
- Cross-laboratory report access or publication is blocked (`403`).
- Draft, rejected, and unapproved reports cannot be published (`400 Bad Request`), and failed QC release gates block publication unless an audited supervisor override is recorded.
- Report amendments preserve immutable previous versions in `LabReportVersionModel` and emit a distinct `REPORT_AMENDED` event.
- Doctors view published laboratory reports strictly read-only inside `/doctor/patients/[patientId]/overview`.

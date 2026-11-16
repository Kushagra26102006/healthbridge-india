# Laboratory Report Review & Authorized Approval

## 1. Overview
Diagnostic accuracy and clinical safety necessitate that no laboratory report is automatically published merely because results have been entered. HealthBridge India enforces a strict separation-of-duties review workspace and an authorized approval gate before diagnostic reports are released to patients and referring physicians.

---

## 2. Separation of Duties Policy

In compliance with NABL ISO 15189 and good laboratory practices:
- **No Self-Approval**: A laboratory technician who entered or recorded the test results (`enteredById` in `TestResultModel`) is **strictly prohibited** from reviewing or approving their own report (`403 Forbidden`).
- **Supervisor Exception**: Only designated supervisory pathologists or system administrators (`isSupervisor: true` or `role === 'ADMIN'`) can authorize release if an emergency override is validated.
- **Backend Enforcement**: The separation-of-duties check is evaluated entirely server-side in `LabReportService.reviewReport` by querying `TestResultModel.exists({ orderId, enteredById: req.user.id })`. Client-supplied reviewer identities or bypass flags are rejected.

---

## 3. Pathologist Review Workspace (`/laboratory/reports/[id]/review`)

The review workspace presents a unified analytical review interface:
1. **Clinical Context**: Patient demographics, referring physician, ordering diagnosis, and sample accessioning timestamps.
2. **Quality Control Verification**: Pre-analytical specimen verification, collection status, and absence of specimen rejections.
3. **Structured Parameter Audit**: All individual parameter results alongside normal and panic reference brackets.
4. **Panic / Critical Result Indicators**: Immediate visual alerts when parameters breach critical low or high cutoffs.

### Review Decisions
- **`APPROVED`**: Confirms diagnostic validity. Transitions report status to `APPROVED`, populates `reviewDetails`, and unlocks final publication.
- **`CORRECTION_REQUESTED`**: Returns report to `DRAFT` status. Requires mandatory detailed justification comments (minimum 5 characters) for laboratory technician re-testing or recalibration.
- **`REJECTED`**: Marks report as rejected due to specimen invalidity or analytical failure. Requires mandatory rejection justification.

---

## 4. Authorized Report Approval (`/laboratory/reports/[id]/approve`)

Before release, an authorized medical pathologist executes statutory approval:
- **Designation Attribution**: Consultant Pathologist, Laboratory Director, or Medical Biochemist.
- **Statutory Registration Number**: State Medical Council or MCI registration number (e.g., `MCI/DMC-PATH-9022`).
- **Professional Attestation**: Confirmation checkbox certifying that pre-analytical integrity and analytical verifications have been evaluated.
- **Approval Timestamp & Comments**: Persisted in `approvalDetails` on the `LaboratoryReportModel`.

---

## 5. Audit Logging & Notification Triggers

All review and approval actions produce tamper-evident audit logs:
- `LAB_REPORT_REVIEW_SUBMITTED`
- `LAB_REPORT_APPROVED`
- `LAB_REPORT_REJECTED`
- `LAB_REPORT_CORRECTION_REQUESTED`

Real-time notifications are published via `notificationService.publishEvent` under category `'LAB'` with appropriate clinical priority.

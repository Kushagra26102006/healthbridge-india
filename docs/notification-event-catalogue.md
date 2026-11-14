# HealthBridge India — Notification Event Catalogue

## 1. Overview & Classification

The HealthBridge India Notification Engine categorizes all clinical, operational, and security events into structured categories with defined priorities, recipient roles, and default delivery channels.

| Category | Default Priority | Target Roles | Enabled Channels |
| :--- | :--- | :--- | :--- |
| `PRESCRIPTION` | MEDIUM / HIGH | Patient, Doctor, Pharmacy | In-App, Email |
| `ORDER` | MEDIUM / HIGH | Patient, Pharmacy | In-App, Email, SMS (Pickup Code) |
| `INVENTORY` | HIGH / URGENT | Pharmacy | In-App, Email |
| `PROCUREMENT` | MEDIUM / HIGH | Pharmacy, Supplier | In-App, Email |
| `SECURITY` | URGENT (Mandatory) | All Authenticated Users | In-App, Email (Locked) |

---

## 2. Event Catalogue

### 2.1 Prescription Category (`PRESCRIPTION`)
- `PRESCRIPTION_RECEIVED`:
  - **Trigger**: Doctor issues prescription or patient routes prescription to pharmacy.
  - **Recipient**: Pharmacy / Patient.
  - **Payload Preview**: *"New Prescription Available — Prescription #RX-1001 ready for review."*
- `PRESCRIPTION_VERIFIED`:
  - **Trigger**: Pharmacist completes authenticity and eligibility check.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Prescription Verified — Your prescription has been authenticated and approved for dispensing."*
- `PRESCRIPTION_REJECTED`:
  - **Trigger**: Pharmacist flags prescription error, missing dosage, or illegibility.
  - **Recipient**: Patient / Doctor.
  - **Payload Preview**: *"Prescription Processing Update — Clarification required regarding prescription."*
- `PRESCRIPTION_READY_FOR_DISPENSING`:
  - **Trigger**: All medication items matched and allocated from batch inventory.
  - **Recipient**: Pharmacy Staff.
  - **Payload Preview**: *"Ready for Dispensing — Prescription #RX-1001 allocated."*
- `PRESCRIPTION_PARTIALLY_DISPENSED`:
  - **Trigger**: Pharmacist dispenses available items while remainder is pending.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Partial Dispensing Recorded — Some items dispensed under Ref #DISP-2026."*
- `PRESCRIPTION_FULLY_DISPENSED`:
  - **Trigger**: Full quantity dispensed and official CDSCO receipt generated.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Prescription Dispensed — All medications have been dispensed. Receipt available."*
- `PRESCRIPTION_CANCELLED`:
  - **Trigger**: Doctor revokes or patient cancels unfulfilled prescription.
  - **Recipient**: Pharmacy / Patient.
  - **Payload Preview**: *"Prescription Cancelled — Prescription order withdrawn."*

---

### 2.2 Order Fulfillment Category (`ORDER`)
- `ORDER_CREATED`:
  - **Trigger**: Order created from prescription by pharmacy staff or patient.
  - **Recipient**: Pharmacy Staff (Inbound) / Patient (Confirmation).
  - **Payload Preview**: *"Order Placed with Pharmacy — Order #ORD-1001 received and awaiting review."*
- `ORDER_ACCEPTED`:
  - **Trigger**: Pharmacist accepts order and schedules preparation.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Order Accepted — Order #ORD-1001 scheduled for preparation."*
- `ORDER_REJECTED`:
  - **Trigger**: Pharmacist rejects order due to inventory or clinical incompatibility.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Order Could Not Be Fulfilled — Order #ORD-1001 rejected. Please consult doctor or select alternate pharmacy."*
- `ORDER_PROCESSING`:
  - **Trigger**: Pharmacist initiates packaging and labeling.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Order Processing — Medications are being prepared and packaged."*
- `ORDER_PARTIALLY_FULFILLED`:
  - **Trigger**: Sub-dispensing linked to order items.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Order Partially Fulfilled — Partial medications packed."*
- `ORDER_READY_FOR_PICKUP`:
  - **Trigger**: All medications boxed and verification pickup reference generated.
  - **Recipient**: Patient (In-App, SMS, Email).
  - **Payload Preview**: *"Order Ready for Pickup — Present pickup code at counter collection."*
- `ORDER_COMPLETED`:
  - **Trigger**: Patient counter handover verified via SHA-256 pickup code hash.
  - **Recipient**: Patient.
  - **Payload Preview**: *"Order Handover Completed — Order #ORD-1001 collected successfully."*
- `ORDER_CANCELLED`:
  - **Trigger**: Order cancelled by authorized party before packaging.
  - **Recipient**: Counterparty (Pharmacy or Patient).
  - **Payload Preview**: *"Pharmacy Order Cancelled — Order #ORD-1001 cancelled."*

---

### 2.3 Inventory & Stock Category (`INVENTORY`)
- `LOW_STOCK`:
  - **Trigger**: Available batch quantity drops at or below configured `reorderLevel`.
  - **Recipient**: Chief Pharmacist / Procurement.
  - **Payload Preview**: *"Low Stock Alert — Amoxicillin 500mg has reached reorder threshold (15 units remaining)."*
- `OUT_OF_STOCK`:
  - **Trigger**: Inventory batch quantity reaches zero.
  - **Recipient**: Chief Pharmacist / Dispensing Counter.
  - **Payload Preview**: *"Out of Stock Alert — Paracetamol 650mg is depleted (0 units remaining)."*
- `NEAR_EXPIRY`:
  - **Trigger**: Batch expiry date falls within 90-day threshold window.
  - **Recipient**: Pharmacy Quality Lead.
  - **Payload Preview**: *"Near-Expiry Warning — Batch #BATCH-901 expires within 60 days."*
- `EXPIRED_BATCH`:
  - **Trigger**: Batch passes expiry date without being quarantined.
  - **Recipient**: Pharmacy Quality Lead.
  - **Payload Preview**: *"Expired Batch Locked — Batch #BATCH-102 quarantined from dispensing."*
- `STOCK_ADJUSTMENT`:
  - **Trigger**: Manual audit reconciliation, damage write-off, or return.
  - **Recipient**: Chief Pharmacist.
  - **Payload Preview**: *"Stock Adjustment Recorded — Quantity updated by supervisor."*
- `STOCK_RECEIVED`:
  - **Trigger**: Inbound purchase order received and allocated to storage racks.
  - **Recipient**: Pharmacy Staff.
  - **Payload Preview**: *"Stock Received — New inventory batches added."*

---

### 2.4 Procurement Category (`PROCUREMENT`)
- `PURCHASE_REQUISITION_SUBMITTED`:
  - **Trigger**: Staff drafts stock replenishment requisition.
  - **Recipient**: Pharmacy Supervisor / Approver.
- `PURCHASE_ORDER_APPROVAL_REQUIRED`:
  - **Trigger**: Requisition converted to formal Purchase Order exceeding auto-approval limit.
  - **Recipient**: Chief Pharmacist / Finance.
- `PURCHASE_ORDER_APPROVED`:
  - **Trigger**: Authorized supervisor signs and approves PO.
  - **Recipient**: Procurement Lead / Supplier.
  - **Payload Preview**: *"Purchase Order Approved — PO #PO-1001 approved."*
- `PURCHASE_ORDER_REJECTED`:
  - **Trigger**: Approver rejects PO with reason.
  - **Recipient**: Requisitioner.
- `GOODS_RECEIVED`:
  - **Trigger**: Goods Receipt Note (GRN) confirmed at receiving bay.
  - **Recipient**: Procurement Team / Accounts.
  - **Payload Preview**: *"Goods Received Note Created — GRN #GRN-1001 generated for PO #PO-1001."*
- `INVOICE_RECONCILIATION_REQUIRED`:
  - **Trigger**: Supplier invoice line-item price differs from PO purchase price.
  - **Recipient**: Finance / Procurement Officer.

---

### 2.5 Security & Account Category (`SECURITY` — Mandatory)
- `LOGIN_ALERT`:
  - **Trigger**: New browser session or unrecognized IP address login.
  - **Recipient**: User Account Holder.
  - **Payload Preview**: *"New Login Detected — Recognized sign-in from Chrome on macOS."*
- `PASSWORD_CHANGED`:
  - **Trigger**: User changes authentication password or completes self-service reset.
  - **Recipient**: User Account Holder.
- `SESSION_REVOKED`:
  - **Trigger**: Concurrent session terminated from security settings.
  - **Recipient**: User Account Holder.
- `SECURITY_ALERT`:
  - **Trigger**: Brute-force lockout, rate-limit threshold breach, or authorization anomaly.
  - **Recipient**: User Account Holder / Security Admin.
- `PROFILE_UPDATED`:
  - **Trigger**: Clinical registration, license, or personal contact info modified.
  - **Recipient**: User Account Holder.

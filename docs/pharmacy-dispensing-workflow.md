# HealthBridge India — Pharmacy Dispensing Workflow & Ledger Execution

## 1. Executive Summary

The Pharmacy Dispensing Workflow is a mission-critical subsystem of the HealthBridge India ABDM monorepo. It orchestrates the transition from authorized digital prescription to physical medication dispensing, ledger stock deduction, and statutory record creation.

Every dispensation is:
- **Atomic:** Batches and transactions update in lockstep.
- **Idempotent:** Submissions with identical keys prevent duplicate deduction on network retries.
- **Auditable:** Append-only transaction ledger records preserve exact timestamps, dispensers, and batch numbers.
- **Compliant:** Dispensing records and printable receipts adhere to CDSCO and Drugs & Cosmetics Act regulations.

---

## 2. Dispensing Data Model (`DispensingRecordModel`)

Dispensing records are stored in `DispensingRecordModel` (`dispensingrecords` collection in MongoDB Atlas).

```typescript
export interface IDispensingRecordDocument extends Document {
  dispensingNumber: string;         // Unique sequence, e.g. DSP-YYYYMMDD-XXXXXX
  pharmacyId: Types.ObjectId;       // Scoped to authenticated pharmacy User
  pharmacyName: string;
  pharmacyLicenseNumber?: string;
  pharmacyGstin?: string;
  pharmacyAddress?: {
    line1?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  prescriptionId: Types.ObjectId;   // Reference to PrescriptionModel
  prescriptionNumber: string;
  patientId: Types.ObjectId;        // Reference to patient UserModel
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: number;
  doctorId: Types.ObjectId;         // Reference to doctor UserModel
  doctorName: string;
  doctorSpecialization?: string;
  facilityName?: string;
  dispensedBy: Types.ObjectId;      // Pharmacist user ID
  dispenserName: string;
  dispensedAt: Date;
  dispensingStatus: 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'CANCELLED';
  items: IDispensingRecordItem[];
  totalItems: number;
  totalQuantityDispensed: number;
  totalAmount: number;
  notes?: string;
  idempotencyKey?: string;          // Compound sparse index on { pharmacyId, idempotencyKey }
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelledByName?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Database Indexes
- `{ dispensingNumber: 1 }` (Unique)
- `{ pharmacyId: 1, dispensedAt: -1 }` (History queries)
- `{ prescriptionId: 1, dispensedAt: -1 }` (Verification & remaining balance computation)
- `{ patientId: 1, dispensedAt: -1 }` (Patient longitudinal record)
- `{ pharmacyId: 1, idempotencyKey: 1 }` (Unique, sparse, concurrency shield)

---

## 3. Mathematical Fulfillment & Over-Dispensing Formula

For each prescribed medication item $i$, remaining quantities are calculated across all non-cancelled historical dispensing records:

$$\text{previouslyDispensedQuantity}_i = \sum_{r \in \text{Records}} \text{quantityDispensed}_{r, i}$$

$$\text{remainingQuantity}_i = \max(0, \text{prescribedQuantity}_i - \text{previouslyDispensedQuantity}_i)$$

### Validation Rule:
If $\text{quantityToDispense}_i > \text{remainingQuantity}_i$, the API immediately rejects the request with HTTP `400 Bad Request`:
> *"Cannot dispense X units for '[Medicine]'; remaining prescribed quantity is Y"*

### Status Transition:
- If $\sum_{i} \text{newRemainingQuantity}_i == 0$:
  - `dispensingStatus = 'FULLY_DISPENSED'`
  - `PrescriptionModel.findByIdAndUpdate(prescriptionId, { status: 'DISPENSED' })`
- If $\sum_{i} \text{newRemainingQuantity}_i > 0$:
  - `dispensingStatus = 'PARTIALLY_DISPENSED'`

---

## 4. Atomic Stock Deduction & Append-Only Ledger

Upon receiving a valid dispensing payload:
1. **Batch Deduction:**
   `PharmacyInventoryModel.findByIdAndUpdate(batch._id, { $inc: { availableQuantity: -quantityToDispense }, $set: { status: newStatus } })`
   - If `newQuantity === 0`, status changes to `'OUT_OF_STOCK'`.
   - If `0 < newQuantity <= reorderLevel`, status changes to `'LOW_STOCK'`.
2. **Immutable Ledger Insertion:**
   `PharmacyInventoryTransactionModel.create({ ... })`
   - `transactionType: 'STOCK_DISPENSED'`
   - `previousQuantity: prevQty`
   - `newQuantity: newQty`
   - `referenceType: 'PRESCRIPTION'`
   - `referenceId: prescriptionId`
3. **In-App Patient Notification:**
   `NotificationModel.create({ userId: patientId, type: 'PRESCRIPTION', title: 'Prescription Dispensed', message: '...' })`

---

## 5. CDSCO-Compliant Printable Receipt

The platform generates official dispensing receipts accessible via `/pharmacy/dispensing/:id/receipt`:

### Required Compliance Elements:
- Pharmacy name, address, valid drug license number, and GSTIN.
- Attending doctor name, specialization, and MCI registration number.
- Patient name, age, gender, and contact phone.
- Itemized list: medicine name, strength, dosage form, batch number, expiry date, quantity, selling price, and total.
- Registered Pharmacist signature & date block.
- Mandatory Statutory Disclaimer:
  > *"This is an official Pharmacy Dispensing Record generated under the Drugs and Cosmetics Act, 1940 and CDSCO regulations. This document confirms the dispensing of medicines and is not a replacement prescription."*

---

## 6. Cancellation & Reversal Workflow

If a patient cancels an order or returns medication prior to physical departure:
- `POST /api/v1/pharmacy/dispensing/:id/cancel`
- Requires non-empty `reason` string (min 3 characters).
- Optional `restoreToInventory: true`:
  - Increments batch `availableQuantity`.
  - If `quarantineRestoredStock: true`, tags batch as `QUARANTINED` with `quarantineReason: reason` for QA inspection.
  - Appends `STOCK_ADJUSTED` or `STOCK_QUARANTINED` ledger entry.
- Resets prescription status back to `'ACTIVE'` if previously marked `'DISPENSED'`.

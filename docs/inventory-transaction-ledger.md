# Pharmacy Inventory Transaction Ledger & Audit Trail Specification

## 1. Principles of Immutability

Under Schedule M of the Drugs and Cosmetics Rules, all movements of pharmaceutical stock must maintain an unbroken, verifiable audit trail.

The HealthBridge India Inventory Transaction Ledger implements the following guarantees:
1. **Append-Only Storage**: Documents in the `pharmacyInventoryTransactions` collection are created once and are strictly immutable. Update (`updateOne`, `updateMany`) and delete (`deleteOne`, `deleteMany`) operations on this collection are forbidden.
2. **Deterministic Sequence Formatting**: Every movement receives a unique, human-readable reference number adhering to:
   $$\text{Reference} = \text{TXN}-\text{YYYYMMDD}-\text{XXXXXX}$$
   where $\text{YYYYMMDD}$ represents UTC date and $\text{XXXXXX}$ is a 6-digit cryptographic sequence.
3. **Double-Entry State Snapshotting**: Every entry captures:
   - `previousQuantity`: Available units immediately prior to the transaction.
   - `quantityChange`: Signed delta ($\Delta Q$), positive for additions, negative for reductions, 0 for status transitions.
   - `newQuantity`: Resulting available units ($\text{previousQuantity} + \text{quantityChange} = \text{newQuantity}$).
4. **Attribution**: Every entry stores the authenticated user ID (`performedBy`), resolved pharmacist display name (`performedByName`), mandatory audit reason (`reason`), and associated commercial/clinical reference (`referenceEntity`, `referenceId`).

---

## 2. Transaction Types & State Transitions

```typescript
type InventoryTransactionType =
  | 'STOCK_RECEIVED'      // Inflow: Supplier delivery / invoice intake (+Q)
  | 'STOCK_DISPENSED'     // Outflow: Patient prescription fulfillment (-Q)
  | 'STOCK_ADJUSTED'      // Audit variance: Cycle count physical correction (+/-Q)
  | 'STOCK_DAMAGED'       // Write-off: Broken packaging, contamination (-Q)
  | 'STOCK_EXPIRED'       // Disposal: Expired batch withdrawal (-Q)
  | 'STOCK_QUARANTINED'   // Hold: Placed in quality investigation hold (0)
  | 'STOCK_RELEASED'      // Clearance: Restored to active inventory (0)
  | 'STOCK_TRANSFERRED';  // Inter-branch movement (+/-Q)
```

---

## 3. Database Schema

```typescript
const PharmacyInventoryTransactionSchema = new Schema(
  {
    transactionReference: { type: String, required: true, unique: true, index: true },
    pharmacyId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'PharmacyInventory', required: true, index: true },
    medicationCatalogId: { type: Schema.Types.ObjectId, ref: 'MedicationCatalog', index: true },
    medicationName: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, uppercase: true, index: true },
    transactionType: {
      type: String,
      enum: [
        'STOCK_RECEIVED',
        'STOCK_DISPENSED',
        'STOCK_ADJUSTED',
        'STOCK_DAMAGED',
        'STOCK_EXPIRED',
        'STOCK_QUARANTINED',
        'STOCK_RELEASED',
        'STOCK_TRANSFERRED',
      ],
      required: true,
      index: true,
    },
    quantityChange: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, minlength: 3 },
    referenceEntity: {
      type: String,
      enum: ['SUPPLIER_INVOICE', 'PRESCRIPTION', 'ORDER', 'MANUAL_ADJUSTMENT', 'BATCH_CREATION', 'INTER_BRANCH_TRANSFER'],
      default: 'MANUAL_ADJUSTMENT',
    },
    referenceId: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // updatedAt disabled: append-only
    collection: 'pharmacyInventoryTransactions',
  }
);
```

---

## 4. Reconciliation Verification Query

To verify physical inventory integrity against the ledger for any batch:

$$\text{Current Batch Balance} \equiv \sum_{i=1}^{N} \Delta Q_i$$

A discrepancy indicates tampering or an untracked physical modification, immediately surfacing an anomaly alert in compliance audits.

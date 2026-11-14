# HealthBridge India — Goods Receiving (GRN) & Real-Time Inventory Allocation

## 1. Overview & Objective

The **Goods Receipt Note (GRN)** module links procurement commitments to physical inventory availability. When shipments arrive from suppliers, this workflow verifies received goods against authorized Purchase Orders, validates physical batch numbers and expiry dates, allocates stock batches to `PharmacyInventoryModel`, and writes immutable audit logs to `PharmacyInventoryTransactionModel`.

---

## 2. Integrity Verification Rules

To maintain absolute inventory fidelity and prevent fraudulent stock injections, the goods receiving service enforces strict validation gates:

### 2.1 PO State Verification
- A GRN can only be processed against Purchase Orders in `APPROVED`, `SENT_TO_SUPPLIER`, or `PARTIALLY_RECEIVED` state.
- Orders in `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, `CANCELLED`, or `FULLY_RECEIVED` are rejected immediately.

### 2.2 Cumulative Quantity Bounds
$$\text{cumulativeReceived} = \text{alreadyReceived} + \text{newReceivedQuantity}$$
- If $\text{cumulativeReceived} > \text{orderedQuantity}$, the request is rejected with HTTP 400 Bad Request. Over-receipt is strictly prohibited without an amended Purchase Order.

### 2.3 Expiry Date Gate
- Any batch with $\text{expiryDate} \le \text{currentDate}$ is rejected. Expired medicines are never permitted into active inventory.
- Near-expiry warnings are flagged if the expiration date is within 90 days.

---

## 3. Real-Time Batch & Ledger Allocation Workflow

When a valid GRN payload is submitted:

```
[Inbound Shipment]
       │
       ▼
[Validate GRN vs PO] ── (Check Cumulative Qty & Expiry)
       │
       ▼
[Update PO Remaining Quantities]
       │
       ├─► All items satisfied? ──► Set PO Status: FULLY_RECEIVED
       └─► Balance remains?    ──► Set PO Status: PARTIALLY_RECEIVED
       │
       ▼
[Upsert Batch in PharmacyInventoryModel]
       │ (Matches pharmacyId + medicationCatalogId + batchNumber)
       ├─► Exists: Increment availableQuantity & totalStock
       └─► New: Create active batch with purchase price, selling price, MRP
       │
       ▼
[Log Immutable Transaction]
       │ (type: STOCK_RECEIVED, referenceType: PURCHASE_ORDER)
       ▼
[Generate Deterministic GRN Document]
       (GRN-YYYYMMDD-XXXX)
```

---

## 4. Invoicing & Three-Way Reconciliation

The module supports complete Three-Way Matching:

1. **Purchase Order (PO):** Contracted quantity and agreed price.
2. **Goods Receipt Note (GRN):** Physical quantity accepted and verified batch details.
3. **Purchase Invoice:** Supplier's commercial billing document.

Status transitions for invoices:
- `PENDING`: Invoice recorded, awaiting physical verification or payment schedule.
- `RECONCILED`: GRN quantities and PO prices match invoice values exactly.
- `DISPUTED`: Discrepancy detected in quantities, damaged goods, or billing rates.

---

## 5. API Endpoints

| Method | Endpoint | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/pharmacy/purchases/:id/receive` | Process goods receipt (GRN) | Strict cumulative checks |
| `GET` | `/api/v1/pharmacy/goods-receipts` | List GRNs | Filter by PO, date, supplier |
| `GET` | `/api/v1/pharmacy/goods-receipts/:id` | Fetch GRN details | Includes batch allocations |
| `POST` | `/api/v1/pharmacy/invoices` | Record vendor invoice | Links PO & GRN numbers |
| `GET` | `/api/v1/pharmacy/invoices` | List invoices | Filter by status, supplier |
| `PATCH`| `/api/v1/pharmacy/invoices/:id` | Reconcile or dispute invoice | Audit notes recorded |

---

## 6. Frontend Goods Receiving Interface

- **GRN Reception Form (`/pharmacy/purchases/[id]/receive`):** Pre-populated with remaining quantities from the PO, inputs for physical batch number, manufacturing date, expiry date, storage location (rack/shelf), and accepted vs. rejected counts.
- **GRN Receipt Modal (`GoodsReceiptDetailsModal`):** Instant visual summary with batch tags, acceptance metrics, and download/print capabilities.
- **Purchase Invoice Ledger (`PurchaseInvoiceTable`):** Displays pending invoices, payment due dates, reconciliation buttons, and dispute resolution dialogs.

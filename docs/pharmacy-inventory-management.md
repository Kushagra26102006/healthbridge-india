# Pharmacy Inventory Management Architecture & CDSCO Compliance Specification

## 1. Executive Summary & Clinical Context

In the Indian healthcare ecosystem, retail and hospital pharmacies operate under stringent regulatory oversight governed by the **Drugs and Cosmetics Act, 1940**, the **Drugs and Cosmetics Rules, 1945**, and directives issued by the **Central Drugs Standard Control Organization (CDSCO)** and State Drug Control Administrations.

Under **HealthBridge India** (ABDM Integrated Healthcare Platform), the Pharmacy Inventory Management System provides:
1. **Master Medicine Catalogue Management**: Reusable master catalog with strict composite deduplication on `{ brandName, strength, dosageForm, manufacturer }`.
2. **Batch & Lot Traceability**: Pharmacy-specific batch records tracking manufacturer, supplier, invoice, unit costs, selling prices, MRP, manufacturing and expiry dates, and shelf locations.
3. **Goods Receipt (Stock-In)**: Invoicing workflow recording physical stock additions with atomic quantity balance updates and automated append-only ledger transaction logging.
4. **Controlled Stock Adjustments**: Compensating cycle count corrections, damages, expired write-offs, and quality holds with mandatory >=3 character reason auditing.
5. **Quality Quarantine & Release Lifecycle**: Immediate non-dispensable status tagging with complete audit trails.
6. **Real-Time Expiry Horizons**: Server wall-clock evaluation classifying batches into `EXPIRED`, `EXPIRING_7_DAYS`, `EXPIRING_30_DAYS`, `EXPIRING_90_DAYS`, and `SAFE`.
7. **Transparent Financial Stock Valuation**:
   $$\text{Eligible Stock Valuation} = \sum (\text{availableQuantity} \times \text{purchasePrice}) \quad \forall \text{ batches where } \text{status} \in \{\text{IN\_STOCK}, \text{LOW\_STOCK}, \text{ACTIVE}\}$$
   Quarantined and expired stock valuations are strictly segregated and reported separately.

---

## 2. Medicine Catalogue Architecture

### 2.1 Deduplication & Uniqueness Guard
The master medicine catalogue avoids duplicate records while preserving legitimate clinical variations (e.g., *Augmentin 625 Duo Tablet* vs *Augmentin 375 Tablet* vs *Augmentin Oral Suspension*).

A unique compound index is enforced at the MongoDB layer:
```typescript
MedicationCatalogSchema.index(
  { brandName: 1, strength: 1, dosageForm: 1, manufacturer: 1 },
  { unique: true }
);
```

### 2.2 Schema Definition
```typescript
interface MedicationCatalogItem {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  dosageForm: string; // TABLET, CAPSULE, SYRUP, INJECTION, OINTMENT, DROPS, INHALER
  strength: string; // e.g. "500 mg", "650 mg"
  route: string; // Oral, IV, IM, Topical
  manufacturer: string;
  category: string; // Analgesic, Antibiotic, Cardiovascular, etc.
  composition?: string;
  packSize?: string;
  unitOfMeasurement?: string;
  schedule: string; // Schedule H, H1, X, G, OTC
  therapeuticClass?: string;
  requiresPrescription: boolean;
  isActive: boolean;
}
```

---

## 3. Pharmacy-Scoped Inventory & Batches

### 3.1 Tenancy & Multi-Pharmacy Isolation
All inventory items and batches are strictly scoped by `pharmacyId: Types.ObjectId` derived from the verified JWT bearer token (`req.user.userId`). Cross-pharmacy access attempts return `404 Not Found`.

### 3.2 Batch Stock Status Machine
Every batch continuously evaluates its status according to regulatory rules:

| Status | Condition | Dispensable? | Valuation Category |
| :--- | :--- | :---: | :--- |
| `IN_STOCK` | $\text{availableQuantity} > \text{reorderLevel} \land \text{expiryDate} > \text{now} \land \neg\text{isQuarantined}$ | **Yes** | Eligible Active Valuation |
| `LOW_STOCK` | $0 < \text{availableQuantity} \le \text{reorderLevel} \land \text{expiryDate} > \text{now} \land \neg\text{isQuarantined}$ | **Yes** | Eligible Active Valuation |
| `OUT_OF_STOCK`| $\text{availableQuantity} = 0 \land \neg\text{isQuarantined}$ | **No** | Zero |
| `NEAR_EXPIRY` | $\text{now} < \text{expiryDate} \le \text{now} + 30\text{ days} \land \neg\text{isQuarantined}$ | **Yes (Priority)**| Eligible Active Valuation |
| `EXPIRED` | $\text{expiryDate} \le \text{now}$ | **Strictly Forbidden** | Segregated Write-Off Value |
| `QUARANTINED`| $\text{isQuarantined} = \text{true}$ | **Strictly Forbidden** | Segregated Quality Hold Value |
| `DISCONTINUED`| Batch formally archived or de-registered | **No** | Zero |

---

## 4. Operational Workflows

### 4.1 Stock-In (Goods Receiving)
1. **Intake Form**: Pharmacist inputs invoice reference, supplier, batch number, received quantity ($\ge 1$), prices, manufacturing date, and expiry date (must be in the future).
2. **Batch Lookup**:
   - If batch exists for this pharmacy: increment `availableQuantity` and `receivedQuantity`, update cost and selling price, re-evaluate status.
   - If new batch: create `PharmacyInventoryModel` record.
3. **Ledger Transaction**: Atomically creates append-only record in `pharmacyInventoryTransactions` with type `STOCK_RECEIVED`, sequential reference `TXN-YYYYMMDD-XXXXXX`, and previous/new quantity snapshots.
4. **Audit Log**: Records `STOCK_RECEIVED` in `AuditLogModel`.

### 4.2 Stock Adjustment & Negative Stock Prevention
1. Pharmacist selects batch and selects operation: `INCREASE`, `DECREASE`, `DAMAGE`, `EXPIRED_REMOVAL`, `CORRECTION`, `QUARANTINE`, or `RELEASE_QUARANTINE`.
2. **Negative Stock Guard**: If an operation would result in $\text{availableQuantity} < 0$, the request is immediately rejected with `400 Bad Request`.
3. **Mandatory Audit Reason**: Minimum 3 characters explaining variance, required by CDSCO inspectors.
4. **Compensating Transaction**: Creates immutable ledger transaction with exact signed delta ($\Delta Q$).

### 4.3 Expiry Horizons
Batches are dynamically categorized in real-time without modifying database documents unless written off:
- **`EXPIRED`**: $\text{expiryDate} \le \text{today}$.
- **`EXPIRING_7_DAYS`**: $\text{today} < \text{expiryDate} \le \text{today} + 7\text{ days}$.
- **`EXPIRING_30_DAYS`**: $\text{today} + 7\text{ days} < \text{expiryDate} \le \text{today} + 30\text{ days}$.
- **`EXPIRING_90_DAYS`**: $\text{today} + 30\text{ days} < \text{expiryDate} \le \text{today} + 90\text{ days}$.
- **`SAFE`**: $\text{expiryDate} > \text{today} + 90\text{ days}$.

---

## 5. Security & Multi-Role Access Control (RBAC)

| Endpoint | Method | Permitted Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/v1/pharmacy/medicines` | GET | `PHARMACY` | Search and filter master catalogue |
| `/api/v1/pharmacy/medicines` | POST | `PHARMACY` | Register formulation with deduplication |
| `/api/v1/pharmacy/medicines/:id` | GET, PATCH | `PHARMACY` | View / update formulation details |
| `/api/v1/pharmacy/inventory` | GET, POST | `PHARMACY` | List / add batch items |
| `/api/v1/pharmacy/inventory/:id` | GET | `PHARMACY` | Batch details (scoped to pharmacy) |
| `/api/v1/pharmacy/inventory/stock-in` | POST | `PHARMACY` | Intake receiving & ledger entry |
| `/api/v1/pharmacy/inventory/stock-adjustment` | POST | `PHARMACY` | Cycle adjustment & damage write-off |
| `/api/v1/pharmacy/inventory/batches/:id/quarantine` | POST | `PHARMACY` | Quarantine batch hold |
| `/api/v1/pharmacy/inventory/batches/:id/release` | POST | `PHARMACY` | Release quarantined batch |
| `/api/v1/pharmacy/inventory/transactions` | GET | `PHARMACY` | Query append-only ledger |
| `/api/v1/pharmacy/inventory/expiry-report` | GET | `PHARMACY` | Real-time shelf-life surveillance |
| `/api/v1/pharmacy/inventory/alerts-summary` | GET | `PHARMACY` | Aggregated low-stock & critical alerts |
| `/api/v1/pharmacy/inventory/analytics` | GET | `PHARMACY` | Financial valuation & distributions |

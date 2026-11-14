# HealthBridge India — Pharmacy Supplier Management Architecture

## 1. Overview & Objective

The **Pharmacy Supplier Management** module delivers a compliant, multi-tenant vendor management foundation within HealthBridge India's pharmacy procurement ecosystem. It empowers licensed pharmacies to maintain approved vendor relationships, negotiate contracted procurement pricing, verify compliance credentials (Drug License Form 20B/21B and GSTIN), and track vendor performance metrics.

---

## 2. Security & Multi-Tenancy Architecture

HealthBridge India enforces strict **tenant isolation** across all supplier models and operations:

- **Isolated Pharmacy Ownership:** Every supplier record is keyed to `pharmacyId: Types.ObjectId(req.user.userId)`.
- **RBAC Enforcement:** Access is strictly restricted to authenticated users holding the `PHARMACY` role. Attempts by `DOCTOR`, `PATIENT`, or unauthenticated requests are rejected with HTTP 403 Forbidden or HTTP 401 Unauthorized.
- **Unique Identification:** Suppliers are assigned deterministic system codes (`SUP-YYYYMMDD-XXXX`) and scoped uniqueness checks: two pharmacies can deal with the same commercial entity under distinct localized profiles, credit terms, and bank accounts.

```
       ┌────────────────────────────────────────────────────────┐
       │              Express Authenticate Middleware            │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │            RBAC Authorize ('PHARMACY' only)            │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │     Pharmacy Isolation (pharmacyId: req.user.userId)   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
          ┌─────────────────────┐     ┌─────────────────────┐
          │   Supplier Record   │     │   Supplier Product  │
          │  (KYC, GST, DL, T&C)│     │  (Contract Pricing) │
          └─────────────────────┘     └─────────────────────┘
```

---

## 3. Data Models

### 3.1 Supplier Schema (`SupplierModel`)

- **Identifier:** `_id`, `supplierCode` (`SUP-YYYYMMDD-XXXX`, indexed)
- **Tenancy:** `pharmacyId` (indexed, ObjectId referencing User/Pharmacy)
- **Company Details:** `name`, `legalName`, `supplierType` (`MANUFACTURER`, `DISTRIBUTOR`, `WHOLESALER`, `STOCKIST`, `IMPORTER`)
- **Compliance & Tax:**
  - `gstin`: Valid Indian GSTIN (15 characters)
  - `pan`: Indian Permanent Account Number (10 characters)
  - `drugLicenseNumber`: Mandatory wholesale/distribution license (Forms 20B/21B)
  - `drugLicenseExpiry`: Expiration date for compliance auditing
- **Contacts:**
  - Primary Contact: `contactPerson`, `email`, `phone`, `alternatePhone`
  - Secondary Contact: Optional escalation point
- **Address:** `addressLine1`, `addressLine2`, `city`, `state`, `pincode`, `country` (`IN`)
- **Commercial & Payment Terms:**
  - `paymentTermsDays`: Net credit period (e.g., 15, 30, 45, 60 days)
  - `creditLimit`: Maximum allowable credit limit in INR
  - `bankDetails`: `accountName`, `accountNumber`, `ifscCode`, `bankName`, `branchName`
- **Audit & Status:**
  - `status`: `ACTIVE`, `INACTIVE`, `BLACKLISTED`, `PENDING_VERIFICATION`
  - `rating`: 1 to 5 stars
  - `totalOrdersCount`, `totalOrderValue`, `lastOrderDate`

### 3.2 Supplier Product Catalog Schema (`SupplierProductModel`)

Maps national medication catalogue entries to individual vendor contracts:

- `pharmacyId`: Pharmacy tenant ID
- `supplierId`: Foreign key to `SupplierModel`
- `medicationCatalogId`: Master medication catalog foreign key
- `supplierProductCode`: Vendor SKU / Catalogue Code
- `purchasePrice`: Contracted procurement price (exclusive of tax)
- `mrp`: Maximum Retail Price
- `minimumOrderQuantity`: MOQ constraint for purchase orders
- `packSize`: Packaging configuration (e.g., "Strip of 10", "Box of 100")
- `leadTimeDays`: Standard turnaround delivery days
- `isAvailable`: Availability toggle for automatic replenishment algorithms

---

## 4. API Endpoints

| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/pharmacy/suppliers` | Register new supplier | `PHARMACY` |
| `GET` | `/api/v1/pharmacy/suppliers` | List suppliers (search, status, pagination) | `PHARMACY` |
| `GET` | `/api/v1/pharmacy/suppliers/:id` | Fetch supplier detail by ID | `PHARMACY` |
| `PUT` | `/api/v1/pharmacy/suppliers/:id` | Update supplier information & terms | `PHARMACY` |
| `PATCH`| `/api/v1/pharmacy/suppliers/:id/status` | Update supplier status (`ACTIVE`, `BLACKLISTED`) | `PHARMACY` |
| `POST` | `/api/v1/pharmacy/suppliers/products` | Add or update contracted product pricing | `PHARMACY` |
| `GET` | `/api/v1/pharmacy/suppliers/products` | List supplier products | `PHARMACY` |
| `GET` | `/api/v1/pharmacy/suppliers/:id/products` | List all contracted medicines for a vendor | `PHARMACY` |
| `DELETE`| `/api/v1/pharmacy/suppliers/products/:id` | Remove catalog mapping | `PHARMACY` |

---

## 5. Frontend User Experience

- **Supplier Directory (`/pharmacy/suppliers`):** Instant search, status badge indicators, credit limit indicators, and quick action shortcuts.
- **Supplier Onboarding (`/pharmacy/suppliers/new`):** Validated wizard covering GSTIN format checks, drug license expiry verification, and IFSC validation.
- **Supplier Profile & Catalog (`/pharmacy/suppliers/[id]`):** Tabs for General Info, Contracted Products, Purchase Order History, and Performance Analytics.
- **Direct Catalog Linking:** Doctors/Pharmacists can directly see contracted suppliers when creating replenishment orders or browsing low-stock inventory.


# HealthBridge India — Automated Stock Replenishment & Reorder Intelligence

## 1. Overview & Objective

The **Automated Stock Replenishment Engine** prevents medication stock-outs and avoids over-ordering by monitoring stock levels across all active batches, factoring in reserved stock, accounting for pending inbound deliveries, and generating server-side reorder recommendations.

---

## 2. Replenishment Calculation Model

The engine operates on a mathematically rigorous formula evaluated per medication:

### 2.1 Net Available Stock
$$\text{netAvailableStock} = \sum (\text{availableQuantity} - \text{reservedQuantity})$$
*Note: Expired (`expiryDate` $\le \text{now}$) and quarantined batches are strictly excluded from available stock.*

### 2.2 Pending Inbound Stock
$$\text{pendingInboundQuantity} = \sum_{\text{Open POs}} \text{remainingQuantity}$$
*Open POs include orders in `APPROVED`, `SENT_TO_SUPPLIER`, and `PARTIALLY_RECEIVED` statuses.*

### 2.3 Reorder Trigger Condition
A medication triggers a replenishment recommendation when:
$$\text{netAvailableStock} \le \text{reorderLevel}$$

### 2.4 Suggested Order Quantity Formula
$$\text{targetStock} = \text{reorderLevel} \times \text{reorderMultiplier}$$
$$\text{suggestedOrderQuantity} = \max\left(0, \text{targetStock} - (\text{netAvailableStock} + \text{pendingInboundQuantity})\right)$$

By default, $\text{reorderMultiplier} = 2.0$ (configurable in replenishment settings).

```
   Target Stock (e.g. 2 x Reorder Level = 40)
┌──────────────────────────────────────────────┐
│                                              ▲
│                                              │ Suggested Order
│                                              │ Quantity (15)
│                                              ▼
├──────────────────────────────────────────────┤
│ Pending Inbound from POs (20)                │
├──────────────────────────────────────────────┤
│ Net Available Stock on Shelves (5)           │
└──────────────────────────────────────────────┘
```

---

## 3. Preferred Supplier Resolution & One-Click Requisition

1. **Vendor Rate Lookup:** For each low-stock medication, the engine queries `SupplierProductModel` to identify active vendors supplying that medication, sorted by lowest contracted `purchasePrice`.
2. **Estimated Spend Calculation:**
   $$\text{estimatedCost} = \text{suggestedOrderQuantity} \times \text{contractedPurchasePrice}$$
3. **One-Click Conversion:** Pharmacists can select individual or all suggestions and convert them directly into a draft `PurchaseRequisition` or direct `PurchaseOrder`, eliminating manual data re-entry.

---

## 4. Reorder Parameters & Settings

Pharmacies can fine-tune reorder behavior per facility:
- `defaultReorderMultiplier`: Stock coverage multiplier (e.g., $1.5\times$, $2\times$, $3\times$).
- `defaultSafetyStockDays`: Buffer period for delivery lead times.
- `autoGenerateRequisitions`: Toggle automatic creation of draft requisitions when thresholds are breached.
- `notifyOnThreshold`: Trigger real-time notifications to pharmacy managers.

---

## 5. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/pharmacy/replenishment/suggestions` | Fetch reorder suggestions (filters for `onlyBelowReorderLevel`, supplier, search) |
| `POST`| `/api/v1/pharmacy/replenishment/convert-requisition` | Convert selected suggestion IDs into a `PurchaseRequisition` |
| `GET` | `/api/v1/pharmacy/replenishment/settings` | Get pharmacy replenishment configuration |
| `PUT` | `/api/v1/pharmacy/replenishment/settings` | Update replenishment configuration |
| `GET` | `/api/v1/pharmacy/procurement/metrics` | Aggregated procurement and replenishment KPIs |

---

## 6. Frontend Replenishment Portal

- **Replenishment Hub (`/pharmacy/replenishment`):** KPI summary cards highlighting low-stock items, urgent shortages, and total estimated replenishment budget.
- **Suggestions Table (`/pharmacy/replenishment/suggestions`):** Interactive data grid with stock gauges, inbound delivery indicators, preferred supplier chips, and bulk selection checkboxes.
- **Replenishment Settings (`/pharmacy/replenishment/settings`):** Configurable sliders for lead times, reorder multipliers, and automated alert preferences.


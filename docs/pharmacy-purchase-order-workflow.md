# HealthBridge India — Pharmacy Purchase Order Workflow & Server-Authoritative Financials

## 1. Overview & Objective

The **Purchase Order (PO)** workflow regulates the end-to-end procurement lifecycle for retail and hospital pharmacies. It transitions raw demand signals (manual requisitions or algorithmic reorder suggestions) into legally binding commercial orders, ensuring complete fiscal transparency through **server-authoritative calculations**.

---

## 2. Procurement Lifecycle State Machine

```
              ┌────────────────────────────────────────────────────────┐
              │          1. Purchase Requisition (Draft)               │
              └───────────────────────────┬────────────────────────────┘
                                          │
                                          ▼
              ┌────────────────────────────────────────────────────────┐
              │           2. Submitted Requisition                     │
              └───────────────────────────┬────────────────────────────┘
                                          │ Approved
                                          ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       3. Purchase Order Created                             │
 │   - Status: DRAFT or PENDING_APPROVAL                                       │
 │   - Calculations: Server-authoritative subtotal, tax, discount & grandTotal │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              ┌──────────────────────┐      ┌──────────────────────┐
              │       APPROVED       │      │       REJECTED       │
              └──────────┬───────────┘      └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   SENT_TO_SUPPLIER   │
              └──────────┬───────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌───────────────────┐         ┌────────────────────┐
│PARTIALLY_RECEIVED │         │   FULLY_RECEIVED   │
└─────────┬─────────┘         └────────────────────┘
          │ (Further GRNs)
          ▼
┌───────────────────┐
│  FULLY_RECEIVED   │
└───────────────────┘
```

---

## 3. Server-Authoritative Financial Computations

To prevent tampering and floating-point errors, clients are never permitted to dictate line totals or grand totals. The server calculates all financial figures deterministically:

1. **Line Discount Deduction:**
   $$\text{discountedUnit} = \text{unitPrice} \times \left(1 - \frac{\text{discountPercent}}{100}\right)$$

2. **Line Subtotal:**
   $$\text{lineSubtotal} = \text{orderedQuantity} \times \text{discountedUnit}$$

3. **Line Tax Amount:**
   $$\text{lineTax} = \text{lineSubtotal} \times \frac{\text{taxPercent}}{100}$$

4. **Line Total:**
   $$\text{itemTotal} = \text{lineSubtotal} + \text{lineTax}$$

5. **Order Aggregation:**
   $$\text{orderSubtotal} = \sum \text{lineSubtotal}$$
   $$\text{orderTaxTotal} = \sum \text{lineTax}$$
   $$\text{orderGrandTotal} = \text{orderSubtotal} + \text{orderTaxTotal} + \text{shippingCharges} - \text{overallDiscount}$$

---

## 4. Requisition to Purchase Order Conversion

1. **Departmental Demand:** Staff create requisitions with priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
2. **Requisition Approval:** Pharmacist or Store Manager approves the requisition.
3. **Automated Conversion:** The system groups requisition items by preferred supplier, checks contracted vendor rates in `SupplierProductModel`, and automatically drafts structured purchase orders.

---

## 5. API Endpoints

| Method | Endpoint | Description | Lifecycle Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/pharmacy/requisitions` | Create purchase requisition | Authenticated Pharmacy |
| `GET` | `/api/v1/pharmacy/requisitions` | List requisitions with filters | Authenticated Pharmacy |
| `POST` | `/api/v1/pharmacy/requisitions/:id/approve` | Approve requisition | Must be `PENDING_APPROVAL` |
| `POST` | `/api/v1/pharmacy/requisitions/:id/reject` | Reject requisition with reason | Must be `PENDING_APPROVAL` |
| `POST` | `/api/v1/pharmacy/purchases` | Create Purchase Order | Auto-calculates totals |
| `GET` | `/api/v1/pharmacy/purchases` | List purchase orders | Filter by supplier, status, date |
| `GET` | `/api/v1/pharmacy/purchases/:id` | Get Purchase Order details | Tenant isolated |
| `PUT` | `/api/v1/pharmacy/purchases/:id` | Update PO | Allowed in `DRAFT` or `PENDING_APPROVAL` |
| `POST` | `/api/v1/pharmacy/purchases/:id/approve` | Approve Purchase Order | Transitions to `APPROVED` |
| `POST` | `/api/v1/pharmacy/purchases/:id/send` | Mark sent to vendor | Transitions to `SENT_TO_SUPPLIER` |
| `POST` | `/api/v1/pharmacy/purchases/:id/reject` | Reject Purchase Order | Requires audit justification |
| `POST` | `/api/v1/pharmacy/purchases/:id/cancel` | Cancel Purchase Order | Reverses pending inbound stock |

---

## 6. Frontend Purchase Order Portal

- **PO Dashboard (`/pharmacy/purchases`):** Real-time status breakdown, quick filters for actionable orders (`PENDING_APPROVAL`, `SENT_TO_SUPPLIER`).
- **Order Form Wizard (`/pharmacy/purchases/new`):** Dynamic line-item manager, interactive supplier selector, instant catalog autocomplete, and automated MOQ and pricing validation.
- **Order Management & Detail (`/pharmacy/purchases/[id]`):** Approval workflow controls, status transitions, printable PDF PO generation, and links to Goods Receiving.


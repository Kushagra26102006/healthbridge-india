# HealthBridge India — Pharmacy Profile, Licensing & Settings Architecture

## 1. Overview & Regulatory Context

The Pharmacy Profile and Settings module is the operational and statutory core of HealthBridge India's pharmacy subsystem. In accordance with the **Drugs and Cosmetics Act, 1940**, the **Drugs and Cosmetics Rules, 1945**, and the **National Digital Health Mission (NDHM / ABDM)** guidelines, any retail or hospital dispensary processing clinical prescriptions must maintain verified statutory licensing credentials and unambiguous operational schedules.

This subsystem manages:
1. **Statutory Licensing & Business Identity:** Drug License Forms 20 and 21, GSTIN, Pharmacist Registration Numbers, and verifiable documentation.
2. **Strict Zero Self-Approval Invariant:** Enforced server-side immutability preventing pharmacy administrators from manually approving their own statutory verification status.
3. **Dynamic Operating Hours Engine:** 7-day schedule with split shift breaks, national and local holiday calendars, temporary closure controls, and real-time open/closed status computation in Indian Standard Time (`Asia/Kolkata`).
4. **Clinical Service Parameters:** Granular enablement of Schedule H/X dispensing, chronic refill management, compounding, emergency prescription processing, and hyperlocal delivery boundaries.

---

## 2. Profile & Licensing Schema

The pharmacy profile is persisted in `PharmacyProfileModel` (`apps/api/src/modules/users/models/pharmacy-profile.model.ts`) with strict tenant association to the root `UserModel`:

```typescript
export interface IPharmacyProfile extends Document {
  userId: Types.ObjectId;
  pharmacyName: string;
  pharmacyLicenseNumber: string; // Form 20 / Form 21 Drug License
  registrationNumber?: string;
  licenseIssueDate?: Date;
  licenseExpiryDate?: Date;
  gstNumber?: string;
  pharmacistInCharge: {
    name: string;
    registrationNumber: string;
    statePharmacyCouncil: string;
    contactPhone?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  email?: string;
  websiteUrl?: string;
  timezone: string; // Default: 'Asia/Kolkata'
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentSubmissionStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  documents: IPharmacyDocument[];
  operatingHoursSchedule: IDayOperatingSchedule[];
  temporaryClosure?: ITemporaryClosure;
  holidays: IHoliday[];
  serviceSettings: IPharmacyServices;
}
```

### Statutory Documents Sub-Schema
```typescript
export interface IPharmacyDocument {
  documentId: string;
  documentType: 'DRUG_LICENSE' | 'GST_CERTIFICATE' | 'PHARMACIST_REGISTRATION' | 'ESTABLISHMENT_LICENSE' | 'OTHER';
  documentNumber: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}
```

---

## 3. Strict Zero Self-Approval Invariant

### The Security Problem
In multi-tenant healthcare SaaS architectures, a standard user profile update endpoint (`PATCH /api/v1/pharmacy/profile`) can be exploited if an attacker passes `{ "verificationStatus": "VERIFIED" }` or `{ "documentSubmissionStatus": "VERIFIED" }` in the payload. If the update handler blindly applies `Object.assign` or allows Mongoose to persist unchecked attributes, unverified pharmacies can dispense restricted Schedule H/X medications without state drug controller validation.

### Enforced Defense-in-Depth Implementation
1. **Schema Recognition:** The Zod validation schema recognizes `verificationStatus` and `documentSubmissionStatus` as forbidden mutation targets:
   ```typescript
   export const updatePharmacyProfileSchema = z.object({
     pharmacyName: z.string().min(2).max(100).optional(),
     phone: z.string().regex(/^[0-9+\s-]{8,20}$/).optional(),
     // Tamper-detection fields
     verificationStatus: z.any().optional(),
     documentSubmissionStatus: z.any().optional(),
     ...
   });
   ```
2. **Service-Level Defense:** If any mutation payload contains these fields, the service immediately throws `403 Forbidden`:
   ```typescript
   if ((dto as any).verificationStatus !== undefined || (dto as any).documentSubmissionStatus !== undefined) {
     throw AppError.forbidden('Self-approval or manual tampering with statutory verification status is strictly prohibited');
   }
   ```
3. **Statutory Document Workflow:** Uploading a new statutory document automatically transitions `documentSubmissionStatus` to `SUBMITTED`, triggering an internal compliance review queue. Only platform compliance officers can grant `VERIFIED` status.

---

## 4. Operating Hours Engine & Timezone Mechanics

### Timezone Strategy
All date and time calculations are explicitly pinned to Indian Standard Time (`Asia/Kolkata`, UTC+05:30) using `Intl.DateTimeFormat`. This prevents discrepancy when backend nodes run in UTC on cloud container platforms.

### Real-Time Status Computation Algorithm (`computeIsOpenNow`)
When querying `GET /api/v1/pharmacy/settings/operating-hours`, the backend executes the following multi-stage check:
1. **Temporary Closure Check:** If `temporaryClosure.isTemporarilyClosed` is `true`, check if the current instant falls between `temporaryClosure.startDate` and `temporaryClosure.endDate`. If within range, return `isOpenNow: false` with the custom closure reason.
2. **Holiday Check:** Match the current calendar date (`YYYY-MM-DD`) against the `holidays` array. If matched, return `isOpenNow: false` with the holiday name.
3. **Weekly Schedule Check:** Determine the current day of the week in `Asia/Kolkata` (`MONDAY` through `SUNDAY`). Look up the schedule for that day:
   - If `isOpen === false`, return `isOpenNow: false`.
   - If `is24Hours === true`, proceed to break check.
   - Otherwise, verify that current time `HH:mm` is between `openTime` and `closeTime`.
4. **Shift Break Intervals Check:** Iterate through configured `breaks` (e.g., afternoon disinfection or lunch). If current time `HH:mm` falls inside any break window `[startTime, endTime]`, return `isOpenNow: false` with `activeBreakName`.
5. **Open:** If all checks pass, return `isOpenNow: true`.

---

## 5. Clinical Service Capabilities

The pharmacy service settings model defines dispensary capabilities that feed into patient and doctor search filters:

| Field | Type | Default | Description |
|---|---|---|---|
| `dispensingEnabled` | `boolean` | `true` | Master switch for prescription dispensing operations |
| `inStorePickupEnabled` | `boolean` | `true` | Enables counter pickup fulfillment workflows |
| `deliveryReady` | `boolean` | `false` | Enables home delivery order creation and rider assignment |
| `emergencyPrescriptionSupport`| `boolean`| `false` | Flagged for 24/7 or high-priority emergency prescriptions |
| `scheduleHDispensingEnabled` | `boolean` | `true` | Permitted to dispense prescription-only Schedule H drugs |
| `scheduleXDispensingEnabled` | `boolean` | `false` | Permitted to dispense Schedule X narcotics (strict audit) |
| `chronicRefillProgramEnabled`| `boolean` | `true` | Participates in automated chronic medication renewal |
| `homeDeliveryRadiusKm` | `number` | `5` | Maximum delivery distance from facility postal coordinates |
| `minimumOrderValueForDelivery`| `number` | `200` | Minimum basket total (INR) required for delivery |
| `deliveryFee` | `number` | `30` | Flat fee (INR) applied to delivery orders |
| `freeDeliveryAbove` | `number` | `500` | Threshold (INR) above which delivery fee is waived |
| `estimatedPickupReadyMinutes` | `number` | `30` | Default prep time communicated to patients |

---

## 6. Frontend Settings Hub Architecture

The frontend settings interface is organized into modular routes located in `apps/web/src/app/(dashboard)/pharmacy/settings/`:
- `/pharmacy/settings`: Central navigation grid with direct links to all configuration sections.
- `/pharmacy/settings/general`: Trading name, telephone, emergency contact, physical address coordinates.
- `/pharmacy/settings/business`: Drug license (Forms 20/21), GSTIN, pharmacist-in-charge details, document repository.
- `/pharmacy/settings/operating-hours`: Visual 7-day schedule editor, split shift breaks, holiday closures, temporary blackout periods.
- `/pharmacy/settings/services`: Toggles for clinical capabilities, delivery parameters, refill programs.
- `/pharmacy/settings/staff`: Multi-role staff roster with invitation and permission management.
- `/pharmacy/settings/security`: Master password change with live regex strength checklist.
- `/pharmacy/settings/sessions`: Active JWT/refresh sessions table with instant device revocation.
- `/pharmacy/settings/notifications`: Channel preferences (SMS, Email, In-App, WhatsApp) for 14 operational event types.


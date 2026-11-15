# HealthBridge India — Pharmacy Access Control & Security Architecture

## 1. Executive Summary

The HealthBridge India security architecture implements strict defense-in-depth principles across authentication, authorization, session persistence, and tenant isolation. In compliance with the **Digital Personal Data Protection Act (DPDP), 2023** and **ABDM Security Guidelines**, clinical health data, prescription dispensing records, and statutory licensing information are isolated through multi-tier architectural boundaries.

---

## 2. Multi-Tier Authentication & RBAC

All pharmacy endpoints under `/api/v1/pharmacy/*` are guarded by an authentication and authorization pipeline:

```mermaid
flowchart LR
    A[Client Request] --> B[authenticate middleware]
    B -->|Validate JWT| C[authorize(Role.PHARMACY)]
    C -->|Check Role| D[resolvePharmacyProfile]
    D -->|Inject req.pharmacy| E[Pharmacy Controller]
    B -->|Expired/Invalid Token| F[401 Unauthorized]
    C -->|Role != PHARMACY| G[403 Forbidden]
    D -->|No Profile Found| H[404 Not Found]
```

### 1. Token Verification (`authenticate`)
Validates the asymmetric or HMAC-signed JWT access token in the `Authorization: Bearer <token>` header. Extracts user claims (`userId`, `role`, `email`).

### 2. Role Enforcement (`authorize(Role.PHARMACY)`)
Ensures that only users registered with the `PHARMACY` system role can access pharmacy-scoped endpoints. Other roles (e.g., `PATIENT`, `DOCTOR`, `LAB_TECHNICIAN`) are immediately blocked with `403 Forbidden`.

### 3. Profile Injection (`resolvePharmacyProfile`)
Resolves the `PharmacyProfileModel` document associated with `req.user.id`. The resulting profile document is bound to `req.pharmacy`, providing guaranteed tenant context for downstream database operations.

---

## 3. Cross-Pharmacy Tenant Isolation

A critical vulnerability in multi-tenant SaaS platforms is Insecure Direct Object References (IDOR), where an authenticated tenant modifies another tenant's resources by guessing or supplying their ObjectId.

HealthBridge India enforces strict multi-tenant isolation at the database layer:
1. **Implicit Scoping:** Every resource model (`PharmacyInventoryModel`, `PharmacyStaffModel`, `SupplierModel`, `PurchaseOrderModel`, `DispensingRecordModel`, `PharmacyOrderModel`) includes an indexed `pharmacyId: Types.ObjectId` reference.
2. **Explicit Query Filter:** Service methods never query by document ID alone. All lookups require both `_id` and `pharmacyId`:
   ```typescript
   const staff = await PharmacyStaffModel.findOne({
     _id: staffId,
     pharmacyId: pharmacy._id,
   });
   if (!staff) {
     throw AppError.notFound('Staff member not found');
   }
   ```
3. **Information Disclosure Prevention:** If Pharmacy B attempts to read or mutate a resource belonging to Pharmacy A, the system responds with `404 Not Found` rather than `403 Forbidden`, preventing resource enumeration attacks.

---

## 4. Session Management & Token Revocation

Dispensary workstations in retail and hospital environments are frequently shared among rotating staff members. HealthBridge India provides active session oversight and rapid revocation mechanics.

### Active Session Model (`RefreshTokenModel`)
Every login creates a tracked session record:
```typescript
{
  userId: Types.ObjectId,
  token: string, // Hashed refresh token
  device: string, // Parsed from User-Agent (e.g. Chrome on macOS)
  ipAddress: string,
  isRevoked: boolean,
  revokedAt?: Date,
  expiresAt: Date,
  createdAt: Date
}
```

### Session Revocation Mechanics
- **Individual Session Revocation (`DELETE /api/v1/pharmacy/sessions/:sessionId`):** Allows an administrator to terminate a specific suspicious or lost device session by setting `isRevoked = true`.
- **Revoke All Other Sessions (`POST /api/v1/pharmacy/sessions/revoke-others`):** Terminates all active sessions for the user except the current active session token.
- **Staff Suspension Cascade:** Suspending or revoking a staff member's record automatically queries `RefreshTokenModel` and revokes all active sessions linked to that staff member's user ID.

---

## 5. Password Security & Cryptographic Policies

The password change endpoint (`POST /api/v1/pharmacy/change-password`) enforces strict security policies:
1. **Verification of Current Password:** Compares the supplied current password against the stored bcrypt hash using `bcrypt.compare`.
2. **Complexity Requirements:** New passwords must meet the following validation criteria:
   - Minimum 8 characters, maximum 100 characters.
   - At least one uppercase letter (`[A-Z]`).
   - At least one lowercase letter (`[a-z]`).
   - At least one numeric digit (`[0-9]`).
   - At least one special symbol (`[!@#$%^&*(),.?":{}|<>]`).
3. **Zero Plaintext Storage:** Passwords are hashed with bcrypt using a salt round cost of 10 prior to persistence.
4. **Post-Change Session Flush:** Upon successful password change, all other refresh tokens for the user are immediately revoked, requiring re-authentication across all other devices.

---

## 6. Immutable Audit Logging

In compliance with Indian pharmacy regulations and NABH accreditation standards, all security-sensitive operations generate an immutable record in `AuditLogModel`:
- Staff invitations, role updates, suspensions, and revocations.
- Statutory document uploads and deletions.
- Operating hours and temporary closure modifications.
- Password updates and session revocations.
- Schedule H/X dispensing transactions.

Each log entry records `userId`, `action`, `resourceType`, `resourceId`, `ipAddress`, `userAgent`, and `timestamp`. Audit logs are append-only and cannot be altered or deleted by pharmacy users.

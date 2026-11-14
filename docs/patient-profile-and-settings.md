# HealthBridge India — Patient Profile & Account Settings Architecture
**Component**: Patient Profile, Security & Account Settings (Day 3 Task 07)  
**Standard**: Ayushman Bharat Digital Mission (ABDM) & Digital Personal Data Protection (DPDP) Act  

---

## 1. Overview & Objectives

The Patient Profile and Account Settings module provides authenticated patients with sovereign oversight of their personal health identity, contact verification statuses, active device sessions, security credentials, and communication preferences.

Key architectural boundaries:
- **Server-Controlled Authorization**: Patients can modify personal demographics (legal name, date of birth, gender, blood group, residential address, emergency contact). Patients **cannot** directly edit their assigned platform roles, account verification flags, or ABHA identity identifiers.
- **Fail-Closed Privacy**: All profile queries and mutations strictly derive patient ownership from verified JWT sessions (`req.user.userId`). Client-supplied IDs are never trusted.
- **Session Security**: Active device sessions are tracked via cryptographically hashed refresh tokens (`RefreshTokenModel`). Individual sessions or all other remote devices can be terminated on demand with immediate invalidation.
- **Zero Simulation / Honest ABHA Integration**: Synthetic government ABHA numbers are never invented; the interface connects with the official NHA ABDM Sandbox framework and displays transparent connection readiness.

---

## 2. Route Specifications

| Route Path | Access Control | Purpose |
| :--- | :--- | :--- |
| `/patient/profile` | `PATIENT` (Private) | Overview of identity, demographics, contact info, ABHA connection status, and profile edit mode. |
| `/patient/settings` | `PATIENT` (Private) | Main settings hub with quick navigation to security, sessions, notifications, privacy, theme, and emergency sign-out. |
| `/patient/settings/security` | `PATIENT` (Private) | Change password with real-time complexity validation and active session status. |
| `/patient/settings/sessions` | `PATIENT` (Private) | Device-level active session inspection (browser, OS, IP address, last active) and remote revocation. |
| `/patient/settings/notifications` | `PATIENT` (Private) | Granular multi-channel preferences (In-app, Email, SMS) for clinical events. |
| `/patient/settings/privacy` | `PATIENT` (Private) | Direct ABDM consent management shortcut, data governance transparency, and DPDP rights. |

---

## 3. Backend API Endpoints

### A. Patient Profile & Demographics
- `GET /api/v1/patients/me` (and alias `GET /api/v1/patients/profile`)
  - **Auth**: Bearer JWT (`PATIENT` role only)
  - **Response**: Full `PatientProfileDto` including demographic fields, contact verification statuses, masked ABHA number, completion readiness score, and preferences.
- `PATCH /api/v1/patients/me` (and alias `PATCH /api/v1/patients/profile`)
  - **Auth**: Bearer JWT (`PATIENT` role only)
  - **Validation**: `updatePatientProfileSchema` (Zod)
  - **Permitted Fields**: `name`, `dateOfBirth`, `gender`, `bloodGroup`, `address`, `emergencyContact`.
  - **Protected Fields**: `role`, `accountStatus`, `emailVerified`, `phoneVerified`, `abhaLinkageStatus` (any client attempt to mutate these is strictly discarded).
  - **Audit**: Writes `PATIENT_PROFILE_UPDATED` event to `AuditLogModel`.

### B. Security & Password Management
- `POST /api/v1/patients/me/change-password` (and alias `POST /api/v1/auth/change-password`)
  - **Auth**: Bearer JWT (Authenticated user)
  - **Validation**: `changePasswordSchema` (min 8 chars, uppercase, lowercase, digit, special character).
  - **Verification**: Verifies `currentPassword` using `bcryptjs.compare`. Blocks re-use of identical password.
  - **Audit**: Writes `PASSWORD_CHANGED` or `PASSWORD_CHANGE_FAILED` event to `AuditLogModel`.

### C. Active Session Management
- `GET /api/v1/auth/sessions` (and alias `GET /api/v1/patients/me/sessions`)
  - **Auth**: Bearer JWT
  - **Response**: Array of `UserSessionItemDto` (`id`, `deviceName`, `ipAddress`, `browser`, `os`, `lastActive`, `isCurrent`, `expiresAt`).
  - **Security**: Raw `tokenHash` is never exposed.
- `DELETE /api/v1/auth/sessions/:sessionId` (and alias `DELETE /api/v1/patients/me/sessions/:sessionId`)
  - **Auth**: Bearer JWT
  - **Action**: Marks `revokedAt = new Date()` on matching session owned by `req.user.userId`.
  - **Audit**: Writes `SESSION_REVOKED` event to `AuditLogModel`.
- `POST /api/v1/auth/logout-others` (and alias `POST /api/v1/patients/me/sessions/revoke-others`)
  - **Auth**: Bearer JWT
  - **Action**: Marks all other refresh tokens for the user as revoked except the active token.

### D. Notification Preferences
- `GET /api/v1/patients/me/notification-preferences`
  - **Auth**: Bearer JWT (`PATIENT` role only)
  - **Response**: Categories: `appointmentUpdates`, `prescriptionUpdates`, `labReportAlerts`, `consentRequests`, `securityAlerts`.
- `PATCH /api/v1/patients/me/notification-preferences`
  - **Auth**: Bearer JWT (`PATIENT` role only)
  - **Validation**: `updateNotificationPreferencesSchema`
  - **Enforcement**: Mandatory security alerts (`email: true`, `inApp: true`) cannot be turned off.

---

## 4. Frontend Component Hierarchy

```
apps/web/src/components/patient/
├── profile/
│   ├── PatientProfileHeader.tsx      # Avatar, legal name, role badge, profile completion bar
│   ├── PersonalInformationCard.tsx   # Read-only demographic & address overview
│   ├── EditProfileForm.tsx           # Controlled editing with Zod validation
│   ├── ContactInformationCard.tsx    # Email/Phone verification status & resend trigger
│   ├── ABHAProfileCard.tsx           # ABDM Health Account credentials & honest sandbox notice
│   ├── AccountStatusCard.tsx         # Account verification checklist & readiness score
│   └── index.ts                      # Barrel export
└── settings/
    ├── SettingsNav.tsx               # Section navigation tabs
    ├── SecuritySettings.tsx          # Password update & session summary container
    ├── ChangePasswordForm.tsx        # Dynamic strength calculation with 5 requirement checks
    ├── ActiveSessions.tsx            # Device listing, remote logout, and breach containment
    ├── NotificationPreferences.tsx   # Per-category multi-channel toggles
    ├── PrivacySettings.tsx           # ABDM consent manager link & DPDP data policy
    └── index.ts                      # Barrel export
```

---

## 5. Security & Verification Audit

1. **Role Tampering Prevention**:
   Attempting to pass `{ role: 'ADMIN' }` in `PATCH /api/v1/patients/me` is stripped by Zod validation and ignored by the service; role remains `PATIENT`.
2. **Account Status Isolation**:
   Patients cannot unilaterally mark themselves `emailVerified: true` or `accountStatus: 'ACTIVE'`.
3. **IDOR Defense**:
   A patient cannot fetch or edit another patient's profile; all operations strictly derive the target user from `req.user.userId`.
4. **Mandatory Security Notifications**:
   Critical security alerts cannot be suppressed through notification preference updates.

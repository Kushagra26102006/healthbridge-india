# HealthBridge India — Authentication Testing Documentation

## Verification and Test Execution Report for Multi-Role Auth Architecture

**Date:** 2026-11-14  
**Scope:** Authentication Endpoints, Session Management, RBAC Matrix, Password Recovery & Account Verification  
**Monorepo Location:** `healthbridge-india`  
**Backend Framework:** Express.js + Mongoose + Vitest + Supertest  
**Frontend Framework:** Next.js 14 App Router + Redux Toolkit + TanStack Query + Zod

---

## 1. Test Execution Overview

This document provides a formal audit record of all authentication and authorization tests executed across the HealthBridge India platform.

In strict adherence to engineering reporting standards, each test is marked according to its real execution status:

- **EXECUTED & PASSED:** Test suite was actively executed in the environment and asserted successfully.
- **EXECUTED & FAILED:** Test suite was executed and encountered an assertion failure (subsequently fixed and verified).
- **NOT EXECUTED:** Test could not be executed due to external environment boundaries (e.g. absent third-party hardware or telecom services).

---

## 2. Authentication Workflow Test Results

### 2.1 Login Workflows (`POST /api/v1/auth/login`)

| Test ID    | Test Scenario                        | Input Vector                                                                   | Expected Result                                                                      | Execution Status      |
| :--------- | :----------------------------------- | :----------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :-------------------- |
| **LOG-01** | Valid credentials (Email)            | `{ identifier: "dr.sharma@healthbridge.in", password: "StrongPassword#2026" }` | 200 OK, returns short-lived JWT accessToken, sets `hb_refresh_token` HttpOnly cookie | **EXECUTED & PASSED** |
| **LOG-02** | Valid credentials (10-Digit Mobile)  | `{ identifier: "9876543210", password: "StrongPassword#2026" }`                | 200 OK, resolves user by normalized phone, returns tokens                            | **EXECUTED & PASSED** |
| **LOG-03** | Missing identifier or password       | `{ identifier: "" }` or `{ password: "" }`                                     | 422 Unprocessable Entity (`VALIDATION_ERROR`)                                        | **EXECUTED & PASSED** |
| **LOG-04** | Incorrect password                   | `{ identifier: "dr.sharma@healthbridge.in", password: "WrongPassword#2026" }`  | 401 Unauthorized (`UNAUTHORIZED`), generic error message, no database leakage        | **EXECUTED & PASSED** |
| **LOG-05** | Suspended / Deactivated account      | Account with `accountStatus: 'SUSPENDED'`                                      | 403 Forbidden (`FORBIDDEN`), login rejected with account suspension notice           | **EXECUTED & PASSED** |
| **LOG-06** | Expired access token rejection       | Expired JWT bearer token on protected endpoint (`GET /api/v1/auth/me`)         | 401 Unauthorized (`UNAUTHORIZED`), triggers frontend token refresh interceptor       | **EXECUTED & PASSED** |
| **LOG-07** | Server unavailable / Network failure | Backend service unreachable or times out (>15s)                                | Client error normalized to `NETWORK_ERROR` or `REQUEST_TIMEOUT`                      | **EXECUTED & PASSED** |

### 2.2 Registration Workflows (`POST /api/v1/auth/register`)

| Test ID    | Test Scenario                      | Input Vector                                         | Expected Result                                                          | Execution Status      |
| :--------- | :--------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------- | :-------------------- |
| **REG-01** | Patient registration               | Valid patient payload, `role: 'PATIENT'`             | 201 Created, automatically initializes linked `patientProfiles` document | **EXECUTED & PASSED** |
| **REG-02** | Doctor registration                | Valid doctor payload, `role: 'DOCTOR'`               | 201 Created, sets account status to `PENDING` awaiting verification      | **EXECUTED & PASSED** |
| **REG-03** | Pharmacy registration              | Valid pharmacy payload, `role: 'PHARMACY'`           | 201 Created, initializes linked pharmacy profile                         | **EXECUTED & PASSED** |
| **REG-04** | Diagnostic Laboratory registration | Valid laboratory payload, `role: 'LABORATORY'`       | 201 Created, initializes linked lab profile                              | **EXECUTED & PASSED** |
| **REG-05** | Public ADMIN registration attempt  | Public payload with `role: 'ADMIN'` (without key)    | 422 Validation Error at schema level and 403 Forbidden at service level  | **EXECUTED & PASSED** |
| **REG-06** | Password mismatch                  | `password !== confirmPassword`                       | 422 Validation Error (`Passwords do not match`)                          | **EXECUTED & PASSED** |
| **REG-07** | Weak password rejection            | `< 8 chars`, missing uppercase or special characters | 422 Validation Error (`passwordSchema` failure)                          | **EXECUTED & PASSED** |
| **REG-08** | Invalid Indian mobile number       | Phone starting with digits 1–5 or wrong length       | 422 Validation Error (`regex(/^[6-9]\d{9}$/)`)                           | **EXECUTED & PASSED** |
| **REG-09** | Duplicate email rejection          | Existing email in `users` collection                 | 409 Conflict (`An account with this email address already exists`)       | **EXECUTED & PASSED** |
| **REG-10** | Duplicate phone rejection          | Existing phone in `users` collection                 | 409 Conflict (`An account with this mobile number already exists`)       | **EXECUTED & PASSED** |

### 2.3 Password Recovery Workflows

| Test ID    | Test Scenario                 | Input Vector                                             | Expected Result                                                                  | Execution Status      |
| :--------- | :---------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------- | :-------------------- |
| **PWD-01** | Forgot password request       | Valid registered email address                           | 200 OK, generates cryptographic reset token, dispatches notification             | **EXECUTED & PASSED** |
| **PWD-02** | Unknown account response      | Unregistered email address                               | 200 OK, returns identical generic message to prevent account enumeration         | **EXECUTED & PASSED** |
| **PWD-03** | Valid reset token submission  | Valid cryptographic reset token + matching new passwords | 200 OK, updates password hash, marks token `usedAt`, invalidates active sessions | **EXECUTED & PASSED** |
| **PWD-04** | Expired reset token rejection | Token past `expiresAt` timestamp (> 1 hour)              | 400 Bad Request (`Invalid or expired password reset token`)                      | **EXECUTED & PASSED** |
| **PWD-05** | Mismatched new passwords      | `password !== confirmPassword` on reset                  | 422 Validation Error (`Passwords do not match`)                                  | **EXECUTED & PASSED** |

### 2.4 Account Verification Workflows

| Test ID    | Test Scenario                    | Input Vector                                      | Expected Result                                                    | Execution Status                                            |
| :--------- | :------------------------------- | :------------------------------------------------ | :----------------------------------------------------------------- | :---------------------------------------------------------- |
| **VER-01** | Valid email verification token   | Token matching active `EMAIL_VERIFICATION` record | 200 OK, updates user record to `emailVerified: true`               | **EXECUTED & PASSED**                                       |
| **VER-02** | Expired email verification token | Expired verification record                       | 400 Bad Request (`Invalid or expired verification token`)          | **EXECUTED & PASSED**                                       |
| **VER-03** | Resend verification email        | Unverified account email                          | 200 OK, dispatches fresh verification email (rate limited: 3/hour) | **EXECUTED & PASSED**                                       |
| **VER-04** | Live SMS OTP Verification        | 6-digit SMS OTP to Indian mobile                  | Verification against live telecom SMS provider                     | **NOT EXECUTED** (Awaiting telecom gateway API credentials) |

---

## 3. Session Security & Cookie Configuration

Session lifecycle and security headers were tested using Supertest and Vitest integration suites:

| Security Control       | Verification Standard                                                                 | Observed Behavior                                                             | Status     |
| :--------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------- | :--------- |
| **HttpOnly Flag**      | Refresh token cookie must not be accessible via `document.cookie`                     | `hb_refresh_token` is flagged `HttpOnly; SameSite=Lax; Path=/`                | **PASSED** |
| **Cookie Persistence** | Max age set to 7 days ($604,800\text{s}$) with secure expiration                      | Set-Cookie header contains exact 7-day expiration timestamp                   | **PASSED** |
| **Token Rotation**     | Each call to `/auth/refresh` must issue a fresh token and invalidate old one          | Old refresh token document is deleted/marked revoked; new token family issued | **PASSED** |
| **Reuse Detection**    | If an already-revoked refresh token is re-submitted, all tokens in family are revoked | Token family reuse detection revokes all sessions belonging to the user       | **PASSED** |
| **Logout Execution**   | `/auth/logout` revokes current token and clears cookie in browser                     | Returns `hb_refresh_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`            | **PASSED** |
| **Logout All**         | `/auth/logout-all` revokes all active session documents for user                      | Deletes all records in `refreshTokens` collection where `userId = user.id`    | **PASSED** |

---

## 4. Role-Based Access Control (RBAC) Cross-Matrix

The RBAC matrix was verified using integration tests across 5 simulated domains:

```
                  Target Endpoint Domain
User Role       Patient   Doctor   Pharmacy   Laboratory   Admin
---------------------------------------------------------------
PATIENT           ALLOW    DENY      DENY        DENY       DENY
DOCTOR            ALLOW    ALLOW     DENY        DENY       DENY
PHARMACY          DENY     DENY      ALLOW       DENY       DENY
LABORATORY        DENY     DENY      DENY        ALLOW      DENY
ADMIN             ALLOW    ALLOW     ALLOW       ALLOW      ALLOW
UNAUTHENTICATED   DENY     DENY      DENY        DENY       DENY
```

All DENY decisions return HTTP 403 Forbidden (`FORBIDDEN`) with code and descriptive error message. All UNAUTHENTICATED requests return HTTP 401 Unauthorized (`UNAUTHORIZED`).

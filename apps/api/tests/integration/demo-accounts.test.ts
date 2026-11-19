import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { demoRoutes } from '../../src/modules/demo/demo.routes';
import { authRoutes } from '../../src/modules/auth/routes/auth.routes';
import { errorHandler } from '../../src/middleware/error-handler';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { authService } from '../../src/modules/auth/services/auth.service';
import { SYNTHETIC_DEMO_ACCOUNTS_METADATA } from '../../src/modules/demo/demo.controller';
import { SYNTHETIC_DEMO_ACCOUNTS } from '../../src/database/seed-demo-accounts';
import { ErrorCode } from '../../src/shared/errors/error-codes';
import { AppError } from '../../src/shared/errors/app-error';

describe('Synthetic Demo Accounts & Discovery Integration Suite', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use('/api/v1/demo', demoRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Public Demo Accounts Discovery Endpoint (GET /api/v1/demo/accounts)', () => {
    it('returns HTTP 200 with metadata for all 5 synthetic demo accounts', async () => {
      const res = await request(app).get('/api/v1/demo/accounts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accounts');
      expect(Array.isArray(res.body.data.accounts)).toBe(true);
      expect(res.body.data.accounts).toHaveLength(5);
    });

    it('contains all 5 expected healthcare roles with exact emails and dashboards', async () => {
      const res = await request(app).get('/api/v1/demo/accounts');
      const accounts = res.body.data.accounts;

      const roles = accounts.map((a: { role: string }) => a.role);
      expect(roles).toEqual(
        expect.arrayContaining(['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN'])
      );

      const patient = accounts.find((a: { role: string }) => a.role === 'PATIENT');
      expect(patient).toBeDefined();
      expect(patient.email).toBe('patient.demo@healthbridge.local');
      expect(patient.dashboard).toBe('/patient/dashboard');
      expect(patient.name).toBe('Demo Patient');

      const doctor = accounts.find((a: { role: string }) => a.role === 'DOCTOR');
      expect(doctor).toBeDefined();
      expect(doctor.email).toBe('doctor.demo@healthbridge.local');
      expect(doctor.dashboard).toBe('/doctor/dashboard');
      expect(doctor.name).toBe('Dr. Demo Doctor');

      const pharmacy = accounts.find((a: { role: string }) => a.role === 'PHARMACY');
      expect(pharmacy).toBeDefined();
      expect(pharmacy.email).toBe('pharmacy.demo@healthbridge.local');
      expect(pharmacy.dashboard).toBe('/pharmacy/dashboard');

      const lab = accounts.find((a: { role: string }) => a.role === 'LABORATORY');
      expect(lab).toBeDefined();
      expect(lab.email).toBe('lab.demo@healthbridge.local');
      expect(lab.dashboard).toBe('/laboratory/dashboard');

      const admin = accounts.find((a: { role: string }) => a.role === 'ADMIN');
      expect(admin).toBeDefined();
      expect(admin.email).toBe('admin.demo@healthbridge.local');
      expect(admin.dashboard).toBe('/admin/dashboard');
    });

    it('strictly does NOT expose passwords, password hashes, salts, or tokens in the discovery API', async () => {
      const res = await request(app).get('/api/v1/demo/accounts');
      const payloadString = JSON.stringify(res.body);

      // Verify no password fields or hashes leaked
      expect(payloadString).not.toContain('DemoSecure');
      expect(payloadString).not.toContain('$2a$');
      expect(payloadString).not.toContain('$2b$');
      expect(payloadString).not.toContain('passwordHash');
      expect(payloadString).not.toContain('accessToken');
      expect(payloadString).not.toContain('refreshToken');
    });
  });

  describe('2. Synthetic Demo Accounts Seeding Specification', () => {
    it('defines 5 unique synthetic accounts with unique emails and valid 10-digit Indian phone numbers', () => {
      expect(SYNTHETIC_DEMO_ACCOUNTS).toHaveLength(5);

      const emails = SYNTHETIC_DEMO_ACCOUNTS.map((a) => a.email);
      const phones = SYNTHETIC_DEMO_ACCOUNTS.map((a) => a.phone);

      // Verify uniqueness
      expect(new Set(emails).size).toBe(5);
      expect(new Set(phones).size).toBe(5);

      // Verify valid Indian 10-digit format starting with 6-9
      const phoneRegex = /^[6-9]\d{9}$/;
      phones.forEach((phone) => {
        expect(phone).toMatch(phoneRegex);
      });
    });

    it('stores bcrypt-hashed passwords in the database seed, never plaintext', async () => {
      for (const account of SYNTHETIC_DEMO_ACCOUNTS) {
        // Password hash must start with standard bcrypt prefix
        expect(account.defaultPasswordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
        // Verify default demo password compares successfully against the hash
        const isMatch = await bcrypt.compare('DemoSecure#2026', account.defaultPasswordHash);
        expect(isMatch).toBe(true);
      }
    });
  });

  describe('3. Demo Authentication via Email and Mobile Number', () => {
    it('authenticates Patient demo account using email', async () => {
      const mockUser = {
        id: 'patient-demo-id',
        email: 'patient.demo@healthbridge.local',
        name: 'Demo Patient',
        role: 'PATIENT',
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
      };

      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockUser as any,
        profile: { id: 'profile-demo-id', abhaNumber: '91-1111-2222-3333' } as any,
        tokens: {
          accessToken: 'mock-access-token-patient',
          refreshToken: 'mock-refresh-token-patient',
          expiresIn: 900,
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'patient.demo@healthbridge.local',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('PATIENT');
      expect(res.body.data.user.email).toBe('patient.demo@healthbridge.local');
    });

    it('authenticates Doctor demo account using 10-digit mobile number', async () => {
      const mockDoctor = {
        id: 'doctor-demo-id',
        email: 'doctor.demo@healthbridge.local',
        phone: '9876543211',
        name: 'Dr. Demo Doctor',
        role: 'DOCTOR',
        status: 'ACTIVE',
      };

      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockDoctor as any,
        profile: { id: 'doc-profile-id', specialization: 'Internal Medicine' } as any,
        tokens: {
          accessToken: 'mock-access-token-doc',
          refreshToken: 'mock-refresh-token-doc',
          expiresIn: 900,
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: '9876543211',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('DOCTOR');
      expect(res.body.data.user.name).toBe('Dr. Demo Doctor');
    });

    it('authenticates Pharmacy demo account using email', async () => {
      const mockPharmacy = {
        id: 'pharmacy-demo-id',
        email: 'pharmacy.demo@healthbridge.local',
        role: 'PHARMACY',
        name: 'Demo Pharmacy',
        status: 'ACTIVE',
      };

      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockPharmacy as any,
        profile: null,
        tokens: {
          accessToken: 'mock-access-token-pharmacy',
          refreshToken: 'mock-refresh-token-pharmacy',
          expiresIn: 900,
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'pharmacy.demo@healthbridge.local',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('PHARMACY');
    });

    it('authenticates Laboratory demo account using email', async () => {
      const mockLab = {
        id: 'lab-demo-id',
        email: 'lab.demo@healthbridge.local',
        role: 'LABORATORY',
        name: 'Demo Laboratory',
        status: 'ACTIVE',
      };

      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockLab as any,
        profile: null,
        tokens: {
          accessToken: 'mock-access-token-lab',
          refreshToken: 'mock-refresh-token-lab',
          expiresIn: 900,
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'lab.demo@healthbridge.local',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('LABORATORY');
    });

    it('authenticates Admin demo account using email', async () => {
      const mockAdmin = {
        id: 'admin-demo-id',
        email: 'admin.demo@healthbridge.local',
        role: 'ADMIN',
        name: 'Demo Administrator',
        status: 'ACTIVE',
      };

      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockAdmin as any,
        profile: null,
        tokens: {
          accessToken: 'mock-access-token-admin',
          refreshToken: 'mock-refresh-token-admin',
          expiresIn: 900,
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'admin.demo@healthbridge.local',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('ADMIN');
    });
  });

  describe('4. Security Safeguards & Failure Modes', () => {
    it('returns 401 UNAUTHORIZED when incorrect password is provided for a demo account', async () => {
      vi.spyOn(authService, 'login').mockRejectedValueOnce(
        AppError.unauthorized('Invalid email or password')
      );

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'patient.demo@healthbridge.local',
        password: 'WrongPassword#2026',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('returns 403 FORBIDDEN when account is suspended', async () => {
      vi.spyOn(authService, 'login').mockRejectedValueOnce(
        AppError.forbidden('Your account is currently suspended. Please contact support.')
      );

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'doctor.demo@healthbridge.local',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('returns 422 VALIDATION_ERROR when identifier is malformed', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'not-an-email-or-phone',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });
});

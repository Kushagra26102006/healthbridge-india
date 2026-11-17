import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  LaboratoryProfileModel,
  LaboratoryStaffModel,
  LaboratoryDepartmentModel,
  LaboratoryShiftTemplateModel,
  LaboratoryShiftAssignmentModel,
  LaboratoryLeaveRequestModel,
  LaboratoryStaffAvailabilityModel,
  LaboratoryTaskAssignmentModel,
  LaboratoryReportModel,
  LabSampleModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';
import crypto from 'crypto';

function createQueryMock(result: any) {
  const q: any = {
    populate: () => q,
    sort: () => q,
    skip: () => q,
    limit: () => q,
    select: () => q,
    exec: () => Promise.resolve(result),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(result).catch(reject),
  };
  return q;
}

describe('Laboratory Workforce Management, RBAC, Scheduling & Workload (Day 6 Task 06)', () => {
  const app = createApp();

  const labAOwnerUserId = new Types.ObjectId().toString();
  const labBOwnerUserId = new Types.ObjectId().toString();
  const labAProfileId = new Types.ObjectId().toString();
  const labBProfileId = new Types.ObjectId().toString();
  const technicianUserId = new Types.ObjectId().toString();
  const reviewerUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();

  const labAOwnerToken = tokenService.generateAccessToken({
    _id: labAOwnerUserId,
    role: 'LABORATORY',
    email: 'director@central-lims.in',
  } as any);

  const labBOwnerToken = tokenService.generateAccessToken({
    _id: labBOwnerUserId,
    role: 'LABORATORY',
    email: 'metropolis@diagnostic.in',
  } as any);

  const technicianToken = tokenService.generateAccessToken({
    _id: technicianUserId,
    role: 'LABORATORY',
    email: 'tech.sunita@central-lims.in',
  } as any);

  const reviewerToken = tokenService.generateAccessToken({
    _id: reviewerUserId,
    role: 'LABORATORY',
    email: 'dr.anand@central-lims.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.rohit@healthbridge.in',
  } as any);

  const mockUsers: Record<string, any> = {
    [labAOwnerUserId]: {
      _id: new Types.ObjectId(labAOwnerUserId),
      id: labAOwnerUserId,
      name: 'Dr. Vikram Sarabhai (Lab Director)',
      email: 'director@central-lims.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [labBOwnerUserId]: {
      _id: new Types.ObjectId(labBOwnerUserId),
      id: labBOwnerUserId,
      name: 'Dr. Cyrus Poonawalla',
      email: 'metropolis@diagnostic.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [technicianUserId]: {
      _id: new Types.ObjectId(technicianUserId),
      id: technicianUserId,
      name: 'Sunita Sharma (Lab Tech)',
      email: 'tech.sunita@central-lims.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [reviewerUserId]: {
      _id: new Types.ObjectId(reviewerUserId),
      id: reviewerUserId,
      name: 'Dr. Anand Joshi (Pathologist)',
      email: 'dr.anand@central-lims.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
      isSupervisor: true,
    },
    [patientUserId]: {
      _id: new Types.ObjectId(patientUserId),
      id: patientUserId,
      name: 'Rohit Verma',
      email: 'patient.rohit@healthbridge.in',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
    },
  };

  const mockLabProfiles: Record<string, any> = {
    [labAProfileId]: {
      _id: new Types.ObjectId(labAProfileId),
      id: labAProfileId,
      userId: new Types.ObjectId(labAOwnerUserId),
      laboratoryName: 'Central Diagnostic Laboratory & Research Institute',
      facilityName: 'Central Healthcare Hospital',
      facilityType: 'HOSPITAL_LAB',
      contactEmail: 'director@central-lims.in',
      contactPhone: '+91-9876543210',
      address: {
        street: '123 Medical Road',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      supportedDiagnosticServices: ['Hematology', 'Biochemistry', 'Microbiology', 'Pathology'],
      verificationStatus: 'VERIFIED',
      documentSubmissionStatus: 'VERIFIED',
      documents: [],
    },
    [labBProfileId]: {
      _id: new Types.ObjectId(labBProfileId),
      id: labBProfileId,
      userId: new Types.ObjectId(labBOwnerUserId),
      laboratoryName: 'Metropolis Diagnostics Lab B',
      facilityName: 'Metropolis Clinic',
      facilityType: 'STANDALONE_LAB',
      contactEmail: 'metropolis@diagnostic.in',
      contactPhone: '+91-9876543211',
      address: {
        street: '456 Ring Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      supportedDiagnosticServices: ['Biochemistry'],
      verificationStatus: 'VERIFIED',
      documentSubmissionStatus: 'VERIFIED',
      documents: [],
    },
  };

  // In-memory data store for integration tests
  const staffStore: any[] = [];
  const departmentStore: any[] = [];
  const shiftTemplateStore: any[] = [];
  const shiftAssignmentStore: any[] = [];
  const leaveRequestStore: any[] = [];
  const availabilityStore: any[] = [];
  const taskStore: any[] = [];
  const auditStore: any[] = [];

  beforeAll(() => {
    // 1. Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) => {
      const u = mockUsers[id?.toString()];
      return Promise.resolve(u || null) as any;
    });
    vi.spyOn(UserModel, 'findOne').mockImplementation((q: any) => {
      if (q.email) {
        const found = Object.values(mockUsers).find((u) => u.email === q.email);
        return Promise.resolve(found || null) as any;
      }
      return Promise.resolve(null) as any;
    });

    // 2. Mock LaboratoryProfileModel
    vi.spyOn(LaboratoryProfileModel, 'findOne').mockImplementation((q: any) => {
      if (q._id && q.userId) {
        const p = mockLabProfiles[q._id.toString()];
        if (p && p.userId.toString() === q.userId.toString()) return Promise.resolve(p) as any;
        return Promise.resolve(null) as any;
      }
      if (q.userId) {
        const p = Object.values(mockLabProfiles).find(
          (prof) => prof.userId.toString() === q.userId.toString()
        );
        return Promise.resolve(p || null) as any;
      }
      if (q._id) {
        const p = mockLabProfiles[q._id.toString()];
        return Promise.resolve(p || null) as any;
      }
      return Promise.resolve(null) as any;
    });
    vi.spyOn(LaboratoryProfileModel, 'findById').mockImplementation((id: any) => {
      const p = mockLabProfiles[id?.toString()];
      return Promise.resolve(p || null) as any;
    });

    // 3. Mock LaboratoryStaffModel
    vi.spyOn(LaboratoryStaffModel, 'create').mockImplementation((input: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          this.updatedAt = new Date();
          return this;
        },
      };
      staffStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(LaboratoryStaffModel, 'findOne').mockImplementation((q: any) => {
      const found = staffStore.find((s) => {
        if (q._id && s._id.toString() !== q._id.toString()) return false;
        if (q.laboratoryId && s.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.userId && (!s.userId || s.userId.toString() !== q.userId.toString())) return false;
        if (q.email && s.email.toLowerCase() !== q.email.toLowerCase()) return false;
        if (q.employeeId && s.employeeId !== q.employeeId) return false;
        if (q.status) {
          if (typeof q.status === 'object' && q.status.$in) {
            if (!q.status.$in.includes(s.status)) return false;
          } else if (s.status !== q.status) {
            return false;
          }
        }
        if (q.invitationTokenHash && s.invitationTokenHash !== q.invitationTokenHash) return false;
        return true;
      });

      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryStaffModel, 'findById').mockImplementation((id: any) => {
      const s = staffStore.find((x) => x._id.toString() === id?.toString());
      return createQueryMock(s || null);
    });

    vi.spyOn(LaboratoryStaffModel, 'find').mockImplementation((q: any) => {
      const filtered = staffStore.filter((s) => {
        if (q.laboratoryId && s.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.departmentId && (!s.departmentId || s.departmentId.toString() !== q.departmentId.toString())) return false;
        if (q.status && s.status !== q.status) return false;
        if (q.role && s.role !== q.role) return false;
        return true;
      });
      return createQueryMock(filtered);
    });

    vi.spyOn(LaboratoryStaffModel, 'countDocuments').mockImplementation((q: any) => {
      const count = staffStore.filter((s) => {
        if (q.laboratoryId && s.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.departmentId && (!s.departmentId || s.departmentId.toString() !== q.departmentId.toString())) return false;
        if (q.status && s.status !== q.status) return false;
        return true;
      }).length;
      return Promise.resolve(count) as any;
    });

    // 4. Mock LaboratoryDepartmentModel
    vi.spyOn(LaboratoryDepartmentModel, 'create').mockImplementation((input: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          this.updatedAt = new Date();
          return this;
        },
      };
      departmentStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(LaboratoryDepartmentModel, 'findOne').mockImplementation((q: any) => {
      const found = departmentStore.find((d) => {
        if (q._id && d._id.toString() !== q._id.toString()) return false;
        if (q.laboratoryId && d.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.code && d.code !== q.code) return false;
        return true;
      });
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryDepartmentModel, 'find').mockImplementation((q: any) => {
      const filtered = departmentStore.filter((d) => {
        if (q.laboratoryId && d.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        return true;
      });
      return createQueryMock(filtered);
    });

    // 5. Mock LaboratoryShiftTemplateModel & LaboratoryShiftAssignmentModel
    vi.spyOn(LaboratoryShiftTemplateModel, 'create').mockImplementation((input: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          this.updatedAt = new Date();
          return this;
        },
      };
      shiftTemplateStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(LaboratoryShiftTemplateModel, 'findOne').mockImplementation((q: any) => {
      const found = shiftTemplateStore.find((t) => {
        if (q._id && t._id.toString() !== q._id.toString()) return false;
        if (q.laboratoryId && t.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.code && t.code !== q.code) return false;
        return true;
      });
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryShiftTemplateModel, 'find').mockImplementation((q: any) => {
      const filtered = shiftTemplateStore.filter((t) => {
        if (q.laboratoryId && t.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        return true;
      });
      return createQueryMock(filtered);
    });

    vi.spyOn(LaboratoryShiftAssignmentModel, 'create').mockImplementation((input: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          this.updatedAt = new Date();
          return this;
        },
      };
      shiftAssignmentStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(LaboratoryShiftAssignmentModel, 'findOne').mockImplementation((q: any) => {
      const found = shiftAssignmentStore.find((a) => {
        if (q._id && a._id.toString() !== q._id.toString()) return false;
        if (q.laboratoryId && a.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.staffId && a.staffId.toString() !== q.staffId.toString()) return false;
        if (q.date && a.date !== q.date) return false;
        return true;
      });
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryShiftAssignmentModel, 'findById').mockImplementation((id: any) => {
      const found = shiftAssignmentStore.find((a) => a._id.toString() === id?.toString());
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryShiftAssignmentModel, 'find').mockImplementation((q: any) => {
      const filtered = shiftAssignmentStore.filter((a) => {
        if (q.laboratoryId && a.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.staffId && a.staffId.toString() !== q.staffId.toString()) return false;
        return true;
      });
      return createQueryMock(filtered);
    });

    vi.spyOn(LaboratoryShiftAssignmentModel, 'countDocuments').mockImplementation(() => {
      return Promise.resolve(shiftAssignmentStore.length) as any;
    });

    // 6. Mock LaboratoryLeaveRequestModel
    vi.spyOn(LaboratoryLeaveRequestModel, 'create').mockImplementation((input: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          this.updatedAt = new Date();
          return this;
        },
      };
      leaveRequestStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(LaboratoryLeaveRequestModel, 'findOne').mockImplementation((q: any) => {
      const found = leaveRequestStore.find((l) => {
        if (q._id && l._id.toString() !== q._id.toString()) return false;
        if (q.laboratoryId && l.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.staffId && l.staffId.toString() !== q.staffId.toString()) return false;
        if (q.status && l.status !== q.status) return false;
        if (q.startDate?.$lte && l.startDate > q.startDate.$lte) return false;
        if (q.endDate?.$gte && l.endDate < q.endDate.$gte) return false;
        if (typeof q.startDate === 'string' && typeof q.endDate === 'string') {
          if (l.startDate > q.endDate || l.endDate < q.startDate) return false;
        }
        return true;
      });
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryLeaveRequestModel, 'find').mockImplementation((q: any) => {
      const filtered = leaveRequestStore.filter((l) => {
        if (q.laboratoryId && l.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        return true;
      });
      return createQueryMock(filtered);
    });

    vi.spyOn(LaboratoryLeaveRequestModel, 'countDocuments').mockImplementation(() => {
      return Promise.resolve(leaveRequestStore.length) as any;
    });
    vi.spyOn(LaboratoryLeaveRequestModel, 'exists').mockImplementation(() => {
      return Promise.resolve(null) as any;
    });

    // 7. Mock LaboratoryTaskAssignmentModel
    vi.spyOn(LaboratoryTaskAssignmentModel, 'create').mockImplementation((input: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        ...input,
        assignmentHistory: input.assignmentHistory || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          this.updatedAt = new Date();
          return this;
        },
      };
      taskStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(LaboratoryTaskAssignmentModel, 'findOne').mockImplementation((q: any) => {
      const found = taskStore.find((t) => {
        if (q._id && t._id.toString() !== q._id.toString()) return false;
        if (q.laboratoryId && t.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        return true;
      });
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryTaskAssignmentModel, 'findById').mockImplementation((id: any) => {
      const found = taskStore.find((t) => t._id.toString() === id?.toString());
      return createQueryMock(found || null);
    });

    vi.spyOn(LaboratoryTaskAssignmentModel, 'find').mockImplementation((q: any) => {
      const filtered = taskStore.filter((t) => {
        if (q.laboratoryId && t.laboratoryId.toString() !== q.laboratoryId.toString()) return false;
        if (q.taskType && t.taskType !== q.taskType) return false;
        if (q.status && t.status !== q.status) return false;
        return true;
      });
      return createQueryMock(filtered);
    });

    vi.spyOn(LaboratoryTaskAssignmentModel, 'countDocuments').mockImplementation(() => {
      return Promise.resolve(taskStore.length) as any;
    });

    // 8. Mock AuditLogModel
    vi.spyOn(AuditLogModel, 'create').mockImplementation((input: any) => {
      const doc = { _id: new Types.ObjectId(), ...input, timestamp: new Date() };
      auditStore.push(doc);
      return Promise.resolve(doc) as any;
    });

    vi.spyOn(AuditLogModel, 'find').mockImplementation(() => {
      return createQueryMock(auditStore);
    });
    vi.spyOn(AuditLogModel, 'countDocuments').mockImplementation(() => {
      return Promise.resolve(auditStore.length) as any;
    });

    // 9. Other model counts for dashboard
    vi.spyOn(LaboratoryReportModel, 'countDocuments').mockResolvedValue(2 as any);
    vi.spyOn(LabSampleModel, 'countDocuments').mockResolvedValue(5 as any);
  });

  // ===========================================================================
  // 1. STAFF ONBOARDING & SINGLE-USE INVITATION TOKEN SECURITY
  // ===========================================================================
  describe('1. Staff Onboarding & Single-Use Invitation Token Security', () => {
    let rawInvitationToken = '';

    it('allows laboratory administrator to invite a new technician with single-use token', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/staff/invite')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          fullName: 'Sunita Sharma',
          email: 'tech.sunita@central-lims.in',
          phone: '+91-9876500001',
          designation: 'Senior Medical Lab Technician',
          role: 'LAB_TECHNICIAN',
          qualifications: ['B.Sc. MLT', 'DMLT'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('tech.sunita@central-lims.in');
      expect(res.body.data.role).toBe('LAB_TECHNICIAN');
      expect(res.body.data.status).toBe('INVITED');
      expect(res.body.invitationToken).toBeDefined();

      rawInvitationToken = res.body.invitationToken;

      // Verify that database does NOT store the raw token, only SHA-256 hash
      const savedDoc = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');
      expect(savedDoc.invitationTokenHash).toBeDefined();
      expect(savedDoc.invitationTokenHash).not.toBe(rawInvitationToken);
      const expectedHash = crypto.createHash('sha256').update(rawInvitationToken).digest('hex');
      expect(savedDoc.invitationTokenHash).toBe(expectedHash);
    });

    it('rejects duplicate staff invitation for the same email address in the same laboratory', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/staff/invite')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          fullName: 'Sunita Sharma Duplicate',
          email: 'tech.sunita@central-lims.in',
          designation: 'Technician',
          role: 'LAB_TECHNICIAN',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already registered or invited');
    });

    it('allows staff member to accept invitation using valid raw token', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/staff/accept-invite')
        .send({ invitationToken: rawInvitationToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');

      // Verify token hash is purged from record
      const updated = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');
      expect(updated.status).toBe('ACTIVE');
      expect(updated.invitationTokenHash).toBeUndefined();
    });

    it('rejects reusing the single-use invitation token', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/staff/accept-invite')
        .send({ invitationToken: rawInvitationToken });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('invalid, expired, or already used');
    });

    it('rejects expired invitation tokens', async () => {
      // Create an expired invitation
      const expiredRawToken = crypto.randomBytes(32).toString('hex');
      const expiredHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');

      staffStore.push({
        _id: new Types.ObjectId(),
        laboratoryId: new Types.ObjectId(labAProfileId),
        fullName: 'Expired Staff',
        email: 'expired@central-lims.in',
        employeeId: 'LAB-2026-999',
        designation: 'Intern',
        role: 'LAB_TECHNICIAN',
        status: 'INVITED',
        invitationTokenHash: expiredHash,
        invitationExpiresAt: new Date(Date.now() - 100000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () { return this; },
      });

      const res = await request(app)
        .post('/api/v1/laboratory/staff/accept-invite')
        .send({ invitationToken: expiredRawToken });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  // ===========================================================================
  // 2. LABORATORY-SCOPED RBAC & GRANULAR PERMISSIONS
  // ===========================================================================
  describe('2. Laboratory-Scoped RBAC & Granular Permissions', () => {
    it('returns the complete centralized laboratory permission catalogue', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/permissions/catalogue')
        .set('Authorization', `Bearer ${labAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const groups = res.body.data.map((g: any) => g.group);
      expect(groups).toContain('STAFF');
      expect(groups).toContain('ORDERS_SAMPLES');
      expect(groups).toContain('PROCESSING');
      expect(groups).toContain('REPORTS');
      expect(groups).toContain('QUALITY');
      expect(groups).toContain('INSTRUMENTS');
      expect(groups).toContain('INVENTORY');
      expect(groups).toContain('ANALYTICS');
    });

    it('returns role-permission mappings for all 8 laboratory-scoped roles', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/permissions/roles')
        .set('Authorization', `Bearer ${labAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(8);

      const techMapping = res.body.data.find((r: any) => r.role === 'LAB_TECHNICIAN');
      expect(techMapping.permissions).toContain('lab.processing.perform');
      expect(techMapping.permissions).not.toContain('lab.reports.approve');

      const reviewerMapping = res.body.data.find((r: any) => r.role === 'LAB_REVIEWER');
      expect(reviewerMapping.permissions).toContain('lab.reports.approve');
    });

    it('allows updating custom permission overrides for a staff member', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');
      expect(staff).toBeDefined();

      const res = await request(app)
        .put(`/api/v1/laboratory/staff/${staff._id}/permissions`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          allowedPermissions: ['lab.orders.assign'],
          deniedPermissions: ['lab.inventory.consume'],
          reason: 'Promoted to lead accessioner',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.permissions).toContain('lab.orders.assign');
      expect(res.body.data.permissions).not.toContain('lab.inventory.consume');
    });
  });

  // ===========================================================================
  // 3. DEPARTMENT MANAGEMENT
  // ===========================================================================
  describe('3. Department Management', () => {
    let createdDeptId = '';

    it('creates a new laboratory department with unique code', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/departments')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          name: 'Biochemistry & Clinical Chemistry',
          code: 'BIO',
          description: 'Automated clinical chemistry and hormone assays',
          location: 'Building B, 2nd Floor',
          contactExtension: '4021',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Biochemistry & Clinical Chemistry');
      expect(res.body.data.code).toBe('BIO');
      createdDeptId = res.body.data.id;
    });

    it('rejects duplicate department code in the same laboratory', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/departments')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          name: 'Biochemistry Secondary',
          code: 'BIO',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('lists departments with staff and active workload counts', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/departments')
        .set('Authorization', `Bearer ${labAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].code).toBe('BIO');
      expect(res.body.data[0].staffCount).toBeDefined();
    });

    it('assigns an active staff member as Head of Department', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .put(`/api/v1/laboratory/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          headOfDepartmentId: staff._id.toString(),
          location: 'Building B, Room 204',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.headOfDepartmentId).toBe(staff._id.toString());
      expect(res.body.data.location).toBe('Building B, Room 204');
    });
  });

  // ===========================================================================
  // 4. SHIFT SCHEDULING & CONFLICT DETECTION
  // ===========================================================================
  describe('4. Shift Scheduling & Conflict Detection', () => {
    let morningTemplateId = '';
    let nightTemplateId = '';
    let shiftAssignmentId = '';

    it('creates shift templates including daytime and overnight shifts', async () => {
      // Daytime shift
      const res1 = await request(app)
        .post('/api/v1/laboratory/scheduling/shift-templates')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          name: 'General Morning Shift',
          code: 'MORN-1',
          startTime: '07:00',
          endTime: '15:00',
          breakMinutes: 45,
          color: '#10B981',
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.isOvernight).toBe(false);
      morningTemplateId = res1.body.data.id;

      // Overnight shift (22:00 to 06:00)
      const res2 = await request(app)
        .post('/api/v1/laboratory/scheduling/shift-templates')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          name: 'Overnight Emergency Shift',
          code: 'NIGHT-1',
          startTime: '22:00',
          endTime: '06:00',
          breakMinutes: 60,
          color: '#6366F1',
        });
      expect(res2.status).toBe(201);
      expect(res2.body.data.isOvernight).toBe(true);
      nightTemplateId = res2.body.data.id;
    });

    it('assigns a shift to an active staff member', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .post('/api/v1/laboratory/scheduling/shifts')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          staffId: staff._id.toString(),
          shiftTemplateId: morningTemplateId,
          date: '2026-11-20',
          notes: 'Covering morning outpatient sample collection',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.date).toBe('2026-11-20');
      expect(res.body.data.status).toBe('SCHEDULED');
      shiftAssignmentId = res.body.data.id;
    });

    it('prevents overlapping shift assignments for the same staff member on the same date', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .post('/api/v1/laboratory/scheduling/shifts')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          staffId: staff._id.toString(),
          shiftTemplateId: nightTemplateId,
          date: '2026-11-20',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already assigned to a shift');
    });

    it('allows requesting a shift swap with another staff member', async () => {
      // Add second staff member
      const secondStaff = await LaboratoryStaffModel.create({
        laboratoryId: new Types.ObjectId(labAProfileId),
        fullName: 'Amit Kumar',
        email: 'amit.kumar@central-lims.in',
        employeeId: 'LAB-2026-102',
        designation: 'Junior Lab Tech',
        role: 'LAB_TECHNICIAN',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post(`/api/v1/laboratory/scheduling/shifts/${shiftAssignmentId}/swap-request`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          targetStaffId: secondStaff._id.toString(),
          reason: 'Family medical emergency',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SWAP_REQUESTED');
      expect(res.body.data.swapDetails.requestedWithStaffId).toBe(secondStaff._id.toString());
    });

    it('allows laboratory supervisor to review and approve shift swap', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/scheduling/shifts/${shiftAssignmentId}/swap-review`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ approved: true });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SWAPPED');
    });
  });

  // ===========================================================================
  // 5. STAFF AVAILABILITY & LEAVE CONFLICTS
  // ===========================================================================
  describe('5. Staff Availability & Leave Conflicts', () => {
    let leaveRequestId = '';

    it('submits a leave request and calculates affected shifts', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .post('/api/v1/laboratory/scheduling/leave')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          staffId: staff._id.toString(),
          leaveType: 'ANNUAL',
          startDate: '2026-11-25',
          endDate: '2026-11-28',
          reason: 'Annual medical wellness leave',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.startDate).toBe('2026-11-25');
      leaveRequestId = res.body.data.id;
    });

    it('approves leave request and enforces scheduling lockout during leave', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');
      const templates = shiftTemplateStore;

      // Approve leave
      const approveRes = await request(app)
        .put(`/api/v1/laboratory/scheduling/leave/${leaveRequestId}/review`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ status: 'APPROVED' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // Attempt to schedule shift during approved leave window (2026-11-26)
      const shiftRes = await request(app)
        .post('/api/v1/laboratory/scheduling/shifts')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          staffId: staff._id.toString(),
          shiftTemplateId: templates[0]._id.toString(),
          date: '2026-11-26',
        });

      expect(shiftRes.status).toBe(400);
      expect(shiftRes.body.message).toContain('approved ANNUAL leave');
    });
  });

  // ===========================================================================
  // 6. WORKLOAD ALLOCATION ENGINE & REASSIGNMENT
  // ===========================================================================
  describe('6. Workload Allocation Engine & Reassignment', () => {
    let taskId = '';

    it('assigns diagnostic test processing task to eligible staff with required permissions', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .post('/api/v1/laboratory/workload/tasks')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          taskType: 'TEST_PROCESSING',
          title: 'Process Batch CBC Samples on Beckman DxH 900',
          relatedEntityType: 'LabSample',
          relatedEntityId: 'SMP-2026-901',
          assignedStaffId: staff._id.toString(),
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Handle urgently for ICU patient',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.assignmentNumber).toMatch(/^TSK-\d{6}-\d{4}$/);
      expect(res.body.data.status).toBe('ASSIGNED');
      expect(res.body.data.assignmentHistory.length).toBe(1);
      taskId = res.body.data.id;
    });

    it('rejects task assignment if staff member lacks required permission', async () => {
      // Create staff with only view permissions
      const unprivilegedStaff = await LaboratoryStaffModel.create({
        laboratoryId: new Types.ObjectId(labAProfileId),
        fullName: 'Junior Data Clerk',
        email: 'clerk@central-lims.in',
        employeeId: 'LAB-2026-105',
        designation: 'Clerk',
        role: 'LAB_TECHNICIAN',
        deniedPermissions: ['lab.processing.perform'], // Explicitly denied
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/laboratory/workload/tasks')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          taskType: 'TEST_PROCESSING',
          title: 'Run HbA1c HPLC column',
          relatedEntityType: 'LabSample',
          assignedStaffId: unprivilegedStaff._id.toString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('lacks permission');
    });

    it('reassigns task to another eligible technician and logs historical audit record', async () => {
      const amit = staffStore.find((s) => s.email === 'amit.kumar@central-lims.in');

      const res = await request(app)
        .put(`/api/v1/laboratory/workload/tasks/${taskId}/reassign`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          newStaffId: amit._id.toString(),
          reason: 'Technician reassigned to emergency trauma room',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedStaffId).toBe(amit._id.toString());
      expect(res.body.data.assignmentHistory.length).toBe(2);
      expect(res.body.data.assignmentHistory[1].action).toBe('REASSIGNED');
      expect(res.body.data.assignmentHistory[1].note).toContain('trauma room');
    });

    it('updates task lifecycle to BLOCKED when instrument/QC is unavailable', async () => {
      const res = await request(app)
        .put(`/api/v1/laboratory/workload/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          status: 'BLOCKED',
          blockedReason: 'Instrument hematology analyzer awaiting Level 2 QC clearance',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('BLOCKED');
      expect(res.body.data.blockedReason).toContain('awaiting Level 2 QC');
    });

    it('completes task and logs completion notes', async () => {
      const res = await request(app)
        .put(`/api/v1/laboratory/workload/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          status: 'COMPLETED',
          notes: 'Completed 20 CBC samples with verified Westgard rules',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completionNotes).toContain('20 CBC samples');
    });
  });

  // ===========================================================================
  // 7. WORKLOAD DASHBOARD & ACTIVITY AUDIT
  // ===========================================================================
  describe('7. Workload Dashboard & Activity Audit', () => {
    it('calculates workload dashboard metrics directly from persisted database records', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/workload/dashboard')
        .set('Authorization', `Bearer ${labAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalTasks).toBeGreaterThanOrEqual(1);
      expect(res.body.data.activeStaffCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.staffWorkloadDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.departmentWorkloadDistribution)).toBe(true);
    });

    it('retrieves immutable activity audit logs for a staff member', async () => {
      const staff = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .get(`/api/v1/laboratory/staff/${staff._id}/activity`)
        .set('Authorization', `Bearer ${labAOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activities).toBeDefined();
    });
  });

  // ===========================================================================
  // 8. SECURITY & CROSS-LABORATORY ISOLATION
  // ===========================================================================
  describe('8. Security & Cross-Laboratory Isolation', () => {
    it('blocks non-laboratory roles (e.g. PATIENT) with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/staff')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('lacks permissions');
    });

    it('denies cross-laboratory access: Laboratory B cannot access Laboratory A staff details', async () => {
      const staffA = staffStore.find((s) => s.email === 'tech.sunita@central-lims.in');

      const res = await request(app)
        .get(`/api/v1/laboratory/staff/${staffA._id}`)
        .set('Authorization', `Bearer ${labBOwnerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });
});

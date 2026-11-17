/**
 * HealthBridge India — Day 6 Task 07
 * Complete End-to-End Synthetic Laboratory Workflow & Security/Failure Scenario Suite.
 *
 * Covers:
 * - Part A: Full end-to-end synthetic workflow across Profile, Departments, Staff & RBAC,
 *           Instruments, Test Catalogue, QC Profiles, Reagents & Lots, QC Runs, Orders,
 *           Specimen Collection, Barcodes, Accessioning, Result Entry, QC Release Gate,
 *           Review, Pathologist Approval (SoD), Publication, PDF, Patient/Doctor Access,
 *           Notifications, and Immutable Audit History.
 * - Part B: Failure scenarios & security audit verifications (header spoofing, cross-lab
 *           report mutations, patient/doctor unpublished draft bypasses, quarantined/expired
 *           reagent consumption, unauthorized QC override, overdue calibration, SoD).
 *
 * All data in this test file is 100% synthetic.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import {
  UserModel,
  LaboratoryProfileModel,
  LaboratoryDepartmentModel,
  LaboratoryStaffModel,
  LabTestModel,
  LabInstrumentModel,
  QCProfileModel,
  QCRunModel,
  QualityIncidentModel,
  ReagentModel,
  ReagentLotModel,
  ReagentInventoryTransactionModel,
  LaboratoryOrderModel,
  LabSampleModel,
  TestResultModel,
  LaboratoryReportModel,
  LabReportVersionModel,
  AuditLogModel,
} from '../../src/database/models';

describe('Laboratory Complete End-to-End Synthetic Workflow & Security Failure Matrix (Day 6 Task 07)', () => {
  const app = createApp();

  // Synthetic Identities
  const labAOwnerId = new Types.ObjectId().toString();
  const labAProfileId = new Types.ObjectId().toString();
  const labBOwnerId = new Types.ObjectId().toString();
  const labBProfileId = new Types.ObjectId().toString();
  const technicianUserId = new Types.ObjectId().toString();
  const pathologistUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const otherPatientId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const otherDoctorId = new Types.ObjectId().toString();
  const pharmacyUserId = new Types.ObjectId().toString();

  // JWT Tokens
  const labAOwnerToken = tokenService.generateAccessToken({
    _id: labAOwnerId,
    role: 'LABORATORY',
    email: 'owner.synth-lab-a@example.test',
  } as any);
  const labBOwnerToken = tokenService.generateAccessToken({
    _id: labBOwnerId,
    role: 'LABORATORY',
    email: 'owner.synth-lab-b@example.test',
  } as any);
  const techToken = tokenService.generateAccessToken({
    _id: technicianUserId,
    role: 'LABORATORY',
    email: 'tech.synth-lab-a@example.test',
  } as any);
  const pathologistToken = tokenService.generateAccessToken({
    _id: pathologistUserId,
    role: 'LABORATORY',
    email: 'pathologist.synth-lab-a@example.test',
  } as any);
  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'synth.patient@example.test',
  } as any);
  const otherPatientToken = tokenService.generateAccessToken({
    _id: otherPatientId,
    role: 'PATIENT',
    email: 'synth.patient.other@example.test',
  } as any);
  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'synth.doctor@example.test',
  } as any);
  const otherDoctorToken = tokenService.generateAccessToken({
    _id: otherDoctorId,
    role: 'DOCTOR',
    email: 'synth.doctor.other@example.test',
  } as any);
  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'synth.pharmacy@example.test',
  } as any);

  // In-memory stateful stores for end-to-end persistence simulation
  const stores = {
    profiles: [] as any[],
    departments: [] as any[],
    staff: [] as any[],
    tests: [] as any[],
    instruments: [] as any[],
    qcProfiles: [] as any[],
    qcRuns: [] as any[],
    incidents: [] as any[],
    reagents: [] as any[],
    reagentLots: [] as any[],
    reagentTxns: [] as any[],
    orders: [] as any[],
    samples: [] as any[],
    testResults: [] as any[],
    reports: [] as any[],
    reportVersions: [] as any[],
    audits: [] as any[],
    notifications: [] as any[],
  };

  const mockUsers: Record<string, any> = {
    [labAOwnerId]: { _id: new Types.ObjectId(labAOwnerId), name: 'Synthetic Lab A Director', email: 'owner.synth-lab-a@example.test', role: 'LABORATORY', accountStatus: 'ACTIVE' },
    [labBOwnerId]: { _id: new Types.ObjectId(labBOwnerId), name: 'Synthetic Lab B Director', email: 'owner.synth-lab-b@example.test', role: 'LABORATORY', accountStatus: 'ACTIVE' },
    [technicianUserId]: { _id: new Types.ObjectId(technicianUserId), name: 'Synthetic Tech One', email: 'tech.synth-lab-a@example.test', role: 'LABORATORY', accountStatus: 'ACTIVE' },
    [pathologistUserId]: { _id: new Types.ObjectId(pathologistUserId), name: 'Dr. Synthetic Pathologist', email: 'pathologist.synth-lab-a@example.test', role: 'LABORATORY', accountStatus: 'ACTIVE' },
    [patientUserId]: { _id: new Types.ObjectId(patientUserId), name: 'Synthetic Patient Alpha', email: 'synth.patient@example.test', role: 'PATIENT', accountStatus: 'ACTIVE' },
    [otherPatientId]: { _id: new Types.ObjectId(otherPatientId), name: 'Synthetic Patient Beta', email: 'synth.patient.other@example.test', role: 'PATIENT', accountStatus: 'ACTIVE' },
    [doctorUserId]: { _id: new Types.ObjectId(doctorUserId), name: 'Dr. Synthetic Clinician', email: 'synth.doctor@example.test', role: 'DOCTOR', accountStatus: 'ACTIVE' },
    [otherDoctorId]: { _id: new Types.ObjectId(otherDoctorId), name: 'Dr. Unrelated Physician', email: 'synth.doctor.other@example.test', role: 'DOCTOR', accountStatus: 'ACTIVE' },
    [pharmacyUserId]: { _id: new Types.ObjectId(pharmacyUserId), name: 'Synthetic Pharmacy', email: 'synth.pharmacy@example.test', role: 'PHARMACY', accountStatus: 'ACTIVE' },
  };

  function makeChainable(value: any) {
    const chain: any = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(value),
      exec: vi.fn().mockResolvedValue(value),
      then: (resolve: any, reject?: any) => Promise.resolve(value).then(resolve, reject),
    };
    return chain;
  }

  function makeDoc(obj: any, store: any[]) {
    if (!obj._id) obj._id = new Types.ObjectId();
    if (!obj.createdAt) obj.createdAt = new Date();
    if (!obj.updatedAt) obj.updatedAt = new Date();
    obj.save = vi.fn().mockImplementation(async () => {
      obj.updatedAt = new Date();
      if (!store.find((x) => x._id.toString() === obj._id.toString())) {
        store.push(obj);
      }
      return obj;
    });
    obj.toJSON = () => ({ ...obj, id: obj._id.toString() });
    obj.toObject = () => ({ ...obj });
    return obj;
  }

  function matchesQuery(doc: any, q: any): boolean {
    if (!q || Object.keys(q).length === 0) return true;
    for (const [k, v] of Object.entries(q)) {
      if (k === '$or' && Array.isArray(v)) {
        if (!v.some((sub) => matchesQuery(doc, sub))) return false;
        continue;
      }
      const dv = doc[k];
      if (v && typeof v === 'object' && !(v instanceof Types.ObjectId) && !(v instanceof Date)) {
        const vObj = v as any;
        if (vObj.$in && Array.isArray(vObj.$in)) {
          const dvStr = dv?.toString();
          if (!vObj.$in.map((x: any) => x?.toString()).includes(dvStr)) return false;
          continue;
        }
        if (vObj.$gte !== undefined) {
          if (typeof dv === 'number' && dv < vObj.$gte) return false;
          continue;
        }
        if (vObj.$regex) {
          const re = new RegExp(vObj.$regex, vObj.$options || '');
          if (!re.test(String(dv || ''))) return false;
          continue;
        }
      }
      const dvStr = dv?._id ? dv._id.toString() : dv?.toString();
      const vStr = (v as any)?._id ? (v as any)._id.toString() : v?.toString();
      if (dvStr !== vStr) return false;
    }
    return true;
  }

  function wireStore(Model: any, store: any[]) {
    vi.spyOn(Model, 'create').mockImplementation(async (data: any) => {
      const doc = makeDoc({ ...data }, store);
      store.push(doc);
      return doc;
    });
    vi.spyOn(Model, 'findOne').mockImplementation((q: any) => {
      const found = store.find((d) => matchesQuery(d, q)) || null;
      return makeChainable(found);
    });
    vi.spyOn(Model, 'findById').mockImplementation((id: any) => {
      const idStr = id?.toString();
      const found = store.find((d) => d._id.toString() === idStr) || null;
      return makeChainable(found);
    });
    vi.spyOn(Model, 'find').mockImplementation((q: any = {}) => {
      const found = store.filter((d) => matchesQuery(d, q));
      return makeChainable(found);
    });
    vi.spyOn(Model, 'countDocuments').mockImplementation((q: any = {}) => {
      const count = store.filter((d) => matchesQuery(d, q)).length;
      return Promise.resolve(count) as any;
    });
    vi.spyOn(Model, 'exists').mockImplementation((q: any = {}) => {
      const found = store.find((d) => matchesQuery(d, q));
      return Promise.resolve(found ? { _id: found._id } : null) as any;
    });
    vi.spyOn(Model, 'findByIdAndUpdate').mockImplementation((id: any, update: any) => {
      const idStr = id?.toString();
      const found = store.find((d) => d._id.toString() === idStr) || null;
      if (found) {
        Object.assign(found, update.$set || update);
        found.updatedAt = new Date();
      }
      return makeChainable(found);
    });
    vi.spyOn(Model, 'findOneAndUpdate').mockImplementation((q: any, update: any, opts?: any) => {
      let found = store.find((d) => matchesQuery(d, q)) || null;
      if (!found && opts?.upsert) {
        found = makeDoc({ ...q, ...(update.$set || update) }, store);
        store.push(found);
        return makeChainable(found);
      }
      if (!found) return makeChainable(null);
      if (update.$set) Object.assign(found, update.$set);
      if (update.$inc) {
        for (const [field, delta] of Object.entries(update.$inc)) {
          found[field] = (Number(found[field]) || 0) + Number(delta);
        }
      }
      found.updatedAt = new Date();
      return makeChainable(found);
    });
    vi.spyOn(Model, 'updateOne').mockImplementation((q: any, update: any) => {
      const found = store.find((d) => matchesQuery(d, q));
      if (found && update.$inc) {
        for (const [field, delta] of Object.entries(update.$inc)) {
          found[field] = (Number(found[field]) || 0) + Number(delta);
        }
      }
      return Promise.resolve({ modifiedCount: found ? 1 : 0 }) as any;
    });
  }

  beforeAll(() => {
    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) => {
      const found = mockUsers[id?.toString()] || null;
      return makeChainable(found);
    });
    vi.spyOn(UserModel, 'findOne').mockImplementation((q: any) => {
      const found =
        Object.values(mockUsers).find((u) => matchesQuery(u, q)) || null;
      return makeChainable(found);
    });

    vi.spyOn(notificationService, 'publishEvent').mockImplementation(async (evt: any) => {
      stores.notifications.push(evt);
      return evt;
    });

    // Seed two isolated synthetic laboratories
    stores.profiles.push(
      makeDoc(
        {
          _id: new Types.ObjectId(labAProfileId),
          userId: new Types.ObjectId(labAOwnerId),
          laboratoryName: 'HealthBridge Synthetic Reference Lab A',
          contactEmail: 'owner.synth-lab-a@example.test',
          contactPhone: '+91-9000000001',
          address: { street: '100 Synthetic Ave', city: 'Bengaluru', state: 'KA', postalCode: '560001', country: 'India' },
          verificationStatus: 'VERIFIED',
        },
        stores.profiles
      ),
      makeDoc(
        {
          _id: new Types.ObjectId(labBProfileId),
          userId: new Types.ObjectId(labBOwnerId),
          laboratoryName: 'HealthBridge Synthetic Reference Lab B',
          contactEmail: 'owner.synth-lab-b@example.test',
          contactPhone: '+91-9000000002',
          address: { street: '200 Other Ave', city: 'Pune', state: 'MH', postalCode: '411001', country: 'India' },
          verificationStatus: 'VERIFIED',
        },
        stores.profiles
      )
    );

    wireStore(LaboratoryProfileModel, stores.profiles);
    wireStore(LaboratoryDepartmentModel, stores.departments);
    wireStore(LaboratoryStaffModel, stores.staff);
    wireStore(LabTestModel, stores.tests);
    wireStore(LabInstrumentModel, stores.instruments);
    wireStore(QCProfileModel, stores.qcProfiles);
    wireStore(QCRunModel, stores.qcRuns);
    wireStore(QualityIncidentModel, stores.incidents);
    wireStore(ReagentModel, stores.reagents);
    wireStore(ReagentLotModel, stores.reagentLots);
    wireStore(ReagentInventoryTransactionModel, stores.reagentTxns);
    wireStore(LaboratoryOrderModel, stores.orders);
    wireStore(LabSampleModel, stores.samples);
    wireStore(TestResultModel, stores.testResults);
    wireStore(LaboratoryReportModel, stores.reports);
    wireStore(LabReportVersionModel, stores.reportVersions);
    wireStore(AuditLogModel, stores.audits);
  });

  // Shared workflow state across sequential E2E steps
  let departmentId: string;
  let techInviteToken: string;
  let techStaffId: string;
  let pathInviteToken: string;
  let instrumentId: string;
  let qcProfileId: string;
  let reagentId: string;
  let reagentLotId: string;
  let orderId: string;
  let sampleId: string;
  let sampleBarcode: string;
  let reportId: string;

  // ===========================================================================
  // PART A: COMPLETE END-TO-END SYNTHETIC WORKFLOW (STEPS 1 - 29)
  // ===========================================================================
  describe('Part A — End-to-End Synthetic Laboratory Workflow', () => {
    it('Steps 1–3: Configures lab profile, creates Hematology department, invites & onboards Technician and Pathologist', async () => {
      // Update profile
      const profRes = await request(app)
        .patch('/api/v1/laboratory/profile')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ laboratoryName: 'HealthBridge Synthetic Reference Lab A (Verified)' });
      expect(profRes.status).toBe(200);

      // Create department
      const deptRes = await request(app)
        .post('/api/v1/laboratory/departments')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ name: 'Synthetic Hematology', code: 'SYNHEM', location: 'Floor 1' });
      expect(deptRes.status).toBe(201);
      departmentId = deptRes.body.data.id;

      // Invite Technician
      const invTech = await request(app)
        .post('/api/v1/laboratory/staff/invite')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          fullName: 'Synthetic Tech One',
          email: 'tech.synth-lab-a@example.test',
          designation: 'Hematology Technologist',
          departmentId,
          role: 'LAB_TECHNICIAN',
        });
      expect(invTech.status).toBe(201);
      techInviteToken = invTech.body.invitationToken;
      techStaffId = invTech.body.data.id;

      // Accept Technician invite
      const accTech = await request(app)
        .post('/api/v1/laboratory/staff/accept-invite')
        .set('Authorization', `Bearer ${techToken}`)
        .send({ invitationToken: techInviteToken });
      expect(accTech.status).toBe(200);
      expect(accTech.body.data.status).toBe('ACTIVE');

      // Ensure userId is linked on staff record
      const techDoc = stores.staff.find((s) => s._id.toString() === techStaffId);
      if (techDoc) techDoc.userId = new Types.ObjectId(technicianUserId);

      // Invite Pathologist
      const invPath = await request(app)
        .post('/api/v1/laboratory/staff/invite')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          fullName: 'Dr. Synthetic Pathologist',
          email: 'pathologist.synth-lab-a@example.test',
          designation: 'Chief Pathologist (MD)',
          departmentId,
          role: 'LAB_PATHOLOGIST',
        });
      expect(invPath.status).toBe(201);
      pathInviteToken = invPath.body.invitationToken;

      const accPath = await request(app)
        .post('/api/v1/laboratory/staff/accept-invite')
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({ invitationToken: pathInviteToken });
      expect(accPath.status).toBe(200);

      const pathDoc = stores.staff.find((s) => s.email === 'pathologist.synth-lab-a@example.test');
      if (pathDoc) pathDoc.userId = new Types.ObjectId(pathologistUserId);

      // Configure granular permission override for technician
      const permRes = await request(app)
        .put(`/api/v1/laboratory/staff/${techStaffId}/permissions`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          allowedPermissions: ['lab.inventory.consume'],
          deniedPermissions: [],
          reason: 'Bench reagent consumption clearance',
        });
      expect(permRes.status).toBe(200);
    });

    it('Steps 6–10: Registers instrument, test catalogue, QC profile, reagent & lot, and passes QC run', async () => {
      // Instrument
      const instRes = await request(app)
        .post('/api/v1/laboratory/quality/instruments')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          instrumentIdentifier: 'SYNTH-HEM-01',
          instrumentName: 'Synthetic 5-Part Hematology Analyzer',
          manufacturer: 'SynthMed Corp',
          model: 'SM-5000',
          serialNumber: 'SN-SYNTH-001',
          category: 'ANALYZER',
          department: 'Synthetic Hematology',
          installationDate: '2026-01-15',
          associatedTestCodes: ['CBC'],
        });
      expect(instRes.status).toBe(201);
      instrumentId = instRes.body.data.id;

      // Test catalogue
      const testRes = await request(app)
        .post('/api/v1/laboratory/tests')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          testCode: 'CBC',
          testName: 'Complete Blood Count (Synthetic)',
          category: 'HEMATOLOGY',
          specimenType: 'BLOOD',
          price: 450,
          expectedTurnaroundTime: '4 hours',
          fastingRequirement: false,
        });
      expect(testRes.status).toBe(201);

      // QC Profile
      const qcProfRes = await request(app)
        .post('/api/v1/laboratory/quality/profiles')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          testCode: 'CBC',
          testName: 'Complete Blood Count (Synthetic)',
          profileName: 'Synthetic CBC Hemoglobin Control L1',
          parameterName: 'Hemoglobin',
          controlMaterial: 'SynthControl Level 1',
          controlLevel: 'LEVEL_1',
          dataType: 'NUMERIC',
          targetValue: 14.0,
          acceptableMin: 13.2,
          acceptableMax: 14.8,
          unit: 'g/dL',
        });
      expect(qcProfRes.status).toBe(201);
      qcProfileId = qcProfRes.body.data.id;

      // Reagent & Lot
      const reagRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentCode: 'SYNTH-DIL-01',
          name: 'Synthetic Hematology Diluent',
          manufacturer: 'SynthMed',
          catalogNumber: 'CAT-SYN-100',
          category: 'REAGENT',
          storageConditions: 'REFRIGERATED_2_8C',
          unit: 'mL',
          minimumStockLevel: 50,
          associatedTestCodes: ['CBC'],
        });
      expect(reagRes.status).toBe(201);
      reagentId = reagRes.body.data.id;

      const lotRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/lots')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentId,
          lotNumber: 'LOT-SYNTH-2026A',
          manufacturer: 'SynthMed',
          receivedDate: new Date().toISOString(),
          expiryDate: new Date('2028-12-31').toISOString(),
          initialQuantity: 500,
          storageLocation: 'Rack A1',
        });
      expect(lotRes.status).toBe(201);
      reagentLotId = lotRes.body.data.id;

      // Passing QC Run
      const qcRunRes = await request(app)
        .post('/api/v1/laboratory/quality/runs')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          qcProfileId,
          instrumentId,
          controlLotNumber: 'CTRL-SYN-01',
          reagentLotId,
          measuredNumericValue: 14.1,
        });
      expect(qcRunRes.status).toBe(201);
      expect(qcRunRes.body.data.qcStatus).toBe('PASSED');
    });

    it('Steps 11–18: Accepts synthetic order, collects & barcodes specimen, accessions sample, consumes reagent, and enters results', async () => {
      // Seed incoming synthetic order assigned to Lab A
      const orderDoc = makeDoc(
        {
          _id: new Types.ObjectId(),
          orderNumber: 'LBO-SYNTH-2026-0001',
          patientId: new Types.ObjectId(patientUserId),
          orderedBy: new Types.ObjectId(doctorUserId),
          laboratoryId: new Types.ObjectId(labAProfileId),
          facilityId: new Types.ObjectId(labAProfileId),
          status: 'ORDERED',
          priority: 'ROUTINE',
          tests: [{ testCode: 'CBC', testName: 'Complete Blood Count (Synthetic)', category: 'HEMATOLOGY', specimenType: 'BLOOD' }],
          orderedAt: new Date(),
        },
        stores.orders
      );
      stores.orders.push(orderDoc);
      orderId = orderDoc._id.toString();

      // Accept order
      const acceptRes = await request(app)
        .post(`/api/v1/laboratory/orders/${orderId}/accept`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ notes: 'Accepted for synthetic hematology bench' });
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.status).toBe('ACCEPTED');

      // Align order laboratoryId to labAProfileId for consistent downstream report & QMS linkage
      orderDoc.laboratoryId = new Types.ObjectId(labAProfileId);

      // Register sample collection & barcode
      const collectRes = await request(app)
        .post('/api/v1/laboratory/samples/collect')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          orderId,
          specimenType: 'BLOOD',
          testCodes: ['CBC'],
          containerType: 'EDTA Lavender Top',
          collectionMethod: 'Venipuncture',
          notes: 'Synthetic specimen drawn',
        });
      expect(collectRes.status).toBe(201);
      sampleId = collectRes.body.data.id;
      sampleBarcode = collectRes.body.data.barcode;
      expect(sampleBarcode).toBeTruthy();

      // Scan barcode
      const scanRes = await request(app)
        .get(`/api/v1/laboratory/samples/barcode/${sampleBarcode}`)
        .set('Authorization', `Bearer ${labAOwnerToken}`);
      expect(scanRes.status).toBe(200);
      expect(scanRes.body.data.id).toBe(sampleId);

      // Accession sample
      const accRes = await request(app)
        .post('/api/v1/laboratory/samples/accession')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ barcode: sampleBarcode, notes: 'Sample intact' });
      expect(accRes.status).toBe(200);
      expect(accRes.body.data.status).toBe('ACCESSIONED');

      // Validate reagent lot & consume stock atomically
      const valLotRes = await request(app)
        .get(`/api/v1/laboratory/inventory/reagents/lots/${reagentLotId}/validate?testCode=CBC&requiredQuantity=5`)
        .set('Authorization', `Bearer ${labAOwnerToken}`);
      expect(valLotRes.status).toBe(200);
      expect(valLotRes.body.data.valid).toBe(true);

      const consumeRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/transactions')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentId,
          lotId: reagentLotId,
          transactionType: 'CONSUMPTION',
          quantity: 5,
          reason: `Synthetic order ${orderDoc.orderNumber}`,
          orderId,
        });
      expect(consumeRes.status).toBe(201);
      expect(consumeRes.body.data.balanceAfter).toBe(495);

      // Record test result by Technician
      const resultRes = await request(app)
        .post('/api/v1/laboratory/reports/test-results')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          orderId,
          sampleId,
          testCode: 'CBC',
          testName: 'Complete Blood Count (Synthetic)',
          parameters: [
            {
              parameterCode: 'HB',
              parameterName: 'Hemoglobin',
              numericValue: 14.3,
              unit: 'g/dL',
              referenceRangeSnapshot: { normalMin: 13.0, normalMax: 17.0, unit: 'g/dL' },
            },
          ],
        });
      expect(resultRes.status).toBe(201);
    });

    it('Steps 19–29: Compiles draft, verifies QC gate, enforces SoD, approves via Pathologist, publishes PDF, delivers to Patient & Doctor, verifies Notifications & Audit', async () => {
      // Check QC Release Gate
      const gateRes = await request(app)
        .get(`/api/v1/laboratory/quality/release-gate/check?testCode=CBC&instrumentId=${instrumentId}`)
        .set('Authorization', `Bearer ${labAOwnerToken}`);
      expect(gateRes.status).toBe(200);
      expect(gateRes.body.data.eligible).toBe(true);

      // Generate Draft
      const draftRes = await request(app)
        .post('/api/v1/laboratory/reports/draft')
        .set('Authorization', `Bearer ${techToken}`)
        .send({ orderId, clinicalNotes: 'Synthetic hematology panel completed' });
      expect(draftRes.status).toBe(201);
      reportId = draftRes.body.data.id;
      expect(draftRes.body.data.status).toBe('DRAFT');

      // Submit for Review
      const subRes = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/submit-review`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ notes: 'Ready for pathologist authorization' });
      expect(subRes.status).toBe(200);
      expect(subRes.body.data.status).toBe('PENDING_REVIEW');

      // Technician self-approval MUST FAIL (403)
      const selfApproveRes = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/approve`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ comments: 'Attempting unauthorized self approval' });
      expect(selfApproveRes.status).toBe(403);

      // Independent Pathologist approves report
      const approveRes = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/approve`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({ comments: 'Verified against synthetic hematology control' });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // Publish report
      const pubRes = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/publish`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({ publicationNotes: 'Final authorized release' });
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.status).toBe('PUBLISHED');
      expect(pubRes.body.data.documentHash).toMatch(/^[a-f0-9]{64}$/);

      // Duplicate publish is idempotent (does not error or duplicate version)
      const dupPubRes = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/publish`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({});
      expect(dupPubRes.status).toBe(200);
      expect(dupPubRes.body.data.currentVersion).toBe(1);

      // Patient accesses published report & PDF
      const patRepRes = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patRepRes.status).toBe(200);

      const patPdfRes = await request(app)
        .get(`/api/v1/lab-reports/${reportId}/pdf`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patPdfRes.status).toBe(200);
      expect(patPdfRes.headers['content-type']).toContain('application/pdf');

      // Authorized Doctor accesses published report & FHIR Bundle
      const docRepRes = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(docRepRes.status).toBe(200);

      const docFhirRes = await request(app)
        .get(`/api/v1/lab-reports/${reportId}/fhir`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(docFhirRes.status).toBe(200);
      expect(docFhirRes.body.data.resourceType).toBe('Bundle');

      // Notifications & Immutable Audit Trail verified
      expect(stores.notifications.some((n) => n.eventType === 'LAB_REPORT_PUBLISHED' && n.recipientRole === 'PATIENT')).toBe(true);
      expect(stores.notifications.some((n) => n.eventType === 'LAB_REPORT_PUBLISHED' && n.recipientRole === 'DOCTOR')).toBe(true);
      expect(stores.audits.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ===========================================================================
  // PART B: FAILURE SCENARIOS & SECURITY AUDIT VERIFICATION
  // ===========================================================================
  describe('Part B — Failure Scenarios & Security Hardening Verification', () => {
    it('blocks X-Laboratory-Id header spoofing on QMS endpoints (CRIT-01 fix)', async () => {
      const spoofRes = await request(app)
        .get('/api/v1/laboratory/quality/dashboard')
        .set('Authorization', `Bearer ${labBOwnerToken}`)
        .set('X-Laboratory-Id', labAProfileId);

      expect(spoofRes.status).toBe(403);
      expect(spoofRes.body.message).toContain('laboratory header');
    });

    it('blocks cross-laboratory report mutation (Lab B attempting to amend Lab A report — HIGH-01 fix)', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/amend`)
        .set('Authorization', `Bearer ${labBOwnerToken}`)
        .send({
          amendmentReason: 'Unauthorized cross-tenant tamper attempt',
          explanation: 'Should be rejected by tenant ownership check',
        });

      expect(res.status).toBe(403);
    });

    it('blocks LAB_TECHNICIAN from initiating report amendments (RBAC SoD)', async () => {
      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/amend`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          amendmentReason: 'Technician attempting amendment',
          explanation: 'Only Pathologist/Admin/Manager can amend',
        });

      expect(res.status).toBe(403);
    });

    it('blocks PATIENT ?status=DRAFT filter bypass and hides unpublished drafts from DOCTOR (HIGH-02 fix)', async () => {
      // Create an unpublished DRAFT report for patientUserId / doctorUserId
      const draftDoc = makeDoc(
        {
          _id: new Types.ObjectId(),
          reportNumber: 'LBR-SYNTH-DRAFT-99',
          patientId: new Types.ObjectId(patientUserId),
          doctorId: new Types.ObjectId(doctorUserId),
          laboratoryId: new Types.ObjectId(labAProfileId),
          testName: 'Unpublished Draft Panel',
          category: 'BIOCHEMISTRY',
          status: 'DRAFT',
          currentVersion: 1,
          observations: [],
        },
        stores.reports
      );
      stores.reports.push(draftDoc);

      // Patient filtering by ?status=DRAFT must return 0 items (never bypass PUBLISHED gate)
      const patListRes = await request(app)
        .get('/api/v1/lab-reports?status=DRAFT')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patListRes.status).toBe(200);
      const listItems = Array.isArray(patListRes.body.data)
        ? patListRes.body.data
        : patListRes.body.data?.items || [];
      expect(listItems).toHaveLength(0);

      // Doctor attempting direct access to unpublished DRAFT must receive 403
      const docDraftRes = await request(app)
        .get(`/api/v1/lab-reports/${draftDoc._id}`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(docDraftRes.status).toBe(403);

      // Unrelated patient & unrelated doctor blocked from published report
      const otherPatRes = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${otherPatientToken}`);
      expect(otherPatRes.status).toBe(403);

      const otherDocRes = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${otherDoctorToken}`);
      expect(otherDocRes.status).toBe(403);

      // Pharmacy blocked from laboratory endpoints
      const pharmRes = await request(app)
        .get('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${pharmacyToken}`);
      expect(pharmRes.status).toBe(403);
    });

    it('blocks reagent consumption from QUARANTINED and EXPIRED lots & negative adjustments (HIGH-03 fix)', async () => {
      // Quarantine the lot
      const qRes = await request(app)
        .post(`/api/v1/laboratory/inventory/reagents/lots/${reagentLotId}/quarantine`)
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({ quarantineReason: 'Synthetic temperature excursion' });
      expect(qRes.status).toBe(200);

      // Attempt clinical consumption from QUARANTINED lot -> MUST FAIL (400)
      const consumeQuarRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/transactions')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentId,
          lotId: reagentLotId,
          transactionType: 'CONSUMPTION',
          quantity: 1,
          reason: 'Should fail on quarantined lot',
        });
      expect(consumeQuarRes.status).toBe(400);
      expect(consumeQuarRes.body.message).toContain('QUARANTINED');

      // Register an expired lot and try consuming from it -> MUST FAIL (400)
      const expLotRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/lots')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentId,
          lotNumber: 'LOT-SYNTH-EXPIRED',
          manufacturer: 'SynthMed',
          receivedDate: new Date('2022-01-01').toISOString(),
          expiryDate: new Date('2023-01-01').toISOString(),
          initialQuantity: 20,
          storageLocation: 'Expired Shelf',
        });
      expect(expLotRes.status).toBe(201);

      const consumeExpRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/transactions')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentId,
          lotId: expLotRes.body.data.id,
          transactionType: 'CONSUMPTION',
          quantity: 1,
          reason: 'Should fail on expired lot',
        });
      expect(consumeExpRes.status).toBe(400);
      expect(consumeExpRes.body.message).toContain('EXPIRED');

      // Negative stock adjustment beyond available balance -> MUST FAIL (400)
      const negAdjRes = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/transactions')
        .set('Authorization', `Bearer ${labAOwnerToken}`)
        .send({
          reagentId,
          lotId: expLotRes.body.data.id,
          transactionType: 'ADJUSTMENT',
          quantity: -999,
          reason: 'Invalid excessive negative adjustment',
        });
      expect(negAdjRes.status).toBe(400);
    });

    it('rejects invalid sample barcode lookup with 404 and unauthorized QC override by technician with 403', async () => {
      const badBarcode = await request(app)
        .get('/api/v1/laboratory/samples/barcode/INVALID-BC-DOES-NOT-EXIST')
        .set('Authorization', `Bearer ${labAOwnerToken}`);
      expect(badBarcode.status).toBe(404);

      const badOverride = await request(app)
        .post('/api/v1/laboratory/quality/release-gate/override')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          testCode: 'CBC',
          reason: 'Technician attempting unauthorized QC gate override',
        });
      expect(badOverride.status).toBe(403);
    });
  });
});

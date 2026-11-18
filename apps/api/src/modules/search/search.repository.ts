/**
 * HealthBridge India — Global Search Read-Only Repository (Day 8 Task 02)
 *
 * Strictly enforces:
 *   1. Read-only MongoDB queries (NEVER writes across modules).
 *   2. Explicit allowlist `.select(...)` projections (NEVER retrieves password, tokens, secrets,
 *      ABHA encrypted/raw numbers, raw FHIR bundles, clinicalNotes, or sensitive lab observation values).
 *   3. Server-derived tenant/actor ownership scoping (`patientId`, `doctorId`, `pharmacyId`, `laboratoryId`).
 *   4. Draft/unpublished clinical record exclusion (`isDraft: false`, `status: PUBLISHED|AMENDED`).
 *   5. Bounded per-collection limits (`PER_COLLECTION_CAP = 20`) and `maxTimeMS(3000)` query timeouts.
 */

import { Types } from 'mongoose';
import type {
  GlobalSearchResourceType,
  GlobalSearchResultItemDto,
  UserRole,
} from '@healthbridge/shared-types';
import { RESOURCE_TYPE_TO_CATEGORY_GROUP } from './search.permissions';
import { buildSafeContainsRegex, computeMatchScore } from './search.validation';
import { UserModel } from '../users/models/user.model';
import { DoctorProfileModel } from '../users/models/doctor-profile.model';
import { PharmacyProfileModel } from '../users/models/pharmacy-profile.model';
import { LaboratoryProfileModel } from '../users/models/laboratory-profile.model';
import { AppointmentModel } from '../healthcare/models/appointment.model';
import { EncounterModel } from '../healthcare/models/encounter.model';
import { PrescriptionModel } from '../healthcare/models/prescription.model';
import { LaboratoryOrderModel } from '../healthcare/models/lab-order.model';
import { LaboratoryReportModel } from '../healthcare/models/lab-report.model';
import { MedicalRecordModel } from '../healthcare/models/medical-record.model';
import { MedicationCatalogModel } from '../healthcare/models/medication-catalog.model';
import { PharmacyInventoryModel } from '../pharmacy/models/pharmacy-inventory.model';
import { PharmacyOrderModel } from '../pharmacy/models/pharmacy-order.model';
import { DispensingRecordModel } from '../pharmacy/models/dispensing-record.model';
import { SupplierModel } from '../pharmacy/models/supplier.model';
import { LabSampleModel } from '../laboratory/models/lab-sample.model';
import { LabTestModel } from '../laboratory/models/lab-test.model';
import { ConsentArtifactModel } from '../consent/models/consent-artifact.model';
import { AbdmConsentArtefactModel } from '../abdm/models/abdm-consent-artefact.model';
import { AbdmImportedRecordModel } from '../abdm/models/abdm-imported-record.model';

const PER_COLLECTION_CAP = 20;
const SEARCH_QUERY_TIMEOUT_MS = 3000;

export interface SearchActorContext {
  userId: string;
  role: UserRole;
  doctorIds?: Types.ObjectId[];
  authorizedPatientIds?: Types.ObjectId[];
}

export interface SearchRepositoryFilter {
  query: string;
  from?: Date;
  to?: Date;
  status?: string;
  category?: string;
}

function applyTimeout<T>(queryObj: any): Promise<T> {
  if (queryObj && typeof queryObj.maxTimeMS === 'function') {
    queryObj = queryObj.maxTimeMS(SEARCH_QUERY_TIMEOUT_MS);
  }
  return queryObj as Promise<T>;
}

function buildDateRange(from?: Date, to?: Date): Record<string, Date> | undefined {
  if (!from && !to) return undefined;
  const range: Record<string, Date> = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return range;
}

export class SearchRepository {
  /**
   * Resolves authorized patient ObjectIds for DOCTOR (appointments, encounters, active consents)
   * or LABORATORY (patients who have orders assigned to this laboratory).
   * Fails closed (returns empty array if none).
   */
  async resolveActorScope(userId: string, role: UserRole): Promise<SearchActorContext> {
    const ctx: SearchActorContext = { userId, role };
    if (!Types.ObjectId.isValid(userId)) {
      return ctx;
    }
    const actorObjId = new Types.ObjectId(userId);

    if (role === 'DOCTOR') {
      const profile = await applyTimeout<any>(
        DoctorProfileModel.findOne({ userId: actorObjId }).select('_id').lean()
      );
      const doctorIds: Types.ObjectId[] = [actorObjId];
      if (profile?._id && !new Types.ObjectId(String(profile._id)).equals(actorObjId)) {
        doctorIds.push(new Types.ObjectId(String(profile._id)));
      }
      ctx.doctorIds = doctorIds;

      const now = new Date();
      const [aptPatients, encPatients, consentPatients] = await Promise.all([
        applyTimeout<any[]>(
          AppointmentModel.find({ doctorId: { $in: doctorIds } }).select('patientId').limit(200).lean()
        ),
        applyTimeout<any[]>(
          EncounterModel.find({ practitionerId: { $in: doctorIds } }).select('patientId').limit(200).lean()
        ),
        applyTimeout<any[]>(
          ConsentArtifactModel.find({
            grantedTo: { $in: doctorIds },
            status: 'ACTIVE',
            expiresAt: { $gt: now },
          })
            .select('patientId')
            .limit(200)
            .lean()
        ),
      ]);

      const idSet = new Set<string>();
      for (const row of [...(aptPatients || []), ...(encPatients || []), ...(consentPatients || [])]) {
        if (row?.patientId) idSet.add(String(row.patientId));
      }
      ctx.authorizedPatientIds = Array.from(idSet)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
    } else if (role === 'LABORATORY') {
      const orders = await applyTimeout<any[]>(
        LaboratoryOrderModel.find({ laboratoryId: actorObjId })
          .select('patientId')
          .limit(200)
          .lean()
      );
      const idSet = new Set<string>();
      for (const row of orders || []) {
        if (row?.patientId) idSet.add(String(row.patientId));
      }
      ctx.authorizedPatientIds = Array.from(idSet)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
    }

    return ctx;
  }

  async searchByType(
    type: GlobalSearchResourceType,
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    switch (type) {
      case 'patient':
        return this.searchPatients(actor, filter);
      case 'doctor':
        return this.searchDoctors(actor, filter);
      case 'pharmacy':
        return this.searchPharmacies(actor, filter);
      case 'laboratory':
        return this.searchLaboratories(actor, filter);
      case 'appointment':
        return this.searchAppointments(actor, filter);
      case 'prescription':
        return this.searchPrescriptions(actor, filter);
      case 'lab_order':
        return this.searchLabOrders(actor, filter);
      case 'lab_report':
        return this.searchLabReports(actor, filter);
      case 'medical_record':
        return this.searchMedicalRecords(actor, filter);
      case 'encounter':
        return this.searchEncounters(actor, filter);
      case 'medicine':
        return this.searchMedicines(actor, filter);
      case 'inventory':
        return this.searchInventory(actor, filter);
      case 'pharmacy_order':
        return this.searchPharmacyOrders(actor, filter);
      case 'dispensing':
        return this.searchDispensing(actor, filter);
      case 'supplier':
        return this.searchSuppliers(actor, filter);
      case 'lab_sample':
        return this.searchLabSamples(actor, filter);
      case 'lab_test':
        return this.searchLabTests(actor, filter);
      case 'external_record':
        return this.searchExternalRecords(actor, filter);
      case 'user':
        return this.searchAdminUsers(actor, filter);
      default:
        return [];
    }
  }

  private async searchPatients(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    // Only DOCTOR & LABORATORY (with explicit authorizedPatientIds) may search patients
    if (
      (actor.role !== 'DOCTOR' && actor.role !== 'LABORATORY') ||
      !actor.authorizedPatientIds ||
      actor.authorizedPatientIds.length === 0
    ) {
      return [];
    }

    const regex = buildSafeContainsRegex(filter.query);
    const docs = await applyTimeout<any[]>(
      UserModel.find({
        _id: { $in: actor.authorizedPatientIds },
        role: 'PATIENT',
        name: regex,
      })
        .select('_id name createdAt isActive')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((u) => {
      const id = String(u._id);
      return {
        id,
        resourceType: 'patient',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.patient,
        title: u.name || 'Authorized Patient',
        description:
          actor.role === 'DOCTOR'
            ? 'Authorized patient under your care relationship'
            : 'Patient associated with assigned laboratory order',
        date: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
        status: u.isActive === false ? 'INACTIVE' : 'ACTIVE',
        sourceModule: 'PATIENTS',
        destinationRoute:
          actor.role === 'DOCTOR' ? `/doctor/patients/${id}/overview` : '/laboratory/orders',
        metadata: { scope: actor.role === 'DOCTOR' ? 'CARE_RELATIONSHIP' : 'LAB_ORDER_LINKED' },
        score: computeMatchScore(filter.query, u.name || '', [id]),
      };
    });
  }

  private async searchDoctors(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const [matchingUsers, matchingProfiles] = await Promise.all([
      applyTimeout<any[]>(
        UserModel.find({ role: 'DOCTOR', isActive: true, name: regex })
          .select('_id name')
          .limit(PER_COLLECTION_CAP)
          .lean()
      ),
      applyTimeout<any[]>(
        DoctorProfileModel.find({
          $or: [
            { specialization: regex },
            ...(filter.category ? [{ specialization: buildSafeContainsRegex(filter.category) }] : []),
          ],
        })
          .select('_id userId specialization verificationStatus consultationFee')
          .populate('userId', 'name isActive')
          .limit(PER_COLLECTION_CAP)
          .lean()
      ),
    ]);

    const results: GlobalSearchResultItemDto[] = [];
    const seen = new Set<string>();

    for (const p of matchingProfiles || []) {
      const userObj = p.userId as any;
      if (!userObj || userObj.isActive === false) continue;
      const uid = String(userObj._id || p.userId);
      if (seen.has(uid)) continue;
      seen.add(uid);
      const specText = Array.isArray(p.specialization)
        ? p.specialization.join(', ')
        : p.specialization || 'General Medicine';
      results.push({
        id: uid,
        resourceType: 'doctor',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.doctor,
        title: userObj.name || 'Doctor',
        description: `Specialization: ${specText}`,
        status: p.verificationStatus || 'VERIFIED',
        sourceModule: 'DOCTORS',
        destinationRoute: actor.role === 'PATIENT' ? '/patient/doctors' : '/admin/platform-overview',
        metadata: { specialization: specText },
        score: computeMatchScore(filter.query, userObj.name || '', [uid], specText),
      });
    }

    for (const u of matchingUsers || []) {
      const uid = String(u._id);
      if (seen.has(uid)) continue;
      seen.add(uid);
      results.push({
        id: uid,
        resourceType: 'doctor',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.doctor,
        title: u.name || 'Doctor',
        description: 'Registered HealthBridge Clinician',
        status: 'ACTIVE',
        sourceModule: 'DOCTORS',
        destinationRoute: actor.role === 'PATIENT' ? '/patient/doctors' : '/admin/platform-overview',
        metadata: {},
        score: computeMatchScore(filter.query, u.name || '', [uid]),
      });
    }

    return results.slice(0, PER_COLLECTION_CAP);
  }

  private async searchPharmacies(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const docs = await applyTimeout<any[]>(
      PharmacyProfileModel.find({
        $or: [{ pharmacyName: regex }, { 'address.city': regex }, { 'address.state': regex }],
      })
        .select('_id userId pharmacyName address.city address.state verificationStatus is24Hours')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((p) => {
      const id = String(p._id);
      const loc = [p.address?.city, p.address?.state].filter(Boolean).join(', ');
      return {
        id,
        resourceType: 'pharmacy',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.pharmacy,
        title: p.pharmacyName || 'Pharmacy',
        description: loc ? `Pharmacy in ${loc}` : 'Registered HealthBridge Pharmacy',
        status: p.verificationStatus || 'ACTIVE',
        sourceModule: 'PHARMACY',
        destinationRoute: actor.role === 'PATIENT' ? '/patient/orders' : '/admin/platform-overview',
        metadata: { location: loc || undefined, is24Hours: Boolean(p.is24Hours) },
        score: computeMatchScore(filter.query, p.pharmacyName || '', [id], loc),
      };
    });
  }

  private async searchLaboratories(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const docs = await applyTimeout<any[]>(
      LaboratoryProfileModel.find({
        $or: [
          { laboratoryName: regex },
          { facilityName: regex },
          { 'address.city': regex },
          { supportedDiagnosticServices: regex },
        ],
      })
        .select('_id userId laboratoryName facilityName address.city address.state verificationStatus')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((l) => {
      const id = String(l._id);
      const name = l.laboratoryName || l.facilityName || 'Diagnostic Laboratory';
      const loc = [l.address?.city, l.address?.state].filter(Boolean).join(', ');
      return {
        id,
        resourceType: 'laboratory',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.laboratory,
        title: name,
        description: loc ? `Diagnostic Laboratory in ${loc}` : 'Registered Diagnostic Laboratory',
        status: l.verificationStatus || 'ACTIVE',
        sourceModule: 'LABORATORY',
        destinationRoute:
          actor.role === 'PATIENT' ? '/patient/lab-orders' : '/admin/platform-overview',
        metadata: { location: loc || undefined },
        score: computeMatchScore(filter.query, name, [id], loc),
      };
    });
  }

  private async searchAppointments(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const baseQuery: Record<string, unknown> = {};

    if (actor.role === 'PATIENT') {
      baseQuery.patientId = new Types.ObjectId(actor.userId);
    } else if (actor.role === 'DOCTOR') {
      baseQuery.doctorId = { $in: actor.doctorIds || [new Types.ObjectId(actor.userId)] };
    } else if (actor.role !== 'ADMIN') {
      return [];
    }

    const dateRange = buildDateRange(filter.from, filter.to);
    if (dateRange) baseQuery.scheduledAt = dateRange;
    if (filter.status) baseQuery.status = filter.status.toUpperCase();

    const orClauses: Record<string, unknown>[] = [{ reason: regex }, { status: regex }];
    if (Types.ObjectId.isValid(filter.query)) {
      orClauses.push({ _id: new Types.ObjectId(filter.query) });
    }
    baseQuery.$or = orClauses;

    const docs = await applyTimeout<any[]>(
      AppointmentModel.find(baseQuery)
        .select('_id scheduledAt status reason consultationType')
        .sort({ scheduledAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((a) => {
      const id = String(a._id);
      return {
        id,
        resourceType: 'appointment',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.appointment,
        title: a.reason ? `Appointment: ${a.reason}` : `Appointment (${a.status})`,
        description: `Scheduled consultation • Status: ${a.status}`,
        date: a.scheduledAt ? new Date(a.scheduledAt).toISOString() : undefined,
        status: a.status,
        sourceModule: 'APPOINTMENTS',
        destinationRoute:
          actor.role === 'PATIENT'
            ? '/patient/appointments'
            : actor.role === 'DOCTOR'
              ? '/doctor/appointments'
              : '/admin/platform-overview',
        metadata: { consultationType: a.consultationType },
        score: computeMatchScore(filter.query, a.reason || a.status || '', [id]),
      };
    });
  }

  private async searchPrescriptions(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const baseQuery: Record<string, unknown> = {
      isDraft: false,
      status: { $ne: 'DRAFT' },
    };

    if (actor.role === 'PATIENT') {
      baseQuery.patientId = new Types.ObjectId(actor.userId);
    } else if (actor.role === 'DOCTOR') {
      baseQuery.doctorId = { $in: actor.doctorIds || [new Types.ObjectId(actor.userId)] };
    } else if (actor.role === 'PHARMACY') {
      // Pharmacies may search active/issued prescriptions by exact/partial prescriptionNumber or medication name
      baseQuery.status = { $in: ['ACTIVE', 'PARTIALLY_DISPENSED', 'ISSUED'] };
    } else {
      return [];
    }

    const dateRange = buildDateRange(filter.from, filter.to);
    if (dateRange) baseQuery.issuedAt = dateRange;
    if (filter.status) baseQuery.status = filter.status.toUpperCase();

    const orClauses: Record<string, unknown>[] = [
      { prescriptionNumber: regex },
      { 'medications.name': regex },
    ];
    if (Types.ObjectId.isValid(filter.query)) {
      orClauses.push({ _id: new Types.ObjectId(filter.query) });
    }
    baseQuery.$or = orClauses;

    const docs = await applyTimeout<any[]>(
      PrescriptionModel.find(baseQuery)
        .select('_id prescriptionNumber issuedAt status medications.name')
        .sort({ issuedAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((rx) => {
      const id = String(rx._id);
      const medCount = Array.isArray(rx.medications) ? rx.medications.length : 0;
      const refNum = rx.prescriptionNumber || `RX-${id.slice(-6).toUpperCase()}`;
      return {
        id,
        resourceType: 'prescription',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.prescription,
        title: `Prescription ${refNum}`,
        description: `${medCount} prescribed item(s) • Status: ${rx.status}`,
        date: rx.issuedAt ? new Date(rx.issuedAt).toISOString() : undefined,
        status: rx.status,
        sourceModule: 'PRESCRIPTIONS',
        destinationRoute:
          actor.role === 'PATIENT'
            ? '/patient/prescriptions'
            : actor.role === 'DOCTOR'
              ? '/doctor/prescriptions'
              : '/pharmacy/prescriptions',
        metadata: { referenceNumber: refNum, medicationsCount: medCount },
        score: computeMatchScore(
          filter.query,
          refNum,
          [id, rx.prescriptionNumber],
          (rx.medications || []).map((m: any) => m.name).join(' ')
        ),
      };
    });
  }

  private async searchLabOrders(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const baseQuery: Record<string, unknown> = {};

    if (actor.role === 'DOCTOR') {
      baseQuery.orderedBy = { $in: actor.doctorIds || [new Types.ObjectId(actor.userId)] };
    } else if (actor.role === 'LABORATORY') {
      baseQuery.laboratoryId = new Types.ObjectId(actor.userId);
    } else if (actor.role !== 'ADMIN') {
      return [];
    }

    const dateRange = buildDateRange(filter.from, filter.to);
    if (dateRange) baseQuery.orderedAt = dateRange;
    if (filter.status) baseQuery.status = filter.status.toUpperCase();

    const orClauses: Record<string, unknown>[] = [
      { orderNumber: regex },
      { 'tests.testName': regex },
      { 'tests.testCode': regex },
    ];
    if (Types.ObjectId.isValid(filter.query)) {
      orClauses.push({ _id: new Types.ObjectId(filter.query) });
    }
    baseQuery.$or = orClauses;

    const docs = await applyTimeout<any[]>(
      LaboratoryOrderModel.find(baseQuery)
        .select('_id orderNumber orderedAt status priority tests.testName')
        .sort({ orderedAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((o) => {
      const id = String(o._id);
      const testNames = (o.tests || []).map((t: any) => t.testName).slice(0, 3).join(', ');
      return {
        id,
        resourceType: 'lab_order',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.lab_order,
        title: `Lab Order ${o.orderNumber}`,
        description: testNames || `Diagnostic order (${o.priority || 'ROUTINE'})`,
        date: o.orderedAt ? new Date(o.orderedAt).toISOString() : undefined,
        status: o.status,
        sourceModule: 'LABORATORY',
        destinationRoute:
          actor.role === 'LABORATORY'
            ? '/laboratory/orders'
            : actor.role === 'DOCTOR'
              ? '/doctor/reports'
              : '/admin/platform-overview',
        metadata: { referenceNumber: o.orderNumber, priority: o.priority },
        score: computeMatchScore(filter.query, o.orderNumber || '', [id, o.orderNumber], testNames),
      };
    });
  }

  private async searchLabReports(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    // STRICT: Only PUBLISHED or AMENDED reports are searchable (never drafts or unapproved results)
    const baseQuery: Record<string, unknown> = {
      status: { $in: ['PUBLISHED', 'AMENDED'] },
    };

    if (actor.role === 'PATIENT') {
      baseQuery.patientId = new Types.ObjectId(actor.userId);
    } else if (actor.role === 'DOCTOR') {
      if (!actor.authorizedPatientIds || actor.authorizedPatientIds.length === 0) return [];
      baseQuery.patientId = { $in: actor.authorizedPatientIds };
    } else if (actor.role === 'LABORATORY') {
      baseQuery.laboratoryId = new Types.ObjectId(actor.userId);
    } else {
      return [];
    }

    const dateRange = buildDateRange(filter.from, filter.to);
    if (dateRange) baseQuery.publishedAt = dateRange;
    if (filter.status && ['PUBLISHED', 'AMENDED'].includes(filter.status.toUpperCase())) {
      baseQuery.status = filter.status.toUpperCase();
    }
    if (filter.category) {
      baseQuery.category = buildSafeContainsRegex(filter.category);
    }

    const orClauses: Record<string, unknown>[] = [
      { reportNumber: regex },
      { testName: regex },
      { category: regex },
    ];
    if (Types.ObjectId.isValid(filter.query)) {
      orClauses.push({ _id: new Types.ObjectId(filter.query) });
    }
    baseQuery.$or = orClauses;

    // NEVER select `observations`, `clinicalNotes`, `interpretation`, or `documentBuffer` in search!
    const docs = await applyTimeout<any[]>(
      LaboratoryReportModel.find(baseQuery)
        .select('_id reportNumber testName category status publishedAt testDate currentVersion')
        .sort({ publishedAt: -1, testDate: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((r) => {
      const id = String(r._id);
      return {
        id,
        resourceType: 'lab_report',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.lab_report,
        title: `${r.testName} (${r.reportNumber})`,
        description: `Category: ${r.category || 'Diagnostic'} • v${r.currentVersion || 1} • ${r.status}`,
        date: (r.publishedAt || r.testDate)
          ? new Date(r.publishedAt || r.testDate).toISOString()
          : undefined,
        status: r.status,
        sourceModule: 'LABORATORY',
        destinationRoute:
          actor.role === 'PATIENT'
            ? '/patient/lab-reports'
            : actor.role === 'DOCTOR'
              ? '/doctor/reports'
              : '/laboratory/reports',
        metadata: {
          referenceNumber: r.reportNumber,
          category: r.category,
          version: r.currentVersion || 1,
        },
        score: computeMatchScore(filter.query, r.testName || '', [id, r.reportNumber], r.category || ''),
      };
    });
  }

  private async searchMedicalRecords(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const baseQuery: Record<string, unknown> = {};

    if (actor.role === 'PATIENT') {
      baseQuery.patientId = new Types.ObjectId(actor.userId);
    } else if (actor.role === 'DOCTOR') {
      if (!actor.authorizedPatientIds || actor.authorizedPatientIds.length === 0) return [];
      baseQuery.patientId = { $in: actor.authorizedPatientIds };
    } else {
      return [];
    }

    const dateRange = buildDateRange(filter.from, filter.to);
    if (dateRange) baseQuery.recordDate = dateRange;
    if (filter.category) baseQuery.recordType = buildSafeContainsRegex(filter.category);

    baseQuery.$or = [{ title: regex }, { recordType: regex }, { facilityName: regex }];

    // NEVER select `fileData` or raw clinical `description`
    const docs = await applyTimeout<any[]>(
      MedicalRecordModel.find(baseQuery)
        .select('_id title recordType recordDate source verificationStatus facilityName')
        .sort({ recordDate: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((m) => {
      const id = String(m._id);
      return {
        id,
        resourceType: 'medical_record',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.medical_record,
        title: m.title || 'Medical Document',
        description: `${m.recordType} • ${m.facilityName || m.source || 'HealthBridge'}`,
        date: m.recordDate ? new Date(m.recordDate).toISOString() : undefined,
        status: m.verificationStatus || 'RECORDED',
        sourceModule: 'RECORDS',
        destinationRoute: actor.role === 'PATIENT' ? '/patient/records' : '/doctor/patients',
        metadata: { recordType: m.recordType, source: m.source },
        score: computeMatchScore(filter.query, m.title || '', [id], `${m.recordType} ${m.facilityName || ''}`),
      };
    });
  }

  private async searchEncounters(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'DOCTOR') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const baseQuery: Record<string, unknown> = {
      practitionerId: { $in: actor.doctorIds || [new Types.ObjectId(actor.userId)] },
    };

    const dateRange = buildDateRange(filter.from, filter.to);
    if (dateRange) baseQuery.startTime = dateRange;
    if (filter.status) baseQuery.status = filter.status.toUpperCase();
    baseQuery.$or = [{ encounterType: regex }, { chiefComplaint: regex }];

    // NEVER select unrestricted `notes`, `assessment`, `treatmentPlan`, or `examination`
    const docs = await applyTimeout<any[]>(
      EncounterModel.find(baseQuery)
        .select('_id patientId encounterType startTime status isDraft')
        .sort({ startTime: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((e) => {
      const id = String(e._id);
      return {
        id,
        resourceType: 'encounter',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.encounter,
        title: `${e.encounterType || 'Clinical'} Encounter`,
        description: `Encounter status: ${e.isDraft ? 'DRAFT' : e.status}`,
        date: e.startTime ? new Date(e.startTime).toISOString() : undefined,
        status: e.isDraft ? 'DRAFT' : e.status,
        sourceModule: 'ENCOUNTERS',
        destinationRoute: `/doctor/patients/${String(e.patientId)}/overview`,
        metadata: { encounterType: e.encounterType },
        score: computeMatchScore(filter.query, e.encounterType || '', [id]),
      };
    });
  }

  private async searchMedicines(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      $or: [{ name: regex }, { genericName: regex }, { brandName: regex }, { category: regex }],
    };
    if (filter.category) query.category = buildSafeContainsRegex(filter.category);

    const docs = await applyTimeout<any[]>(
      MedicationCatalogModel.find(query)
        .select('_id name genericName brandName dosageForm strength category')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((m) => {
      const id = String(m._id);
      const subtitle = [m.genericName, m.strength, m.dosageForm].filter(Boolean).join(' • ');
      return {
        id,
        resourceType: 'medicine',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.medicine,
        title: m.name || 'Medicine',
        description: subtitle || m.category || 'Catalog Medication',
        status: 'ACTIVE',
        sourceModule: 'MEDICATIONS',
        destinationRoute:
          actor.role === 'PHARMACY' ? '/pharmacy/inventory' : '/doctor/medications',
        metadata: { category: m.category, dosageForm: m.dosageForm },
        score: computeMatchScore(filter.query, m.name || '', [id], `${m.genericName || ''} ${m.brandName || ''}`),
      };
    });
  }

  private async searchInventory(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'PHARMACY') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      pharmacyId: new Types.ObjectId(actor.userId),
      $or: [{ medicationName: regex }, { genericName: regex }, { batchNumber: regex }],
    };
    if (filter.status) query.status = filter.status.toUpperCase();

    const docs = await applyTimeout<any[]>(
      PharmacyInventoryModel.find(query)
        .select('_id medicationName batchNumber availableQuantity status expiryDate dosageForm strength')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((inv) => {
      const id = String(inv._id);
      return {
        id,
        resourceType: 'inventory',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.inventory,
        title: `${inv.medicationName} (Batch ${inv.batchNumber})`,
        description: `${inv.strength || ''} ${inv.dosageForm || ''} • Qty: ${inv.availableQuantity ?? 0}`,
        date: inv.expiryDate ? new Date(inv.expiryDate).toISOString() : undefined,
        status: inv.status,
        sourceModule: 'PHARMACY',
        destinationRoute: '/pharmacy/inventory',
        metadata: { batchNumber: inv.batchNumber, availableQuantity: inv.availableQuantity },
        score: computeMatchScore(filter.query, inv.medicationName || '', [id, inv.batchNumber]),
      };
    });
  }

  private async searchPharmacyOrders(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {};
    if (actor.role === 'PHARMACY') {
      query.pharmacyId = new Types.ObjectId(actor.userId);
    } else if (actor.role !== 'ADMIN') {
      return [];
    }
    if (filter.status) query.status = filter.status.toUpperCase();
    query.$or = [{ orderNumber: regex }, { status: regex }];

    const docs = await applyTimeout<any[]>(
      PharmacyOrderModel.find(query)
        .select('_id orderNumber status createdAt totalAmount')
        .sort({ createdAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((po) => {
      const id = String(po._id);
      return {
        id,
        resourceType: 'pharmacy_order',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.pharmacy_order,
        title: `Pharmacy Order ${po.orderNumber || id.slice(-6)}`,
        description: `Order status: ${po.status}`,
        date: po.createdAt ? new Date(po.createdAt).toISOString() : undefined,
        status: po.status,
        sourceModule: 'PHARMACY',
        destinationRoute:
          actor.role === 'PHARMACY' ? '/pharmacy/orders' : '/admin/platform-overview',
        metadata: { referenceNumber: po.orderNumber },
        score: computeMatchScore(filter.query, po.orderNumber || '', [id, po.orderNumber]),
      };
    });
  }

  private async searchDispensing(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'PHARMACY') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      pharmacyId: new Types.ObjectId(actor.userId),
      $or: [{ dispensingNumber: regex }, { prescriptionNumber: regex }],
    };
    if (filter.status) query.dispensingStatus = filter.status.toUpperCase();

    const docs = await applyTimeout<any[]>(
      DispensingRecordModel.find(query)
        .select('_id dispensingNumber prescriptionNumber dispensedAt dispensingStatus totalItems')
        .sort({ dispensedAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((d) => {
      const id = String(d._id);
      return {
        id,
        resourceType: 'dispensing',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.dispensing,
        title: `Dispensing ${d.dispensingNumber}`,
        description: `Prescription ${d.prescriptionNumber} • ${d.totalItems || 0} item(s)`,
        date: d.dispensedAt ? new Date(d.dispensedAt).toISOString() : undefined,
        status: d.dispensingStatus,
        sourceModule: 'PHARMACY',
        destinationRoute: '/pharmacy/dispensing',
        metadata: { referenceNumber: d.dispensingNumber, prescriptionNumber: d.prescriptionNumber },
        score: computeMatchScore(filter.query, d.dispensingNumber || '', [
          id,
          d.dispensingNumber,
          d.prescriptionNumber,
        ]),
      };
    });
  }

  private async searchSuppliers(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'PHARMACY') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const docs = await applyTimeout<any[]>(
      SupplierModel.find({
        pharmacyId: new Types.ObjectId(actor.userId),
        $or: [{ name: regex }, { supplierCode: regex }],
      })
        .select('_id name supplierCode status')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((s) => {
      const id = String(s._id);
      return {
        id,
        resourceType: 'supplier',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.supplier,
        title: s.name || 'Supplier',
        description: s.supplierCode ? `Supplier Code: ${s.supplierCode}` : 'Pharmacy Supplier',
        status: s.status || 'ACTIVE',
        sourceModule: 'PHARMACY',
        destinationRoute: '/pharmacy/suppliers',
        metadata: { supplierCode: s.supplierCode },
        score: computeMatchScore(filter.query, s.name || '', [id, s.supplierCode]),
      };
    });
  }

  private async searchLabSamples(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'LABORATORY') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      laboratoryId: new Types.ObjectId(actor.userId),
      $or: [{ sampleBarcode: regex }, { specimenType: regex }],
    };
    if (filter.status) query.status = filter.status.toUpperCase();

    const docs = await applyTimeout<any[]>(
      LabSampleModel.find(query)
        .select('_id sampleBarcode specimenType status collectedAt')
        .sort({ collectedAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((s) => {
      const id = String(s._id);
      return {
        id,
        resourceType: 'lab_sample',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.lab_sample,
        title: `Sample ${s.sampleBarcode || id.slice(-6)}`,
        description: `Specimen: ${s.specimenType || 'Diagnostic'} • Status: ${s.status}`,
        date: s.collectedAt ? new Date(s.collectedAt).toISOString() : undefined,
        status: s.status,
        sourceModule: 'LABORATORY',
        destinationRoute: '/laboratory/samples',
        metadata: { barcode: s.sampleBarcode, specimenType: s.specimenType },
        score: computeMatchScore(filter.query, s.sampleBarcode || '', [id, s.sampleBarcode]),
      };
    });
  }

  private async searchLabTests(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'LABORATORY') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      laboratoryId: new Types.ObjectId(actor.userId),
      $or: [{ testName: regex }, { testCode: regex }, { category: regex }],
    };
    if (filter.category) query.category = buildSafeContainsRegex(filter.category);

    const docs = await applyTimeout<any[]>(
      LabTestModel.find(query)
        .select('_id testCode testName category isActive')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((t) => {
      const id = String(t._id);
      return {
        id,
        resourceType: 'lab_test',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.lab_test,
        title: `${t.testName} (${t.testCode})`,
        description: `Diagnostic Test • Category: ${t.category || 'General'}`,
        status: t.isActive === false ? 'INACTIVE' : 'ACTIVE',
        sourceModule: 'LABORATORY',
        destinationRoute: '/laboratory/tests',
        metadata: { testCode: t.testCode, category: t.category },
        score: computeMatchScore(filter.query, t.testName || '', [id, t.testCode], t.category || ''),
      };
    });
  }

  private async searchExternalRecords(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      reviewStatus: { $in: ['IMPORTED_VERIFIED', 'APPROVED_AFTER_REVIEW'] },
      $or: [
        { sourceOrganizationName: regex },
        { hiType: regex },
        { internalImportRef: regex },
        { 'summary.title': regex },
      ],
    };

    if (actor.role === 'PATIENT') {
      query.patientId = new Types.ObjectId(actor.userId);
    } else if (actor.role === 'DOCTOR') {
      // Doctor can ONLY search external ABDM records covered by an active GRANTED ABDM consent artefact
      const activeArtefacts = await applyTimeout<any[]>(
        AbdmConsentArtefactModel.find({
          externalStatus: 'GRANTED',
          revocationStatus: 'NOT_REVOKED',
          expiresAt: { $gt: new Date() },
        })
          .select('_id')
          .limit(200)
          .lean()
      );
      const allowedIds = (activeArtefacts || []).map((a) => String(a._id));
      if (allowedIds.length === 0) return [];
      query.consentArtefactId = { $in: allowedIds };
    } else {
      return [];
    }

    const docs = await applyTimeout<any[]>(
      AbdmImportedRecordModel.find(query)
        .select('_id internalImportRef sourceOrganizationName hiType importedAt reviewStatus isMocked summary.title')
        .sort({ importedAt: -1 })
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((ext) => {
      const id = String(ext._id);
      const title = ext.summary?.title || `${ext.hiType} External Record`;
      return {
        id,
        resourceType: 'external_record',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.external_record,
        title,
        description: `ABDM External (${ext.sourceOrganizationName}) • ${ext.hiType}`,
        date: ext.importedAt ? new Date(ext.importedAt).toISOString() : undefined,
        status: ext.reviewStatus,
        sourceModule: 'ABDM',
        destinationRoute:
          actor.role === 'PATIENT' ? '/patient/abdm/health-records' : '/doctor/abdm/health-records',
        metadata: {
          referenceNumber: ext.internalImportRef,
          hiType: ext.hiType,
          isMocked: Boolean(ext.isMocked),
          readOnly: true,
        },
        score: computeMatchScore(
          filter.query,
          title,
          [id, ext.internalImportRef],
          `${ext.sourceOrganizationName} ${ext.hiType}`
        ),
      };
    });
  }

  private async searchAdminUsers(
    actor: SearchActorContext,
    filter: SearchRepositoryFilter
  ): Promise<GlobalSearchResultItemDto[]> {
    if (actor.role !== 'ADMIN') return [];
    const regex = buildSafeContainsRegex(filter.query);
    const query: Record<string, unknown> = {
      $or: [{ name: regex }, { email: regex }, { role: regex }],
    };
    if (filter.status === 'ACTIVE') query.isActive = true;
    if (filter.status === 'INACTIVE') query.isActive = false;

    // STRICT: NEVER select password, refreshTokens, verification tokens, or clinical fields
    const docs = await applyTimeout<any[]>(
      UserModel.find(query)
        .select('_id name role isActive createdAt')
        .limit(PER_COLLECTION_CAP)
        .lean()
    );

    return (docs || []).map((u) => {
      const id = String(u._id);
      return {
        id,
        resourceType: 'user',
        categoryGroup: RESOURCE_TYPE_TO_CATEGORY_GROUP.user,
        title: u.name || 'Platform User',
        description: `Platform Account • Role: ${u.role}`,
        date: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
        status: u.isActive === false ? 'INACTIVE' : 'ACTIVE',
        sourceModule: 'ADMIN',
        destinationRoute: '/admin/platform-overview',
        metadata: { role: u.role },
        score: computeMatchScore(filter.query, u.name || '', [id], u.role || ''),
      };
    });
  }
}

export const searchRepository = new SearchRepository();

/**
 * HealthBridge India — Doctor-to-Laboratory Order Integration Service (Day 8 Task 01)
 *
 * Bridges Clinical Encounters & Doctors directly to the Laboratory Order pipeline:
 *   1. Validates authoritative patient existence (`User._id`, role: 'PATIENT')
 *   2. Enforces fail-closed doctor-patient clinical relationship or active consent
 *   3. Validates optional `encounterId` ownership & patient match
 *   4. Prevents duplicate lab order submissions via `idempotencyKey`
 *   5. Creates `LaboratoryOrderModel` with initial `statusHistory`
 *   6. Emits privacy-safe `LAB_ORDER_CREATED` domain events to Patient & target Laboratory
 */

import crypto from 'crypto';
import { Types } from 'mongoose';
import type { CreateDoctorLabOrderDto } from '@healthbridge/shared-types';
import { UserModel } from '../../users/models/user.model';
import { DoctorProfileModel } from '../../users/models/doctor-profile.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { EncounterModel } from '../../healthcare/models/encounter.model';
import { ConsentArtifactModel } from '../../consent/models/consent-artifact.model';
import { LaboratoryOrderModel } from '../../healthcare/models/lab-order.model';
import { platformEventService } from './platform-event.service';
import { AppError } from '../../../shared/errors/app-error';

export class DoctorLabOrderService {
  private async resolveDoctorIds(doctorUserId: string): Promise<Types.ObjectId[]> {
    const userObjId = new Types.ObjectId(doctorUserId);
    const profile = await DoctorProfileModel.findOne({ userId: userObjId }).select('_id').lean();
    const ids: Types.ObjectId[] = [userObjId];
    if (profile?._id && !new Types.ObjectId(String(profile._id)).equals(userObjId)) {
      ids.push(new Types.ObjectId(String(profile._id)));
    }
    return ids;
  }

  async createLabOrder(params: {
    doctorUserId: string;
    doctorName?: string;
    dto: CreateDoctorLabOrderDto;
    requestId?: string;
  }) {
    const { doctorUserId, dto } = params;
    const patientObjectId = new Types.ObjectId(dto.patientId);
    const doctorIds = await this.resolveDoctorIds(doctorUserId);

    // 1. Validate authoritative patient exists
    const patientUser = await UserModel.findOne({
      _id: patientObjectId,
      role: 'PATIENT',
    })
      .select('_id name')
      .lean();
    if (!patientUser) {
      throw AppError.notFound('Authoritative patient record not found');
    }

    // 2. Validate encounter ownership if encounterId supplied
    if (dto.encounterId) {
      const encounter = await EncounterModel.findOne({
        _id: new Types.ObjectId(dto.encounterId),
        patientId: patientObjectId,
        practitionerId: { $in: doctorIds },
      }).lean();
      if (!encounter) {
        throw AppError.forbidden(
          'Access denied: Referenced clinical encounter does not belong to this doctor and patient.'
        );
      }
    } else {
      // Otherwise require an appointment, prior encounter, or active consent
      const [hasApt, hasEnc, hasConsent] = await Promise.all([
        AppointmentModel.exists({ doctorId: { $in: doctorIds }, patientId: patientObjectId }),
        EncounterModel.exists({ practitionerId: { $in: doctorIds }, patientId: patientObjectId }),
        ConsentArtifactModel.exists({
          patientId: patientObjectId,
          grantedTo: { $in: doctorIds },
          status: 'ACTIVE',
          expiresAt: { $gt: new Date() },
        }),
      ]);
      if (!hasApt && !hasEnc && !hasConsent) {
        throw AppError.forbidden(
          'Access denied: Doctor lacks an active clinical relationship or consent to order lab tests for this patient.'
        );
      }
    }

    // 3. Idempotent duplicate order guard
    if (dto.idempotencyKey) {
      const existing = await LaboratoryOrderModel.findOne({
        patientId: patientObjectId,
        orderedBy: new Types.ObjectId(doctorUserId),
        idempotencyKey: dto.idempotencyKey,
      }).lean();
      if (existing) {
        return existing;
      }
    }

    // 4. Validate optional target laboratory user if provided
    let laboratoryObjectId: Types.ObjectId | undefined;
    if (dto.laboratoryId) {
      const labUser = await UserModel.findOne({
        _id: new Types.ObjectId(dto.laboratoryId),
        role: 'LABORATORY',
        isActive: true,
      })
        .select('_id')
        .lean();
      if (!labUser) {
        throw AppError.badRequest('Specified laboratory participant does not exist or is inactive');
      }
      laboratoryObjectId = new Types.ObjectId(dto.laboratoryId);
    }

    const orderNumber = `LAB-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const orderDoc = await LaboratoryOrderModel.create({
      orderNumber,
      patientId: patientObjectId,
      orderedBy: new Types.ObjectId(doctorUserId),
      encounterId: dto.encounterId ? new Types.ObjectId(dto.encounterId) : undefined,
      laboratoryId: laboratoryObjectId,
      facilityId: dto.facilityId ? new Types.ObjectId(dto.facilityId) : undefined,
      idempotencyKey: dto.idempotencyKey,
      tests: dto.tests.map((t) => ({
        testCode: t.testCode,
        testName: t.testName,
        category: t.category,
        specimenType: t.specimenType as any,
        instructions: t.instructions,
      })),
      status: 'ORDERED',
      priority: dto.priority || 'ROUTINE',
      orderedAt: new Date(),
      requestedCollectionDate: dto.requestedCollectionDate
        ? new Date(dto.requestedCollectionDate)
        : undefined,
      clinicalNotes: dto.clinicalNotes,
      statusHistory: [
        {
          status: 'ORDERED',
          changedBy: new Types.ObjectId(doctorUserId),
          changedByName: params.doctorName || 'Ordering Clinician',
          timestamp: new Date(),
          reason: dto.encounterId
            ? `Ordered during clinical encounter ${dto.encounterId}`
            : 'Ordered by authorized clinician',
        },
      ],
    });

    // 5. Emit privacy-safe LAB_ORDER_CREATED domain event
    const recipients: Array<{ userId: string; role: 'PATIENT' | 'LABORATORY' }> = [
      { userId: dto.patientId, role: 'PATIENT' },
    ];
    if (dto.laboratoryId) {
      recipients.push({ userId: dto.laboratoryId, role: 'LABORATORY' });
    }

    await platformEventService.emit({
      eventType: 'LAB_ORDER_CREATED',
      sourceModule: 'LABORATORY',
      actorId: doctorUserId,
      actorRole: 'DOCTOR',
      recipients,
      title: `New Laboratory Order (${orderNumber})`,
      message: `A diagnostic laboratory order (${orderNumber}) with ${dto.tests.length} test(s) has been created. Sign in to view details.`,
      priority: dto.priority === 'STAT' || dto.priority === 'EMERGENCY' ? 'HIGH' : 'MEDIUM',
      relatedEntity: {
        entityType: 'LaboratoryOrder',
        entityId: String(orderDoc._id),
        referenceNumber: orderNumber,
      },
      linkUrl: '/patient/lab-orders',
      correlationId: params.requestId,
      stateTransition: { to: 'ORDERED' },
    });

    return orderDoc;
  }
}

export const doctorLabOrderService = new DoctorLabOrderService();

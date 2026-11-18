/**
 * HealthBridge India — Unified Patient Identity Service (Day 8 Task 01)
 *
 * Enforces the authoritative internal patient identity invariant:
 *   - `User._id` (role: 'PATIENT') is the single authoritative internal primary key across
 *     Appointments, Encounters, Prescriptions, Lab Orders, Lab Reports, Dispensing, Consents,
 *     Medical Records, and ABDM mappings.
 *   - ABHA (`AbhaLinkModel`) is strictly an external identity association — NEVER the MongoDB PK.
 *   - Accounts with similar demographics (name + DOB) are flagged for authorized human review
 *     (`duplicateAccountReview.flaggedForReview`) and NEVER merged automatically.
 */

import { Types } from 'mongoose';
import type { UnifiedPatientIdentitySummaryDto } from '@healthbridge/shared-types';
import { UserModel } from '../../users/models/user.model';
import { PatientProfileModel } from '../../users/models/patient-profile.model';
import { AbhaLinkModel } from '../../abdm/models/abha-link.model';
import { AppError } from '../../../shared/errors/app-error';

export class PlatformIdentityService {
  async resolveUnifiedPatientIdentity(patientId: string): Promise<UnifiedPatientIdentitySummaryDto> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw AppError.badRequest('Invalid authoritative patient identifier format');
    }

    const patientObjectId = new Types.ObjectId(patientId);

    const [user, profile, activeAbhaLink, abhaHistoryCount] = await Promise.all([
      UserModel.findOne({ _id: patientObjectId, role: 'PATIENT' })
        .select('name email phone isActive createdAt')
        .lean(),
      PatientProfileModel.findOne({ userId: patientObjectId }).lean(),
      AbhaLinkModel.findOne({
        patientId: patientObjectId,
        isActive: true,
      }).lean(),
      AbhaLinkModel.countDocuments({ patientId: patientObjectId }),
    ]);

    if (!user) {
      throw AppError.notFound('Authoritative patient record not found');
    }

    // Non-destructive duplicate demographic detection (NEVER auto-merges!)
    let potentialMatchCount = 0;
    if (profile?.dateOfBirth && user.name) {
      const sameDobProfiles = await PatientProfileModel.find({
        userId: { $ne: patientObjectId },
        dateOfBirth: profile.dateOfBirth,
      })
        .select('userId')
        .limit(10)
        .lean();

      if (sameDobProfiles.length > 0) {
        const candidateIds = sameDobProfiles.map((p) => p.userId);
        potentialMatchCount = await UserModel.countDocuments({
          _id: { $in: candidateIds },
          role: 'PATIENT',
          name: { $regex: `^${user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
      }
    }

    return {
      authoritativePatientId: String(user._id),
      name: user.name || 'Patient',
      email: user.email,
      phone: user.phone,
      gender: profile?.gender,
      dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString() : undefined,
      bloodGroup: profile?.bloodGroup,
      externalAbha: {
        linked: Boolean(activeAbhaLink && activeAbhaLink.verificationStatus === 'VERIFIED'),
        verificationStatus: activeAbhaLink?.verificationStatus || 'NOT_LINKED',
        maskedAbhaNumber: activeAbhaLink?.abhaNumberMasked,
        abhaAddress: activeAbhaLink?.abhaAddress,
        linkHistoryCount: abhaHistoryCount,
        isMocked: activeAbhaLink?.isMocked,
      },
      duplicateAccountReview: {
        flaggedForReview: potentialMatchCount > 0,
        potentialMatchCount,
        autoMergeAllowed: false,
        note:
          potentialMatchCount > 0
            ? 'Potential demographic match detected; authorized manual identity review is required. Accounts are never merged automatically.'
            : 'No duplicate demographic matches detected.',
      },
    };
  }
}

export const platformIdentityService = new PlatformIdentityService();

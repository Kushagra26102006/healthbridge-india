/**
 * HealthBridge India — ABDM Health Information Exchange (HIP / HIU) Adapter Foundation (Day 7 Task 01)
 *
 * Architectural boundary for future Milestone 2 (HIP) and Milestone 3 (HIU) workflows.
 * Live health information transfer and Fidelius ECDH Curve25519 (short Weierstrass) +
 * HKDF-SHA256 + AES-256-GCM encryption are intentionally NOT enabled until official
 * ABDM sandbox onboarding and security verification complete.
 */

import type { AbdmIntegrationStatus } from '@healthbridge/shared-types';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface AbdmHieRoleReadiness {
  role: 'HIP' | 'HIU';
  status: AbdmIntegrationStatus;
  encryptionProtocolTarget: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM';
  prerequisites: string[];
  liveTransferEnabled: false;
}

export class AbdmHealthInformationAdapter {
  getHipReadiness(): AbdmHieRoleReadiness {
    return {
      role: 'HIP',
      status: 'PENDING_ONBOARDING',
      encryptionProtocolTarget: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM',
      prerequisites: [
        'Sandbox organization & bridge onboarding',
        'Test Health Facility Registry (HFR) Facility ID',
        'Milestone 1 (ABHA verification) completion',
        'NRCeS FHIR R4 Document Bundle validation via HAPI FHIR CLI',
        'Fidelius Curve25519 (Weierstrass form) encryption integration & test vectors',
      ],
      liveTransferEnabled: false,
    };
  }

  getHiuReadiness(): AbdmHieRoleReadiness {
    return {
      role: 'HIU',
      status: 'PENDING_ONBOARDING',
      encryptionProtocolTarget: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM',
      prerequisites: [
        'Sandbox HIU role registration & bridge callback configuration',
        'Consent Manager (HIE-CM) V3 consent-request & on-notify integration',
        'Ephemeral ECDH key-pair generation & Fidelius bundle decryption service',
        'Clinician-facing external FHIR bundle viewer with consent expiry enforcement',
      ],
      liveTransferEnabled: false,
    };
  }

  /**
   * Explicit guard preventing accidental invocation of live HIP/HIU data exchange
   * during the Day 7 Task 01 foundation phase.
   */
  assertLiveTransferDisabled(operation: string): never {
    throw new AbdmIntegrationError({
      message: `ABDM live health information exchange operation '${operation}' is not enabled in Day 7 Task 01 foundation mode. Complete sandbox onboarding and Milestone 2/3 implementation first.`,
      abdmCode: 'ABDM_NOT_IMPLEMENTED_LIVE',
      statusCode: 501,
    });
  }
}

export const abdmHealthInformationAdapter = new AbdmHealthInformationAdapter();

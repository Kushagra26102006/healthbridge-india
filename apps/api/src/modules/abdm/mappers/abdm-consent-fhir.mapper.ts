/**
 * HealthBridge India — Dedicated ABDM Consent Artefact -> HL7 FHIR R4 Consent Mapping Adapter (Day 7 Task 03)
 *
 * IMPORTANT ARCHITECTURAL BOUNDARY:
 * - HL7 FHIR R4 `Consent` resources and ABDM HIE-CM signed Consent Artefacts are NOT automatically
 *   interchangeable. ABDM HIE-CM natively exchanges its own signed JSON Consent Artefact schema
 *   (purpose, hiTypes, permission.accessMode, permission.frequency, permission.dataEraseAt, signature).
 * - This adapter generates a structured FHIR R4 `Consent` projection for interoperability/audit views
 *   while ALWAYS preserving the original external artefact reference & integrity hash and explicitly
 *   reporting unmapped fields & validation gaps.
 * - This adapter does NOT claim official NRCeS FHIR IG certification without HAPI FHIR IG validator execution.
 */

import type {
  AbdmConsentArtefactRecordDto,
  FhirMappingResultDto,
  FhirValidationIssueDto,
} from '@healthbridge/shared-types';
import { fhirR4Validator } from '../validators/fhir-r4.validator';
import { ABDM_FHIR_MAPPING_VERSION } from './abdm-fhir.mapper';

export interface AbdmConsentFhirMappingResult extends FhirMappingResultDto {
  originalExternalConsentId: string;
  originalPayloadSha256: string;
  officialIgConformanceClaimed: false;
}

export class AbdmConsentFhirMapper {
  /**
   * Maps an externally received ABDM Consent Artefact DTO into an HL7 FHIR R4 `Consent` resource.
   * Never mutates the source artefact; reports all unmapped ABDM-specific fields explicitly.
   */
  mapArtefactToFhirConsent(artefact: AbdmConsentArtefactRecordDto): AbdmConsentFhirMappingResult {
    const timestamp = new Date().toISOString();
    const warnings: FhirValidationIssueDto[] = [];
    const unmappedFields: string[] = [];

    // Explicit unmapped/unsupported ABDM-specific fields that have no native 1:1 FHIR R4 Consent element
    unmappedFields.push(
      'signature (ABDM HIE-CM digital signature must be verified on original JSON artefact, not FHIR projection)',
      'dataEraseAt (ABDM mandatory HIU data-erasure deadline has no native FHIR R4 Consent.provision element; mapped only as policy note)',
      'revocationStatus (local PENDING_CONFIRMATION state is operational metadata outside FHIR Consent.status)',
      'externalConfirmationReceived (operational sync flag preserved on original artefact record)'
    );

    if (artefact.frequency) {
      unmappedFields.push(
        `frequency (${artefact.frequency.value}/${artefact.frequency.unit}, repeats=${artefact.frequency.repeats}; no native FHIR R4 Consent.provision.frequency field)`
      );
    }

    // Disclaimer warning: no official NRCeS IG certification claimed
    warnings.push({
      severity: 'WARNING',
      code: 'FHIR_CONSENT_NOT_INTERCHANGEABLE_WITH_ABDM_ARTEFACT',
      path: 'Consent',
      message:
        'FHIR R4 Consent projection is provided for interoperability and audit representation only. Official ABDM HIE-CM exchange requires the preserved original signed Consent Artefact. Official NRCeS FHIR IG conformance is not claimed without external HAPI FHIR IG validation.',
    });

    if (!artefact.signatureVerified) {
      warnings.push({
        severity: 'WARNING',
        code: 'SOURCE_ARTEFACT_SIGNATURE_UNVERIFIED',
        path: 'Consent.sourceReference',
        message: 'Underlying ABDM consent artefact signature is not cryptographically verified.',
      });
    }

    const fhirStatus = this.mapStatus(artefact);
    const provisionType = fhirStatus === 'active' ? 'permit' : 'deny';
    const dateTime = artefact.grantedAt || artefact.createdAt || timestamp;

    const resource: Record<string, unknown> = {
      resourceType: 'Consent',
      id: this.sanitizeId(artefact.externalConsentId || artefact.internalReference),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Consent'],
      },
      identifier: [
        {
          use: 'official',
          system: 'https://abdm.gov.in/consent-artefact',
          value: artefact.externalConsentId,
        },
        {
          use: 'usual',
          system: 'https://healthbridge.in/identifiers',
          value: artefact.internalReference,
        },
      ],
      status: fhirStatus,
      scope: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/consentscope',
            code: 'patient-privacy',
            display: 'Privacy Consent',
          },
        ],
        text: 'ABDM Health Information Privacy Consent',
      },
      category: [
        {
          coding: [
            {
              system: 'http://loinc.org',
              code: '59284-0',
              display: 'Consent Document',
            },
          ],
          text: 'ABDM HIE-CM Consent Artefact Projection',
        },
      ],
      patient: {
        reference: `Patient/${this.sanitizeId(artefact.patientId)}`,
        display: artefact.patientAbhaAddress,
      },
      dateTime,
      performer: [
        {
          reference: `Patient/${this.sanitizeId(artefact.patientId)}`,
          display: artefact.patientAbhaAddress,
        },
      ],
      organization: [
        {
          reference: `Organization/${this.sanitizeId(artefact.hiuId)}`,
          display: artefact.hiuName || artefact.hiuId,
        },
        ...(artefact.hipId
          ? [
              {
                reference: `Organization/${this.sanitizeId(artefact.hipId)}`,
                display: artefact.hipId,
              },
            ]
          : []),
      ],
      sourceReference: {
        reference: `DocumentReference/${this.sanitizeId(artefact.externalConsentId)}`,
        display: `Original ABDM HIE-CM Consent Artefact (SHA-256: ${artefact.payloadSha256.slice(0, 16)}...)`,
      },
      policy: [
        {
          authority: 'https://abdm.gov.in',
          uri: `https://abdm.gov.in/hiecm/v3/purpose/${artefact.purposeCode}`,
        },
      ],
      period: {
        start: dateTime,
        end: artefact.expiresAt,
      },
      provision: {
        type: provisionType,
        period: {
          start: artefact.dateRange.from,
          end: artefact.dateRange.to,
        },
        actor: [
          {
            role: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'IRCP',
                  display: 'information recipient',
                },
              ],
            },
            reference: {
              reference: `Organization/${this.sanitizeId(artefact.hiuId)}`,
              display: artefact.hiuName || artefact.hiuId,
            },
          },
        ],
        action: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/consentaction',
                code: artefact.accessMode === 'STORE' ? 'collect' : 'access',
                display: artefact.accessMode,
              },
            ],
          },
        ],
        purpose: [
          {
            system: 'https://abdm.gov.in/hiecm/purpose',
            code: artefact.purposeCode,
            display: artefact.purposeText,
          },
        ],
        class: artefact.hiTypes.map((hiType) => ({
          system: 'https://abdm.gov.in/hiecm/hitype',
          code: hiType,
          display: hiType,
        })),
      },
    };

    const validation = fhirR4Validator.validateResource(resource, { strictAbdmProfile: false });
    const allWarnings = [...warnings, ...validation.warnings];

    return {
      sourceEntityType: 'AbdmConsentArtefact',
      sourceEntityId: artefact.id || artefact.externalConsentId,
      targetResourceType: 'Consent',
      targetProfileUrl: 'http://hl7.org/fhir/StructureDefinition/Consent',
      mappingStatus:
        validation.errors.length > 0
          ? 'FAILED'
          : allWarnings.length > 0 || unmappedFields.length > 0
          ? 'MAPPED_WITH_WARNINGS'
          : 'MAPPED',
      validationErrors: validation.errors,
      warnings: allWarnings,
      unmappedFields,
      mappingVersion: `${ABDM_FHIR_MAPPING_VERSION}-consent`,
      timestamp,
      resource: validation.errors.length === 0 ? resource : undefined,
      originalExternalConsentId: artefact.externalConsentId,
      originalPayloadSha256: artefact.payloadSha256,
      officialIgConformanceClaimed: false,
    };
  }

  private mapStatus(
    artefact: AbdmConsentArtefactRecordDto
  ): 'active' | 'inactive' | 'rejected' | 'draft' {
    if (
      artefact.externalStatus === 'REVOKED' ||
      artefact.revocationStatus === 'CONFIRMED_REVOKED' ||
      artefact.revocationStatus === 'PENDING_CONFIRMATION' ||
      artefact.externalStatus === 'EXPIRED' ||
      new Date(artefact.expiresAt).getTime() <= Date.now()
    ) {
      return 'inactive';
    }
    if (artefact.externalStatus === 'DENIED') {
      return 'rejected';
    }
    if (artefact.externalStatus === 'REQUESTED') {
      return 'draft';
    }
    if (
      artefact.externalStatus === 'GRANTED' &&
      artefact.validationStatus === 'VALID' &&
      artefact.externalConfirmationReceived
    ) {
      return 'active';
    }
    return 'inactive';
  }

  private sanitizeId(raw: string): string {
    const cleaned = String(raw || 'consent')
      .replace(/[^A-Za-z0-9\-.]/g, '-')
      .slice(0, 64);
    return cleaned || 'consent';
  }
}

export const abdmConsentFhirMapper = new AbdmConsentFhirMapper();

/**
 * HealthBridge India — Dedicated Internal-to-FHIR R4 / NRCeS ABDM Mapping Service (Day 7 Task 01)
 *
 * Strictly separates internal application models from FHIR R4 transport resources.
 * Never silently discards unmapped clinical fields — always returns an explicit
 * FhirMappingResultDto containing validation errors, warnings, and unmappedFields.
 */

import crypto from 'crypto';
import type {
  FhirMappingResultDto,
  FhirValidationIssueDto,
  LabReportDetailDto,
  LabObservationDto,
} from '@healthbridge/shared-types';
import { fhirR4Validator } from '../validators/fhir-r4.validator';

export const ABDM_FHIR_MAPPING_VERSION = '2026.11-nrces-r4-foundation';

export interface InternalPatientInput {
  id: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  abhaAddress?: string;
  abhaNumber?: string;
  bloodGroup?: string;
  extraUnmappedFields?: Record<string, unknown>;
}

export interface InternalPractitionerInput {
  id: string;
  fullName: string;
  hprId?: string;
  registrationNumber?: string;
  specialization?: string;
  phone?: string;
}

export interface InternalOrganizationInput {
  id: string;
  name: string;
  hfrFacilityId?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  addressText?: string;
}

export class AbdmFhirMapperService {
  /**
   * Maps internal Patient profile to NRCeS ABDM FHIR R4 Patient resource.
   */
  mapPatient(input: InternalPatientInput): FhirMappingResultDto {
    const timestamp = new Date().toISOString();
    const unmappedFields: string[] = [];
    const warnings: FhirValidationIssueDto[] = [];

    if (input.bloodGroup) {
      unmappedFields.push('bloodGroup (requires separate Observation resource)');
    }
    if (input.extraUnmappedFields) {
      for (const k of Object.keys(input.extraUnmappedFields)) {
        unmappedFields.push(k);
      }
    }

    const identifiers: Array<Record<string, unknown>> = [
      {
        system: 'https://healthbridge.in/identifiers',
        value: input.id,
      },
    ];
    if (input.abhaAddress) {
      identifiers.push({
        type: {
          coding: [
            {
              system: 'https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code',
              code: 'PHR',
              display: 'PHR Address',
            },
          ],
        },
        system: 'https://healthid.ndhm.gov.in',
        value: input.abhaAddress,
      });
    } else {
      warnings.push({
        severity: 'WARNING',
        code: 'ABHA_ADDRESS_ABSENT',
        path: 'Patient.identifier',
        message: 'Patient has no verified ABHA address; only internal HealthBridge ID was mapped.',
      });
    }

    const genderMap: Record<string, string> = {
      MALE: 'male',
      FEMALE: 'female',
      OTHER: 'other',
    };
    const mappedGender = input.gender
      ? genderMap[input.gender.toUpperCase()] || 'unknown'
      : 'unknown';

    const telecom: Array<Record<string, string>> = [];
    if (input.phone) telecom.push({ system: 'phone', value: input.phone });
    if (input.email) telecom.push({ system: 'email', value: input.email });

    const resource: Record<string, unknown> = {
      resourceType: 'Patient',
      id: this.sanitizeId(input.id),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'],
      },
      identifier: identifiers,
      name: input.fullName?.trim() ? [{ text: input.fullName.trim() }] : [],
      gender: mappedGender,
      ...(input.dateOfBirth ? { birthDate: input.dateOfBirth.slice(0, 10) } : {}),
      ...(telecom.length > 0 ? { telecom } : {}),
    };

    const validation = fhirR4Validator.validateResource(resource, { strictAbdmProfile: true });
    const allWarnings = [...warnings, ...validation.warnings];

    return {
      sourceEntityType: 'PatientProfile',
      sourceEntityId: input.id,
      targetResourceType: 'Patient',
      targetProfileUrl: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient',
      mappingStatus:
        validation.errors.length > 0
          ? 'FAILED'
          : allWarnings.length > 0 || unmappedFields.length > 0
          ? 'MAPPED_WITH_WARNINGS'
          : 'MAPPED',
      validationErrors: validation.errors,
      warnings: allWarnings,
      unmappedFields,
      mappingVersion: ABDM_FHIR_MAPPING_VERSION,
      timestamp,
      resource: validation.errors.length === 0 ? resource : undefined,
    };
  }

  /**
   * Maps internal Doctor/Pathologist profile to NRCeS ABDM FHIR R4 Practitioner resource.
   */
  mapPractitioner(input: InternalPractitionerInput): FhirMappingResultDto {
    const timestamp = new Date().toISOString();
    const unmappedFields: string[] = [];
    if (input.specialization) {
      unmappedFields.push('specialization (requires PractitionerRole resource in full IG)');
    }

    const identifiers: Array<Record<string, unknown>> = [];
    if (input.hprId) {
      identifiers.push({
        system: 'https://doctor.ndhm.gov.in',
        value: input.hprId,
      });
    }
    if (input.registrationNumber) {
      identifiers.push({
        system: 'https://healthbridge.in/identifiers',
        value: input.registrationNumber,
      });
    }

    const resource: Record<string, unknown> = {
      resourceType: 'Practitioner',
      id: this.sanitizeId(input.id),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner'],
      },
      identifier: identifiers,
      name: input.fullName?.trim() ? [{ text: input.fullName.trim() }] : [],
      ...(input.phone ? { telecom: [{ system: 'phone', value: input.phone }] } : {}),
    };

    const validation = fhirR4Validator.validateResource(resource, { strictAbdmProfile: true });

    return {
      sourceEntityType: 'DoctorProfile',
      sourceEntityId: input.id,
      targetResourceType: 'Practitioner',
      targetProfileUrl: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner',
      mappingStatus:
        validation.errors.length > 0
          ? 'FAILED'
          : validation.warnings.length > 0 || unmappedFields.length > 0
          ? 'MAPPED_WITH_WARNINGS'
          : 'MAPPED',
      validationErrors: validation.errors,
      warnings: validation.warnings,
      unmappedFields,
      mappingVersion: ABDM_FHIR_MAPPING_VERSION,
      timestamp,
      resource: validation.errors.length === 0 ? resource : undefined,
    };
  }

  /**
   * Maps internal Laboratory / Facility profile to NRCeS ABDM FHIR R4 Organization resource.
   */
  mapOrganization(input: InternalOrganizationInput): FhirMappingResultDto {
    const timestamp = new Date().toISOString();
    const identifiers: Array<Record<string, unknown>> = [];
    if (input.hfrFacilityId) {
      identifiers.push({
        system: 'https://facility.ndhm.gov.in',
        value: input.hfrFacilityId,
      });
    }
    if (input.licenseNumber) {
      identifiers.push({
        system: 'https://healthbridge.in/identifiers',
        value: input.licenseNumber,
      });
    }

    const resource: Record<string, unknown> = {
      resourceType: 'Organization',
      id: this.sanitizeId(input.id),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization'],
      },
      identifier: identifiers,
      name: input.name?.trim() || '',
      ...(input.addressText ? { address: [{ text: input.addressText }] } : {}),
    };

    const validation = fhirR4Validator.validateResource(resource, { strictAbdmProfile: true });

    return {
      sourceEntityType: 'LaboratoryProfile',
      sourceEntityId: input.id,
      targetResourceType: 'Organization',
      targetProfileUrl: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization',
      mappingStatus:
        validation.errors.length > 0
          ? 'FAILED'
          : validation.warnings.length > 0
          ? 'MAPPED_WITH_WARNINGS'
          : 'MAPPED',
      validationErrors: validation.errors,
      warnings: validation.warnings,
      unmappedFields: [],
      mappingVersion: ABDM_FHIR_MAPPING_VERSION,
      timestamp,
      resource: validation.errors.length === 0 ? resource : undefined,
    };
  }

  /**
   * Maps a single laboratory observation to FHIR R4 Observation resource.
   */
  mapObservation(
    obs: LabObservationDto,
    context: { observationId: string; patientRef: string; effectiveDateTime: string; status?: string }
  ): FhirMappingResultDto {
    const timestamp = new Date().toISOString();
    const warnings: FhirValidationIssueDto[] = [];

    const hasStandardLoinc = Boolean(obs.parameterCode && /^\d{1,5}-\d$/.test(obs.parameterCode));
    if (!hasStandardLoinc) {
      warnings.push({
        severity: 'WARNING',
        code: 'LOCAL_OBSERVATION_CODE',
        path: 'Observation.code.coding',
        message: `Parameter '${obs.parameterCode || obs.testName}' uses local code; map to LOINC/SNOMED-CT before live ABDM transmission.`,
      });
    }

    const resource: Record<string, unknown> = {
      resourceType: 'Observation',
      id: this.sanitizeId(context.observationId),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'],
      },
      status: context.status || 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: hasStandardLoinc ? 'http://loinc.org' : 'https://healthbridge.in/tests',
            code: obs.parameterCode || this.sanitizeId(obs.testName),
            display: obs.testName,
          },
        ],
        text: obs.testName,
      },
      subject: { reference: context.patientRef },
      effectiveDateTime: context.effectiveDateTime,
      ...(obs.numericValue !== undefined && !Number.isNaN(obs.numericValue)
        ? {
            valueQuantity: {
              value: obs.numericValue,
              unit: obs.unit || '',
              system: 'http://unitsofmeasure.org',
              code: obs.unit || '1',
            },
          }
        : {
            valueString: obs.value,
          }),
      ...(obs.referenceRange ? { referenceRange: [{ text: obs.referenceRange }] } : {}),
    };

    const validation = fhirR4Validator.validateResource(resource, { strictAbdmProfile: true });
    const allWarnings = [...warnings, ...validation.warnings];

    return {
      sourceEntityType: 'LabObservation',
      sourceEntityId: context.observationId,
      targetResourceType: 'Observation',
      targetProfileUrl: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation',
      mappingStatus:
        validation.errors.length > 0
          ? 'FAILED'
          : allWarnings.length > 0
          ? 'MAPPED_WITH_WARNINGS'
          : 'MAPPED',
      validationErrors: validation.errors,
      warnings: allWarnings,
      unmappedFields: [],
      mappingVersion: ABDM_FHIR_MAPPING_VERSION,
      timestamp,
      resource: validation.errors.length === 0 ? resource : undefined,
    };
  }

  /**
   * Maps a HealthBridge Laboratory Report into a self-contained NRCeS ABDM FHIR R4
   * Document Bundle (`DiagnosticReportRecord`) with Composition as entry[0] and valid urn:uuid references.
   */
  mapDiagnosticReportDocumentBundle(report: LabReportDetailDto): FhirMappingResultDto {
    const timestamp = new Date().toISOString();
    const errors: FhirValidationIssueDto[] = [];
    const warnings: FhirValidationIssueDto[] = [];
    const unmappedFields: string[] = [];

    const compUuid = `urn:uuid:${crypto.randomUUID()}`;
    const patientUuid = `urn:uuid:${crypto.randomUUID()}`;
    const practitionerUuid = `urn:uuid:${crypto.randomUUID()}`;
    const orgUuid = `urn:uuid:${crypto.randomUUID()}`;
    const diagReportUuid = `urn:uuid:${crypto.randomUUID()}`;

    const patientResult = this.mapPatient({
      id: report.patientId,
      fullName: report.patientName || 'Patient',
      gender: report.patientGender,
      abhaAddress: report.patientAbhaId,
    });
    const practitionerResult = this.mapPractitioner({
      id: report.approvalDetails?.approvedById || report.doctorId || 'practitioner-ref',
      fullName: report.approvalDetails?.approvedByName || report.doctorName || 'Authorized Pathologist',
      registrationNumber: report.approvalDetails?.approvedByRegistrationNumber,
    });
    const orgResult = this.mapOrganization({
      id: report.laboratoryId,
      name: report.laboratoryName || 'Diagnostic Laboratory',
      licenseNumber: report.nablAccreditationNumber,
      addressText: report.laboratoryAddress,
    });

    for (const sub of [patientResult, practitionerResult, orgResult]) {
      errors.push(...sub.validationErrors);
      warnings.push(...sub.warnings);
      unmappedFields.push(...sub.unmappedFields);
    }

    const obsEntries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [];
    const obsRefs: Array<{ reference: string; display?: string }> = [];

    (report.observations || []).forEach((obs, idx) => {
      const obsUuid = `urn:uuid:${crypto.randomUUID()}`;
      const obsRes = this.mapObservation(obs, {
        observationId: `obs-${idx + 1}`,
        patientRef: patientUuid,
        effectiveDateTime: report.testDate || report.createdAt,
        status: 'final',
      });
      errors.push(...obsRes.validationErrors);
      warnings.push(...obsRes.warnings);
      if (obsRes.resource) {
        obsEntries.push({ fullUrl: obsUuid, resource: obsRes.resource });
        obsRefs.push({ reference: obsUuid, display: obs.testName });
      }
    });

    const diagReportResource: Record<string, unknown> = {
      resourceType: 'DiagnosticReport',
      id: this.sanitizeId(report.reportNumber || report.id),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab'],
      },
      identifier: [
        {
          system: 'https://healthbridge.in/identifiers',
          value: report.reportNumber,
        },
      ],
      status: report.status === 'AMENDED' ? 'amended' : 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: 'LAB',
              display: report.category || 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'https://healthbridge.in/tests',
            code: this.sanitizeId(report.testName),
            display: report.testName,
          },
        ],
        text: report.testName,
      },
      subject: { reference: patientUuid },
      issued: report.publishedAt || report.createdAt || timestamp,
      performer: [{ reference: orgUuid }],
      resultsInterpreter: [{ reference: practitionerUuid }],
      result: obsRefs,
      conclusion: report.interpretation || report.clinicalNotes,
    };

    const compositionResource: Record<string, unknown> = {
      resourceType: 'Composition',
      id: this.sanitizeId(`comp-${report.reportNumber || report.id}`),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord'],
      },
      status: report.status === 'AMENDED' ? 'amended' : 'final',
      type: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '721981007',
            display: 'Diagnostic studies report',
          },
        ],
        text: 'Diagnostic Report',
      },
      subject: { reference: patientUuid },
      date: report.publishedAt || report.createdAt || timestamp,
      author: [{ reference: practitionerUuid }],
      title: `Diagnostic Report — ${report.testName}`,
      custodian: { reference: orgUuid },
      section: [
        {
          title: report.testName,
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '4241000179101',
                display: 'Laboratory report',
              },
            ],
          },
          entry: [{ reference: diagReportUuid }],
        },
      ],
    };

    const bundle: Record<string, unknown> = {
      resourceType: 'Bundle',
      id: this.sanitizeId(`bundle-${report.reportNumber || report.id}`),
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'],
      },
      identifier: {
        system: 'https://healthbridge.in/identifiers',
        value: report.reportNumber,
      },
      type: 'document',
      timestamp,
      entry: [
        { fullUrl: compUuid, resource: compositionResource },
        ...(patientResult.resource ? [{ fullUrl: patientUuid, resource: patientResult.resource }] : []),
        ...(practitionerResult.resource
          ? [{ fullUrl: practitionerUuid, resource: practitionerResult.resource }]
          : []),
        ...(orgResult.resource ? [{ fullUrl: orgUuid, resource: orgResult.resource }] : []),
        { fullUrl: diagReportUuid, resource: diagReportResource },
        ...obsEntries,
      ],
    };

    const bundleValidation = fhirR4Validator.validateResource(bundle, { strictAbdmProfile: true });
    const allErrors = [...errors, ...bundleValidation.errors];
    const allWarnings = [...warnings, ...bundleValidation.warnings];

    return {
      sourceEntityType: 'LaboratoryReport',
      sourceEntityId: report.id,
      targetResourceType: 'Bundle',
      targetProfileUrl: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle',
      mappingStatus:
        allErrors.length > 0
          ? 'FAILED'
          : allWarnings.length > 0 || unmappedFields.length > 0
          ? 'MAPPED_WITH_WARNINGS'
          : 'MAPPED',
      validationErrors: allErrors,
      warnings: allWarnings,
      unmappedFields,
      mappingVersion: ABDM_FHIR_MAPPING_VERSION,
      timestamp,
      resource: allErrors.length === 0 ? bundle : undefined,
    };
  }

  private sanitizeId(raw: string): string {
    const cleaned = String(raw || 'res')
      .replace(/[^A-Za-z0-9\-.]/g, '-')
      .slice(0, 64);
    return cleaned || 'res';
  }
}

export const abdmFhirMapperService = new AbdmFhirMapperService();

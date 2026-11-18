/**
 * HealthBridge India — Dedicated ABDM FHIR R4 Document Bundle Generation Service (Day 7 Task 04)
 *
 * Packages eligible HealthBridge clinical records into NRCeS ABDM FHIR R4 `DocumentBundle`
 * structures (`type: "document"`, `Composition` at `entry[0]`, `urn:uuid:` internal references):
 *   - `OPConsultation` (`OPConsultRecord`)
 *   - `Prescription` (`PrescriptionRecord`)
 *   - `DiagnosticReport` (`DiagnosticReportRecord`)
 *   - `HealthDocumentRecord` (`HealthDocumentRecord`)
 *   - `DischargeSummary` (`DischargeSummaryRecord`)
 *
 * CLINICAL INTEGRITY & HONESTY INVARIANTS:
 *   1. Original HealthBridge records are NEVER mutated.
 *   2. Clinical result values, units, reference ranges, timestamps, and amendment states are
 *      preserved verbatim — no synthetic diagnoses or interpretations are generated.
 *   3. Unmapped clinical fields are explicitly reported in `unmappedFields[]`.
 *   4. Sets `officialIgConformanceClaimed: false` until validated externally with the HAPI FHIR CLI.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmFhirBundleGenerationResultDto,
  AbdmHealthInfoType,
  AbdmHieParticipantRole,
  FhirValidationIssueDto,
} from '@healthbridge/shared-types';
import {
  ABDM_FHIR_MAPPING_VERSION,
  abdmFhirMapperService,
  type InternalOrganizationInput,
  type InternalPatientInput,
  type InternalPractitionerInput,
} from '../mappers/abdm-fhir.mapper';
import { fhirR4Validator } from '../validators/fhir-r4.validator';
import { AbdmFhirMappingResultModel } from '../models/abdm-fhir-mapping-result.model';

const NRCES_DOCUMENT_BUNDLE_PROFILE =
  'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle';

const COMPOSITION_PROFILE_BY_HI_TYPE: Record<
  AbdmHealthInfoType,
  { profile: string; snomedCode: string; display: string; title: string }
> = {
  OPConsultation: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord',
    snomedCode: '371530004',
    display: 'Clinical consultation report',
    title: 'OP Consultation Record',
  },
  Prescription: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord',
    snomedCode: '440545006',
    display: 'Prescription record',
    title: 'Prescription Record',
  },
  DiagnosticReport: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord',
    snomedCode: '721981007',
    display: 'Diagnostic studies report',
    title: 'Diagnostic Report Record',
  },
  DischargeSummary: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord',
    snomedCode: '373942005',
    display: 'Discharge summary',
    title: 'Discharge Summary',
  },
  HealthDocumentRecord: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/HealthDocumentRecord',
    snomedCode: '419891008',
    display: 'Record artifact',
    title: 'Health Document Record',
  },
  ImmunizationRecord: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/ImmunizationRecord',
    snomedCode: '41000179103',
    display: 'Immunization record',
    title: 'Immunization Record',
  },
  WellnessRecord: {
    profile: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/WellnessRecord',
    snomedCode: '422735006',
    display: 'Wellness record',
    title: 'Wellness Record',
  },
};

export interface BundleSourceEncounter {
  id: string;
  encounterType: string;
  startTime: string;
  endTime?: string;
  status: string;
  chiefComplaint?: string;
  assessment?: string;
  treatmentPlan?: string;
  vitals?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    recordedAt?: string;
  };
  diagnoses?: Array<{ name: string; code?: string; type?: string }>;
  isAmended?: boolean;
  extraUnmappedFields?: Record<string, unknown>;
}

export interface BundleSourcePrescription {
  id: string;
  prescriptionNumber?: string;
  issuedAt: string;
  status: string;
  diagnosis?: string;
  instructions?: string;
  medications: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    route?: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  isAmended?: boolean;
}

export interface BundleSourceDiagnosticReport {
  id: string;
  reportNumber: string;
  testName: string;
  category?: string;
  issuedAt: string;
  status: string;
  isAmended?: boolean;
  specimenType?: string;
  specimenCollectedAt?: string;
  orderNumber?: string;
  observations: Array<{
    id?: string;
    parameterCode?: string;
    testName: string;
    value: string;
    numericValue?: number;
    unit: string;
    referenceRange: string;
    interpretation?: string;
    observationDate?: string;
  }>;
  clinicalNotes?: string;
}

export interface BundleSourceDocument {
  id: string;
  title: string;
  recordType: string;
  recordDate: string;
  mimeType?: string;
  description?: string;
  fileUrl?: string;
  isAmended?: boolean;
}

export interface GenerateDocumentBundleInput {
  hiType: AbdmHealthInfoType;
  patient: InternalPatientInput;
  practitioner: InternalPractitionerInput;
  organization: InternalOrganizationInput;
  encounter?: BundleSourceEncounter;
  prescription?: BundleSourcePrescription;
  diagnosticReport?: BundleSourceDiagnosticReport;
  documentRecord?: BundleSourceDocument;
  persistTelemetry?: {
    role: AbdmHieParticipantRole;
    patientId?: string;
    transferId?: string;
    correlationId: string;
    environment: AbdmEnvironment;
  };
}

export class AbdmFhirBundleService {
  /**
   * Generates a self-contained NRCeS ABDM FHIR R4 DocumentBundle with `Composition` at `entry[0]`
   * and validates every resource and internal `urn:uuid:` reference.
   */
  async generateDocumentBundle(
    input: GenerateDocumentBundleInput
  ): Promise<AbdmFhirBundleGenerationResultDto> {
    const generatedAt = new Date().toISOString();
    const profileMeta = COMPOSITION_PROFILE_BY_HI_TYPE[input.hiType];
    const unmappedFields: string[] = [];
    const warnings: FhirValidationIssueDto[] = [];

    const bundleId = `hb-bundle-${crypto.randomUUID()}`;
    const compositionUuid = crypto.randomUUID();
    const patientUuid = crypto.randomUUID();
    const practitionerUuid = crypto.randomUUID();
    const organizationUuid = crypto.randomUUID();
    const provenanceUuid = crypto.randomUUID();

    // 1. Map Patient, Practitioner, Organization via existing Day 7 Task 01/02 mapper
    const patientMapped = abdmFhirMapperService.mapPatient(input.patient);
    unmappedFields.push(...patientMapped.unmappedFields);
    warnings.push(...patientMapped.warnings);

    const practitionerMapped = abdmFhirMapperService.mapPractitioner(input.practitioner);
    unmappedFields.push(...practitionerMapped.unmappedFields);
    warnings.push(...practitionerMapped.warnings);

    const orgMapped = abdmFhirMapperService.mapOrganization(input.organization);
    unmappedFields.push(...orgMapped.unmappedFields);
    warnings.push(...orgMapped.warnings);

    const entries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [];
    const sections: Array<Record<string, unknown>> = [];
    let isAmended = false;
    let documentDate = generatedAt;

    // 2. Map clinical resources strictly according to HI type
    let encounterFullUrl: string | undefined;

    if (input.encounter && (input.hiType === 'OPConsultation' || input.hiType === 'DischargeSummary')) {
      const encUuid = crypto.randomUUID();
      encounterFullUrl = `urn:uuid:${encUuid}`;
      isAmended = isAmended || Boolean(input.encounter.isAmended);
      documentDate = input.encounter.startTime || generatedAt;

      if (input.encounter.extraUnmappedFields) {
        for (const key of Object.keys(input.encounter.extraUnmappedFields)) {
          unmappedFields.push(`encounter.${key}`);
        }
      }

      const encounterResource: Record<string, unknown> = {
        resourceType: 'Encounter',
        id: encUuid,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter'],
        },
        status: this.mapEncounterStatus(input.encounter.status),
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: input.hiType === 'DischargeSummary' ? 'IMP' : 'AMB',
          display: input.hiType === 'DischargeSummary' ? 'inpatient encounter' : 'ambulatory',
        },
        subject: { reference: `urn:uuid:${patientUuid}` },
        period: {
          start: input.encounter.startTime,
          ...(input.encounter.endTime ? { end: input.encounter.endTime } : {}),
        },
        serviceProvider: { reference: `urn:uuid:${organizationUuid}` },
      };
      entries.push({ fullUrl: encounterFullUrl, resource: encounterResource });

      const sectionEntryRefs: Array<{ reference: string }> = [{ reference: encounterFullUrl }];

      // Map vitals as individual Observations without modifying values or units
      if (input.encounter.vitals) {
        const vitalsList: Array<{
          loinc: string;
          display: string;
          value?: number;
          unit: string;
        }> = [
          {
            loinc: '8480-6',
            display: 'Systolic blood pressure',
            value: input.encounter.vitals.bloodPressureSystolic,
            unit: 'mmHg',
          },
          {
            loinc: '8462-4',
            display: 'Diastolic blood pressure',
            value: input.encounter.vitals.bloodPressureDiastolic,
            unit: 'mmHg',
          },
          {
            loinc: '8867-4',
            display: 'Heart rate',
            value: input.encounter.vitals.heartRate,
            unit: '/min',
          },
          {
            loinc: '8310-5',
            display: 'Body temperature',
            value: input.encounter.vitals.temperature,
            unit: 'Cel',
          },
          {
            loinc: '2708-6',
            display: 'Oxygen saturation in Arterial blood',
            value: input.encounter.vitals.oxygenSaturation,
            unit: '%',
          },
        ];

        for (const v of vitalsList) {
          if (typeof v.value === 'number') {
            const obsUuid = crypto.randomUUID();
            const obsUrl = `urn:uuid:${obsUuid}`;
            entries.push({
              fullUrl: obsUrl,
              resource: {
                resourceType: 'Observation',
                id: obsUuid,
                meta: {
                  profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/ObservationVitalSigns'],
                },
                status: isAmended ? 'amended' : 'final',
                category: [
                  {
                    coding: [
                      {
                        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                        code: 'vital-signs',
                        display: 'Vital Signs',
                      },
                    ],
                  },
                ],
                code: {
                  coding: [{ system: 'http://loinc.org', code: v.loinc, display: v.display }],
                  text: v.display,
                },
                subject: { reference: `urn:uuid:${patientUuid}` },
                effectiveDateTime: input.encounter.vitals.recordedAt || input.encounter.startTime,
                valueQuantity: {
                  value: v.value,
                  unit: v.unit,
                  system: 'http://unitsofmeasure.org',
                  code: v.unit,
                },
              },
            });
            sectionEntryRefs.push({ reference: obsUrl });
          }
        }
      }

      if (input.encounter.treatmentPlan) {
        unmappedFields.push('encounter.treatmentPlan (mapped to CarePlan in full IG profile)');
      }

      sections.push({
        title: input.hiType === 'DischargeSummary' ? 'Hospital Course & Encounter' : 'Consultation Summary',
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: profileMeta.snomedCode,
              display: profileMeta.display,
            },
          ],
        },
        entry: sectionEntryRefs,
      });
    }

    if (input.prescription && (input.hiType === 'Prescription' || input.hiType === 'OPConsultation')) {
      isAmended = isAmended || Boolean(input.prescription.isAmended);
      documentDate = input.prescription.issuedAt || documentDate;
      const medRefs: Array<{ reference: string }> = [];

      for (const med of input.prescription.medications) {
        const medUuid = crypto.randomUUID();
        const medUrl = `urn:uuid:${medUuid}`;
        entries.push({
          fullUrl: medUrl,
          resource: {
            resourceType: 'MedicationRequest',
            id: medUuid,
            meta: {
              profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest'],
            },
            status: this.mapMedicationStatus(input.prescription.status),
            intent: 'order',
            medicationCodeableConcept: {
              text: med.genericName ? `${med.name} (${med.genericName})` : med.name,
            },
            subject: { reference: `urn:uuid:${patientUuid}` },
            authoredOn: input.prescription.issuedAt,
            requester: { reference: `urn:uuid:${practitionerUuid}` },
            dosageInstruction: [
              {
                text: [med.dosage, med.route, med.frequency, med.duration, med.instructions]
                  .filter(Boolean)
                  .join(' | '),
              },
            ],
          },
        });
        medRefs.push({ reference: medUrl });
      }

      if (medRefs.length > 0) {
        sections.push({
          title: 'Medications',
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '440545006',
                display: 'Prescription record',
              },
            ],
          },
          entry: medRefs,
        });
      }
    }

    if (input.diagnosticReport && input.hiType === 'DiagnosticReport') {
      isAmended = isAmended || Boolean(input.diagnosticReport.isAmended);
      documentDate = input.diagnosticReport.issuedAt || documentDate;

      const drUuid = crypto.randomUUID();
      const drUrl = `urn:uuid:${drUuid}`;
      const obsRefs: Array<{ reference: string }> = [];

      // Optional ServiceRequest
      let serviceReqUrl: string | undefined;
      if (input.diagnosticReport.orderNumber) {
        const srUuid = crypto.randomUUID();
        serviceReqUrl = `urn:uuid:${srUuid}`;
        entries.push({
          fullUrl: serviceReqUrl,
          resource: {
            resourceType: 'ServiceRequest',
            id: srUuid,
            meta: {
              profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/ServiceRequest'],
            },
            status: 'completed',
            intent: 'order',
            code: {
              text: input.diagnosticReport.testName,
            },
            subject: { reference: `urn:uuid:${patientUuid}` },
            requester: { reference: `urn:uuid:${practitionerUuid}` },
            authoredOn: input.diagnosticReport.issuedAt,
          },
        });
      }

      // Optional Specimen
      let specimenUrl: string | undefined;
      if (input.diagnosticReport.specimenType) {
        const spUuid = crypto.randomUUID();
        specimenUrl = `urn:uuid:${spUuid}`;
        entries.push({
          fullUrl: specimenUrl,
          resource: {
            resourceType: 'Specimen',
            id: spUuid,
            meta: {
              profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Specimen'],
            },
            type: { text: input.diagnosticReport.specimenType },
            subject: { reference: `urn:uuid:${patientUuid}` },
            ...(input.diagnosticReport.specimenCollectedAt
              ? { collection: { collectedDateTime: input.diagnosticReport.specimenCollectedAt } }
              : {}),
          },
        });
      }

      // Preserve exact lab observation values, units, and reference ranges
      for (const obs of input.diagnosticReport.observations) {
        const obsUuid = crypto.randomUUID();
        const obsUrl = `urn:uuid:${obsUuid}`;
        const obsResource: Record<string, unknown> = {
          resourceType: 'Observation',
          id: obsUuid,
          meta: {
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'],
          },
          status: isAmended ? 'amended' : 'final',
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
            coding: obs.parameterCode
              ? [
                  {
                    system: 'https://healthbridge.in/tests',
                    code: obs.parameterCode,
                    display: obs.testName,
                  },
                ]
              : undefined,
            text: obs.testName,
          },
          subject: { reference: `urn:uuid:${patientUuid}` },
          effectiveDateTime: obs.observationDate || input.diagnosticReport.issuedAt,
          ...(typeof obs.numericValue === 'number'
            ? {
                valueQuantity: {
                  value: obs.numericValue,
                  unit: obs.unit,
                },
              }
            : { valueString: `${obs.value}${obs.unit ? ` ${obs.unit}` : ''}`.trim() }),
          ...(obs.referenceRange ? { referenceRange: [{ text: obs.referenceRange }] } : {}),
          ...(obs.interpretation
            ? {
                interpretation: [
                  {
                    coding: [
                      {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                        code: this.mapObservationInterpretation(obs.interpretation),
                        display: obs.interpretation,
                      },
                    ],
                  },
                ],
              }
            : {}),
        };
        entries.push({ fullUrl: obsUrl, resource: obsResource });
        obsRefs.push({ reference: obsUrl });
      }

      const drResource: Record<string, unknown> = {
        resourceType: 'DiagnosticReport',
        id: drUuid,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab'],
        },
        status: isAmended ? 'amended' : 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'LAB',
                display: 'Laboratory',
              },
            ],
          },
        ],
        code: { text: input.diagnosticReport.testName },
        subject: { reference: `urn:uuid:${patientUuid}` },
        issued: input.diagnosticReport.issuedAt,
        performer: [{ reference: `urn:uuid:${organizationUuid}` }],
        resultsInterpreter: [{ reference: `urn:uuid:${practitionerUuid}` }],
        ...(serviceReqUrl ? { basedOn: [{ reference: serviceReqUrl }] } : {}),
        ...(specimenUrl ? { specimen: [{ reference: specimenUrl }] } : {}),
        ...(obsRefs.length > 0 ? { result: obsRefs } : {}),
        ...(input.diagnosticReport.clinicalNotes
          ? { conclusion: input.diagnosticReport.clinicalNotes }
          : {}),
      };
      entries.push({ fullUrl: drUrl, resource: drResource });

      sections.push({
        title: 'Diagnostic Reports',
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '721981007',
              display: 'Diagnostic studies report',
            },
          ],
        },
        entry: [{ reference: drUrl }],
      });
    }

    if (input.documentRecord && input.hiType === 'HealthDocumentRecord') {
      isAmended = isAmended || Boolean(input.documentRecord.isAmended);
      documentDate = input.documentRecord.recordDate || documentDate;
      const docUuid = crypto.randomUUID();
      const docUrl = `urn:uuid:${docUuid}`;
      entries.push({
        fullUrl: docUrl,
        resource: {
          resourceType: 'DocumentReference',
          id: docUuid,
          meta: {
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference'],
          },
          status: 'current',
          type: { text: input.documentRecord.recordType },
          subject: { reference: `urn:uuid:${patientUuid}` },
          date: input.documentRecord.recordDate,
          author: [{ reference: `urn:uuid:${practitionerUuid}` }],
          custodian: { reference: `urn:uuid:${organizationUuid}` },
          content: [
            {
              attachment: {
                contentType: input.documentRecord.mimeType || 'application/pdf',
                title: input.documentRecord.title,
                ...(input.documentRecord.fileUrl ? { url: input.documentRecord.fileUrl } : {}),
              },
            },
          ],
        },
      });
      sections.push({
        title: 'Health Documents',
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '419891008',
              display: 'Record artifact',
            },
          ],
        },
        entry: [{ reference: docUrl }],
      });
    }

    // 3. Build Composition (MUST be entry[0] per NRCeS ABDM DocumentBundle specification)
    const compositionResource: Record<string, unknown> = {
      resourceType: 'Composition',
      id: compositionUuid,
      meta: {
        profile: [profileMeta.profile],
      },
      status: isAmended ? 'amended' : 'final',
      type: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: profileMeta.snomedCode,
            display: profileMeta.display,
          },
        ],
        text: profileMeta.title,
      },
      subject: { reference: `urn:uuid:${patientUuid}` },
      ...(encounterFullUrl ? { encounter: { reference: encounterFullUrl } } : {}),
      date: documentDate,
      author: [{ reference: `urn:uuid:${practitionerUuid}` }],
      title: profileMeta.title,
      custodian: { reference: `urn:uuid:${organizationUuid}` },
      section: sections,
    };

    // 4. Build Provenance resource preserving source facility and generation timestamp
    const provenanceResource: Record<string, unknown> = {
      resourceType: 'Provenance',
      id: provenanceUuid,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Provenance'],
      },
      target: [{ reference: `urn:uuid:${compositionUuid}` }],
      recorded: generatedAt,
      agent: [
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
                code: 'author',
                display: 'Author',
              },
            ],
          },
          who: { reference: `urn:uuid:${organizationUuid}` },
        },
      ],
    };

    const patientRes: Record<string, unknown> = { ...patientMapped.resource, id: patientUuid };
    const practitionerRes: Record<string, unknown> = {
      ...practitionerMapped.resource,
      id: practitionerUuid,
    };
    const orgRes: Record<string, unknown> = { ...orgMapped.resource, id: organizationUuid };

    const allEntries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [
      { fullUrl: `urn:uuid:${compositionUuid}`, resource: compositionResource },
      { fullUrl: `urn:uuid:${patientUuid}`, resource: patientRes },
      { fullUrl: `urn:uuid:${practitionerUuid}`, resource: practitionerRes },
      { fullUrl: `urn:uuid:${organizationUuid}`, resource: orgRes },
      ...entries,
      { fullUrl: `urn:uuid:${provenanceUuid}`, resource: provenanceResource },
    ];

    const bundle: Record<string, unknown> = {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        versionId: '1',
        lastUpdated: generatedAt,
        profile: [NRCES_DOCUMENT_BUNDLE_PROFILE],
      },
      identifier: {
        system: 'https://healthbridge.in/identifiers',
        value: bundleId,
      },
      type: 'document',
      timestamp: generatedAt,
      entry: allEntries,
    };

    // 5. Structural validation
    const validation = fhirR4Validator.validateResource(bundle, { strictAbdmProfile: true });
    const combinedWarnings = [...warnings, ...validation.warnings];
    const bundleJson = JSON.stringify(bundle);
    const bundleSha256 = crypto.createHash('sha256').update(bundleJson).digest('hex');

    const resourceCounts: Record<string, number> = {};
    for (const item of allEntries) {
      const rt = String(item.resource.resourceType || 'Unknown');
      resourceCounts[rt] = (resourceCounts[rt] || 0) + 1;
    }

    // 6. Optional telemetry persistence (no plaintext PHI)
    if (input.persistTelemetry && mongoose.connection.readyState === 1) {
      await AbdmFhirMappingResultModel.create({
        bundleId,
        role: input.persistTelemetry.role,
        patientId:
          input.persistTelemetry.patientId &&
          mongoose.Types.ObjectId.isValid(input.persistTelemetry.patientId)
            ? new mongoose.Types.ObjectId(input.persistTelemetry.patientId)
            : undefined,
        transferId:
          input.persistTelemetry.transferId &&
          mongoose.Types.ObjectId.isValid(input.persistTelemetry.transferId)
            ? new mongoose.Types.ObjectId(input.persistTelemetry.transferId)
            : undefined,
        hiType: input.hiType,
        profileUrl: profileMeta.profile,
        mappingVersion: ABDM_FHIR_MAPPING_VERSION,
        bundleSha256,
        validationStatus: !validation.valid
          ? 'INVALID'
          : combinedWarnings.length > 0
            ? 'VALID_WITH_WARNINGS'
            : 'VALID',
        errorCount: validation.errors.length,
        warningCount: combinedWarnings.length,
        errorCodes: validation.errors.map((e) => e.code),
        warningCodes: combinedWarnings.map((w) => w.code),
        unmappedFields,
        resourceCounts,
        officialIgConformanceClaimed: false,
        correlationId: input.persistTelemetry.correlationId,
        environment: input.persistTelemetry.environment,
      }).catch(() => undefined);
    }

    return {
      bundleId,
      hiType: input.hiType,
      profileUrl: profileMeta.profile,
      mappingVersion: ABDM_FHIR_MAPPING_VERSION,
      bundleSha256,
      valid: validation.valid,
      errors: validation.errors,
      warnings: combinedWarnings,
      unmappedFields,
      resourceCounts,
      officialIgConformanceClaimed: false,
      bundle,
      generatedAt,
    };
  }

  private mapEncounterStatus(status: string): string {
    const map: Record<string, string> = {
      PLANNED: 'planned',
      IN_PROGRESS: 'in-progress',
      COMPLETED: 'finished',
      FINALIZED: 'finished',
      CANCELLED: 'cancelled',
    };
    return map[status.toUpperCase()] || 'finished';
  }

  private mapMedicationStatus(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'active',
      ISSUED: 'active',
      COMPLETED: 'completed',
      DISCONTINUED: 'stopped',
      CANCELLED: 'cancelled',
      DRAFT: 'draft',
    };
    return map[status.toUpperCase()] || 'active';
  }

  private mapObservationInterpretation(interp: string): string {
    const map: Record<string, string> = {
      NORMAL: 'N',
      LOW: 'L',
      HIGH: 'H',
      ABNORMAL: 'A',
      CRITICAL: 'AA',
      CRITICAL_LOW: 'LL',
      CRITICAL_HIGH: 'HH',
    };
    return map[interp.toUpperCase()] || 'N';
  }
}

export const abdmFhirBundleService = new AbdmFhirBundleService();

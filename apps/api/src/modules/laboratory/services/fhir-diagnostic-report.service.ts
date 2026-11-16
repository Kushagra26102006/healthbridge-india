/**
 * HealthBridge India — FHIR R4 DiagnosticReport Mapping Service
 * Maps internal diagnostic reports to official HL7 FHIR R4 DiagnosticReport & Observation resources.
 */

import type {
  LabReportDetailDto,
  FHIRDiagnosticReportBundle,
  FHIRDiagnosticReportResource,
  FHIRDiagnosticReportObservation,
} from '@healthbridge/shared-types';

export class FhirDiagnosticReportService {
  /**
   * Maps an internal diagnostic report document to an official HL7 FHIR R4 Bundle
   */
  static mapToFhirBundle(
    report: LabReportDetailDto,
    pdfBase64?: string
  ): FHIRDiagnosticReportBundle {
    const fhirStatus = this.mapStatusToFhir(report.status);
    const observationResources: FHIRDiagnosticReportObservation[] = [];
    const observationReferences = [];

    const observations = report.observations || [];
    for (let i = 0; i < observations.length; i++) {
      const obs = observations[i];
      if (!obs) continue;
      const obsId = `obs-${report.reportNumber}-${i + 1}`;
      observationReferences.push({
        reference: `Observation/${obsId}`,
        display: obs.testName,
      });

      const fhirObs: FHIRDiagnosticReportObservation = {
        resourceType: 'Observation',
        id: obsId,
        status: fhirStatus as any,
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
              system: 'http://loinc.org',
              code: obs.parameterCode || `LOCAL-${obs.testName.replace(/\s+/g, '-').toUpperCase()}`,
              display: obs.testName,
            },
          ],
          text: obs.testName,
        },
        subject: {
          reference: `Patient/${report.patientId}`,
          display: report.patientName || 'Patient',
        },
        effectiveDateTime: new Date(report.testDate || report.createdAt).toISOString(),
        ...(obs.numericValue !== undefined && !isNaN(obs.numericValue)
          ? {
              valueQuantity: {
                value: obs.numericValue,
                unit: obs.unit,
                system: 'http://unitsofmeasure.org',
                code: obs.unit,
              },
            }
          : {
              valueString: obs.value,
            }),
        interpretation: obs.flag
          ? [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: this.mapFlagToHl7Code(obs.flag),
                    display: obs.flag,
                  },
                ],
              },
            ]
          : undefined,
        referenceRange: obs.referenceRange
          ? [
              {
                text: obs.referenceRange,
              },
            ]
          : undefined,
      };

      observationResources.push(fhirObs);
    }

    const diagnosticReportResource: FHIRDiagnosticReportResource = {
      resourceType: 'DiagnosticReport',
      id: report.reportNumber,
      identifier: [
        {
          system: 'https://healthbridge.in/reports',
          value: report.reportNumber,
        },
      ],
      status: fhirStatus,
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: this.mapCategoryToHl7Code(report.category),
              display: report.category,
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'https://healthbridge.in/tests',
            code: report.testName.replace(/\s+/g, '-').toUpperCase(),
            display: report.testName,
          },
        ],
        text: report.testName,
      },
      subject: {
        reference: `Patient/${report.patientId}`,
        display: report.patientName || 'Patient',
      },
      encounter: report.orderId
        ? {
            reference: `ServiceRequest/${report.orderId}`,
            display: report.orderNumber || 'Laboratory Order',
          }
        : undefined,
      effectiveDateTime: new Date(report.testDate || report.createdAt).toISOString(),
      issued: report.publishedAt
        ? new Date(report.publishedAt).toISOString()
        : new Date().toISOString(),
      performer: [
        {
          reference: `Organization/${report.laboratoryId}`,
          display: report.laboratoryName || 'Diagnostic Laboratory',
        },
      ],
      result: observationReferences,
      presentedForm: [
        {
          contentType: report.documentMimeType || 'application/pdf',
          url: report.documentUrl,
          title: `${report.testName} Diagnostic Report`,
          data: pdfBase64,
        },
      ],
      conclusion: report.interpretation || report.clinicalNotes,
    };

    return {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:${report.reportNumber}`,
          resource: diagnosticReportResource,
        },
        ...observationResources.map((obs) => ({
          fullUrl: `urn:uuid:${obs.id}`,
          resource: obs,
        })),
      ],
    };
  }

  private static mapStatusToFhir(
    status: string
  ): 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' {
    switch (status) {
      case 'DRAFT':
      case 'GENERATED':
        return 'registered';
      case 'PENDING_REVIEW':
      case 'UNDER_REVIEW':
      case 'PRELIMINARY':
      case 'PENDING':
        return 'preliminary';
      case 'APPROVED':
      case 'PUBLISHED':
      case 'COMPLETED':
        return 'final';
      case 'AMENDED':
        return 'amended';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'final';
    }
  }

  private static mapFlagToHl7Code(flag: string): string {
    switch (flag) {
      case 'NORMAL':
        return 'N';
      case 'LOW':
        return 'L';
      case 'HIGH':
        return 'H';
      case 'ABNORMAL':
        return 'A';
      case 'CRITICAL':
        return 'AA'; // Critical abnormal
      default:
        return 'N';
    }
  }

  private static mapCategoryToHl7Code(category: string): string {
    switch (category) {
      case 'HEMATOLOGY':
        return 'HM';
      case 'BIOCHEMISTRY':
        return 'CH';
      case 'MICROBIOLOGY':
        return 'MB';
      case 'SEROLOGY':
      case 'IMMUNOLOGY':
        return 'IMM';
      case 'RADIOLOGY':
        return 'RAD';
      default:
        return 'LAB';
    }
  }
}

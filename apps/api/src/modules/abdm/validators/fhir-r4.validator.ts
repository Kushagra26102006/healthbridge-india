/**
 * HealthBridge India — FHIR R4 & NRCeS ABDM Structural Validation Engine (Day 7 Task 01)
 *
 * Validates FHIR R4 core structure, identifiers, ISO-8601 date/timezones, terminology
 * system URIs, references, and NRCeS ABDM Document Bundle structural rules
 * (e.g., Composition as entry[0], urn:uuid references, self-contained bundle resolution).
 *
 * NOTE: This validator provides deterministic structural verification inside the application.
 * It does NOT replace official NRCeS `ndhm.in` IG validation via the HAPI FHIR CLI Validator.
 */

import type {
  AbdmFhirResourceType,
  FhirValidationIssueDto,
} from '@healthbridge/shared-types';

const ISO_DATE_OR_DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2}))?$/;

const UUID_URN_REGEX =
  /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const KNOWN_TERMINOLOGY_SYSTEMS = new Set([
  'http://loinc.org',
  'http://snomed.info/sct',
  'http://unitsofmeasure.org',
  'http://terminology.hl7.org/CodeSystem/v2-0203',
  'http://terminology.hl7.org/CodeSystem/v2-0074',
  'http://terminology.hl7.org/CodeSystem/observation-category',
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
  'http://terminology.hl7.org/CodeSystem/consentscope',
  'http://terminology.hl7.org/CodeSystem/consentaction',
  'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
  'http://terminology.hl7.org/CodeSystem/v3-ActCode',
  'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
  'http://terminology.hl7.org/CodeSystem/condition-clinical',
  'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
  'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
  'http://hl7.org/fhir/sid/icd-10',
  'https://nrces.in/ndhm/fhir/r4/CodeSystem/ndhm-identifier-type-code',
  'https://abdm.gov.in/hiecm/purpose',
  'https://abdm.gov.in/hiecm/hitype',
  'https://abdm.gov.in/consent-artefact',
  'https://healthid.ndhm.gov.in',
  'https://facility.ndhm.gov.in',
  'https://doctor.ndhm.gov.in',
  'https://healthbridge.in/identifiers',
  'https://healthbridge.in/tests',
]);

const SUPPORTED_RESOURCE_TYPES = new Set<string>([
  'Patient',
  'Practitioner',
  'Organization',
  'Encounter',
  'Appointment',
  'Observation',
  'DiagnosticReport',
  'ServiceRequest',
  'Specimen',
  'MedicationRequest',
  'MedicationStatement',
  'Condition',
  'AllergyIntolerance',
  'DocumentReference',
  'Consent',
  'Provenance',
  'Composition',
  'Bundle',
]);

export interface FhirValidationOutput {
  valid: boolean;
  resourceType: AbdmFhirResourceType | string;
  errors: FhirValidationIssueDto[];
  warnings: FhirValidationIssueDto[];
}

export class FhirR4Validator {
  validateResource(
    resource: Record<string, unknown>,
    options: { strictAbdmProfile?: boolean } = {}
  ): FhirValidationOutput {
    const strict = options.strictAbdmProfile ?? true;
    const errors: FhirValidationIssueDto[] = [];
    const warnings: FhirValidationIssueDto[] = [];

    if (!resource || typeof resource !== 'object') {
      return {
        valid: false,
        resourceType: 'Unknown',
        errors: [
          {
            severity: 'ERROR',
            code: 'INVALID_RESOURCE_OBJECT',
            path: '$',
            message: 'FHIR resource must be a non-null JSON object.',
          },
        ],
        warnings,
      };
    }

    const resourceType = String(resource.resourceType || '');
    if (!resourceType || !SUPPORTED_RESOURCE_TYPES.has(resourceType)) {
      errors.push({
        severity: 'ERROR',
        code: 'UNSUPPORTED_RESOURCE_TYPE',
        path: 'resourceType',
        message: `Unsupported or missing FHIR R4 resourceType '${resourceType}'.`,
      });
      return { valid: false, resourceType: resourceType || 'Unknown', errors, warnings };
    }

    if (!resource.id || typeof resource.id !== 'string' || !/^[A-Za-z0-9\-.]{1,64}$/.test(resource.id)) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_RESOURCE_ID',
        path: 'id',
        message: 'FHIR resource requires a valid logical id (1-64 chars, alphanumeric/hyphen/dot).',
      });
    }

    // Check meta.profile in strict ABDM mode
    const meta = resource.meta as { profile?: unknown } | undefined;
    if (strict && (!meta || !Array.isArray(meta.profile) || meta.profile.length === 0)) {
      warnings.push({
        severity: 'WARNING',
        code: 'MISSING_ABDM_PROFILE',
        path: 'meta.profile',
        message: `Resource '${resourceType}' does not declare an NRCeS ABDM StructureDefinition URL in meta.profile.`,
      });
    }

    // Resource-specific rules
    switch (resourceType) {
      case 'Patient':
        this.validatePatient(resource, errors, warnings);
        break;
      case 'Practitioner':
        this.validatePractitioner(resource, errors, warnings);
        break;
      case 'Organization':
        this.validateOrganization(resource, errors, warnings);
        break;
      case 'Observation':
        this.validateObservation(resource, errors, warnings);
        break;
      case 'DiagnosticReport':
        this.validateDiagnosticReport(resource, errors, warnings);
        break;
      case 'Composition':
        this.validateComposition(resource, errors, warnings);
        break;
      case 'Consent':
        this.validateConsent(resource, errors, warnings);
        break;
      case 'Encounter':
        this.validateEncounter(resource, errors);
        break;
      case 'Appointment':
        this.validateAppointment(resource, errors);
        break;
      case 'MedicationRequest':
        this.validateMedicationRequest(resource, errors);
        break;
      case 'MedicationStatement':
        this.validateMedicationStatement(resource, errors);
        break;
      case 'Condition':
        this.validateCondition(resource, errors, warnings);
        break;
      case 'AllergyIntolerance':
        this.validateAllergyIntolerance(resource, errors, warnings);
        break;
      case 'ServiceRequest':
        this.validateServiceRequest(resource, errors);
        break;
      case 'Specimen':
        this.validateSpecimen(resource, errors);
        break;
      case 'DocumentReference':
        this.validateDocumentReference(resource, errors);
        break;
      case 'Provenance':
        this.validateProvenance(resource, errors);
        break;
      case 'Bundle':
        this.validateBundle(resource, strict, errors, warnings);
        break;
      default:
        break;
    }

    return {
      valid: errors.length === 0,
      resourceType,
      errors,
      warnings,
    };
  }

  private validatePatient(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    if (!Array.isArray(r.name) || r.name.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'PATIENT_NAME_REQUIRED',
        path: 'Patient.name',
        message: 'Patient resource requires at least one HumanName entry.',
      });
    }
    if (!Array.isArray(r.identifier) || r.identifier.length === 0) {
      warnings.push({
        severity: 'WARNING',
        code: 'PATIENT_IDENTIFIER_MISSING',
        path: 'Patient.identifier',
        message: 'Patient resource should include an ABHA or facility MRN identifier.',
      });
    }
    if (r.birthDate && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.birthDate))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_DATE_FORMAT',
        path: 'Patient.birthDate',
        message: 'Patient.birthDate must follow YYYY-MM-DD ISO format.',
      });
    }
    if (r.gender && !['male', 'female', 'other', 'unknown'].includes(String(r.gender))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_GENDER_CODE',
        path: 'Patient.gender',
        message: "Patient.gender must be one of 'male' | 'female' | 'other' | 'unknown'.",
      });
    }
  }

  private validatePractitioner(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    if (!Array.isArray(r.name) || r.name.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'PRACTITIONER_NAME_REQUIRED',
        path: 'Practitioner.name',
        message: 'Practitioner resource requires at least one name entry.',
      });
    }
    if (!Array.isArray(r.identifier) || r.identifier.length === 0) {
      warnings.push({
        severity: 'WARNING',
        code: 'PRACTITIONER_HPR_MISSING',
        path: 'Practitioner.identifier',
        message: 'Practitioner should declare an HPR ID or Medical Council registration identifier.',
      });
    }
  }

  private validateOrganization(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    if (!r.name || typeof r.name !== 'string' || !r.name.trim()) {
      errors.push({
        severity: 'ERROR',
        code: 'ORGANIZATION_NAME_REQUIRED',
        path: 'Organization.name',
        message: 'Organization resource requires a non-empty name.',
      });
    }
    if (!Array.isArray(r.identifier) || r.identifier.length === 0) {
      warnings.push({
        severity: 'WARNING',
        code: 'ORGANIZATION_HFR_MISSING',
        path: 'Organization.identifier',
        message: 'Organization should include an HFR Facility ID once sandbox/production HFR onboarding completes.',
      });
    }
  }

  private validateObservation(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    const validStatuses = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled'];
    if (!validStatuses.includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'OBSERVATION_STATUS_INVALID',
        path: 'Observation.status',
        message: 'Observation.status must be a valid FHIR ObservationStatus.',
      });
    }
    this.validateCodeableConcept(r.code, 'Observation.code', errors, warnings);
    this.validateReference(r.subject, 'Observation.subject', errors);

    if (r.effectiveDateTime && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.effectiveDateTime))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_DATETIME_FORMAT',
        path: 'Observation.effectiveDateTime',
        message: 'Observation.effectiveDateTime must be a valid ISO-8601 datetime with timezone.',
      });
    }
  }

  private validateDiagnosticReport(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    const validStatuses = ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'cancelled'];
    if (!validStatuses.includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'DIAGNOSTIC_REPORT_STATUS_INVALID',
        path: 'DiagnosticReport.status',
        message: 'DiagnosticReport.status must be a valid FHIR DiagnosticReportStatus.',
      });
    }
    this.validateCodeableConcept(r.code, 'DiagnosticReport.code', errors, warnings);
    this.validateReference(r.subject, 'DiagnosticReport.subject', errors);

    if (r.issued && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.issued))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_DATETIME_FORMAT',
        path: 'DiagnosticReport.issued',
        message: 'DiagnosticReport.issued must be a valid ISO-8601 instant.',
      });
    }
  }

  private validateComposition(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    if (!['preliminary', 'final', 'amended', 'entered-in-error'].includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'COMPOSITION_STATUS_INVALID',
        path: 'Composition.status',
        message: 'Composition.status is required and must be a valid FHIR CompositionStatus.',
      });
    }
    this.validateCodeableConcept(r.type, 'Composition.type', errors, warnings);
    this.validateReference(r.subject, 'Composition.subject', errors);
    if (!Array.isArray(r.author) || r.author.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'COMPOSITION_AUTHOR_REQUIRED',
        path: 'Composition.author',
        message: 'Composition.author requires at least one Practitioner or Organization reference.',
      });
    }
    if (!r.title || typeof r.title !== 'string') {
      errors.push({
        severity: 'ERROR',
        code: 'COMPOSITION_TITLE_REQUIRED',
        path: 'Composition.title',
        message: 'Composition.title is required.',
      });
    }
    if (!r.date || !ISO_DATE_OR_DATETIME_REGEX.test(String(r.date))) {
      errors.push({
        severity: 'ERROR',
        code: 'COMPOSITION_DATE_INVALID',
        path: 'Composition.date',
        message: 'Composition.date must be a valid ISO-8601 datetime.',
      });
    }
  }

  private validateConsent(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    const validStatuses = ['draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error'];
    if (!validStatuses.includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'CONSENT_STATUS_INVALID',
        path: 'Consent.status',
        message:
          "Consent.status is required and must be one of 'draft' | 'proposed' | 'active' | 'rejected' | 'inactive' | 'entered-in-error'.",
      });
    }

    this.validateCodeableConcept(r.scope, 'Consent.scope', errors, warnings);

    if (!Array.isArray(r.category) || r.category.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'CONSENT_CATEGORY_REQUIRED',
        path: 'Consent.category',
        message: 'Consent.category requires at least one CodeableConcept entry.',
      });
    } else {
      this.validateCodeableConcept(r.category[0], 'Consent.category[0]', errors, warnings);
    }

    this.validateReference(r.patient, 'Consent.patient', errors);

    if (r.dateTime && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.dateTime))) {
      errors.push({
        severity: 'ERROR',
        code: 'CONSENT_DATETIME_INVALID',
        path: 'Consent.dateTime',
        message: 'Consent.dateTime must be a valid ISO-8601 datetime.',
      });
    }

    const period = r.period as { start?: string; end?: string } | undefined;
    if (period) {
      if (period.start && !ISO_DATE_OR_DATETIME_REGEX.test(String(period.start))) {
        errors.push({
          severity: 'ERROR',
          code: 'CONSENT_PERIOD_START_INVALID',
          path: 'Consent.period.start',
          message: 'Consent.period.start must be a valid ISO-8601 datetime.',
        });
      }
      if (period.end && !ISO_DATE_OR_DATETIME_REGEX.test(String(period.end))) {
        errors.push({
          severity: 'ERROR',
          code: 'CONSENT_PERIOD_END_INVALID',
          path: 'Consent.period.end',
          message: 'Consent.period.end must be a valid ISO-8601 datetime.',
        });
      }
    }

    const provision = r.provision as { type?: string } | undefined;
    if (provision && provision.type && !['permit', 'deny'].includes(provision.type)) {
      errors.push({
        severity: 'ERROR',
        code: 'CONSENT_PROVISION_TYPE_INVALID',
        path: 'Consent.provision.type',
        message: "Consent.provision.type must be 'permit' or 'deny'.",
      });
    }
  }

  private validateBundle(
    r: Record<string, unknown>,
    strict: boolean,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    const bundleType = String(r.type || '');
    if (!bundleType) {
      errors.push({
        severity: 'ERROR',
        code: 'BUNDLE_TYPE_REQUIRED',
        path: 'Bundle.type',
        message: 'Bundle.type is required.',
      });
    }
    if (!r.timestamp || !ISO_DATE_OR_DATETIME_REGEX.test(String(r.timestamp))) {
      errors.push({
        severity: 'ERROR',
        code: 'BUNDLE_TIMESTAMP_INVALID',
        path: 'Bundle.timestamp',
        message: 'Bundle.timestamp must be a valid ISO-8601 instant with timezone.',
      });
    }

    const entries = Array.isArray(r.entry) ? (r.entry as Array<Record<string, unknown>>) : [];
    if (entries.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'BUNDLE_EMPTY',
        path: 'Bundle.entry',
        message: 'Bundle.entry must contain at least one resource.',
      });
      return;
    }

    const MAX_BUNDLE_ENTRIES = 150;
    if (entries.length > MAX_BUNDLE_ENTRIES) {
      errors.push({
        severity: 'ERROR',
        code: 'BUNDLE_ENTRY_LIMIT_EXCEEDED',
        path: 'Bundle.entry',
        message: `Bundle contains ${entries.length} entries, exceeding the safe maximum of ${MAX_BUNDLE_ENTRIES} resources per DocumentBundle.`,
      });
      return;
    }

    // NRCeS ABDM Rule: Document Bundles MUST start with Composition at entry[0]
    if (bundleType === 'document') {
      const firstRes = entries[0]?.resource as Record<string, unknown> | undefined;
      if (!firstRes || firstRes.resourceType !== 'Composition') {
        errors.push({
          severity: 'ERROR',
          code: 'DOCUMENT_BUNDLE_COMPOSITION_FIRST',
          path: 'Bundle.entry[0].resource',
          message:
            'NRCeS ABDM FHIR R4 Document Bundle requires Bundle.entry[0].resource to be a Composition resource.',
        });
      }
    }

    // Collect resolvable entry URLs and resourceType/id keys + detect duplicates & Patient presence
    const availableTargets = new Set<string>();
    const seenFullUrls = new Set<string>();
    const seenResourceKeys = new Set<string>();
    let hasPatientResource = false;

    entries.forEach((entry, idx) => {
      const fullUrl = entry.fullUrl ? String(entry.fullUrl) : '';
      if (!fullUrl) {
        errors.push({
          severity: 'ERROR',
          code: 'BUNDLE_ENTRY_FULLURL_MISSING',
          path: `Bundle.entry[${idx}].fullUrl`,
          message: 'Every Bundle.entry must specify a fullUrl.',
        });
      } else {
        if (seenFullUrls.has(fullUrl)) {
          errors.push({
            severity: 'ERROR',
            code: 'DUPLICATE_BUNDLE_RESOURCE',
            path: `Bundle.entry[${idx}].fullUrl`,
            message: `Duplicate Bundle.entry fullUrl '${fullUrl}' detected.`,
          });
        }
        seenFullUrls.add(fullUrl);
        availableTargets.add(fullUrl);
        if (strict && fullUrl.startsWith('urn:uuid:') && !UUID_URN_REGEX.test(fullUrl)) {
          errors.push({
            severity: 'ERROR',
            code: 'INVALID_URN_UUID',
            path: `Bundle.entry[${idx}].fullUrl`,
            message: `Bundle fullUrl '${fullUrl}' is not a valid RFC 4122 urn:uuid.`,
          });
        }
      }

      const entryRes = entry.resource as Record<string, unknown> | undefined;
      if (!entryRes) {
        errors.push({
          severity: 'ERROR',
          code: 'BUNDLE_ENTRY_RESOURCE_MISSING',
          path: `Bundle.entry[${idx}].resource`,
          message: 'Bundle entry is missing resource object.',
        });
        return;
      }

      if (entryRes.resourceType === 'Patient') {
        hasPatientResource = true;
      }

      if (entryRes.resourceType && entryRes.id) {
        const resKey = `${entryRes.resourceType}/${entryRes.id}`;
        if (seenResourceKeys.has(resKey)) {
          errors.push({
            severity: 'ERROR',
            code: 'DUPLICATE_BUNDLE_RESOURCE',
            path: `Bundle.entry[${idx}].resource`,
            message: `Duplicate resource '${resKey}' detected inside Bundle.`,
          });
        }
        seenResourceKeys.add(resKey);
        availableTargets.add(resKey);
      }

      const subValidation = this.validateResource(entryRes, { strictAbdmProfile: strict });
      for (const e of subValidation.errors) {
        errors.push({ ...e, path: `Bundle.entry[${idx}].resource.${e.path}` });
      }
      for (const w of subValidation.warnings) {
        warnings.push({ ...w, path: `Bundle.entry[${idx}].resource.${w.path}` });
      }
    });

    if (bundleType === 'document' && !hasPatientResource) {
      errors.push({
        severity: 'ERROR',
        code: 'BUNDLE_PATIENT_RESOURCE_MISSING',
        path: 'Bundle.entry',
        message: 'NRCeS ABDM Document Bundle must include a Patient resource.',
      });
    }

    // Verify internal references resolve inside Document Bundles
    if (bundleType === 'document') {
      entries.forEach((entry, idx) => {
        const refs = this.extractReferences(entry.resource);
        for (const ref of refs) {
          if (!availableTargets.has(ref)) {
            errors.push({
              severity: 'ERROR',
              code: 'UNRESOLVED_BUNDLE_REFERENCE',
              path: `Bundle.entry[${idx}].resource`,
              message: `Reference '${ref}' does not resolve to any entry in this Document Bundle.`,
            });
          }
        }
      });
    }
  }

  private validateEncounter(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    const validStatuses = ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'];
    if (!validStatuses.includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'ENCOUNTER_STATUS_INVALID',
        path: 'Encounter.status',
        message: 'Encounter.status must be a valid FHIR EncounterStatus.',
      });
    }
    this.validateReference(r.subject, 'Encounter.subject', errors);
  }

  private validateMedicationRequest(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    const validStatuses = ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'];
    if (!validStatuses.includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'MEDICATION_REQUEST_STATUS_INVALID',
        path: 'MedicationRequest.status',
        message: 'MedicationRequest.status must be a valid FHIR MedicationRequestStatus.',
      });
    }
    if (!r.intent) {
      errors.push({
        severity: 'ERROR',
        code: 'MEDICATION_REQUEST_INTENT_REQUIRED',
        path: 'MedicationRequest.intent',
        message: 'MedicationRequest.intent is required.',
      });
    }
    this.validateReference(r.subject, 'MedicationRequest.subject', errors);
  }

  private validateServiceRequest(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    if (!r.status) {
      errors.push({
        severity: 'ERROR',
        code: 'SERVICE_REQUEST_STATUS_REQUIRED',
        path: 'ServiceRequest.status',
        message: 'ServiceRequest.status is required.',
      });
    }
    if (!r.intent) {
      errors.push({
        severity: 'ERROR',
        code: 'SERVICE_REQUEST_INTENT_REQUIRED',
        path: 'ServiceRequest.intent',
        message: 'ServiceRequest.intent is required.',
      });
    }
    this.validateReference(r.subject, 'ServiceRequest.subject', errors);
  }

  private validateSpecimen(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    this.validateReference(r.subject, 'Specimen.subject', errors);
  }

  private validateDocumentReference(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    if (!['current', 'superseded', 'entered-in-error'].includes(String(r.status || ''))) {
      errors.push({
        severity: 'ERROR',
        code: 'DOCUMENT_REFERENCE_STATUS_INVALID',
        path: 'DocumentReference.status',
        message: 'DocumentReference.status must be current, superseded, or entered-in-error.',
      });
    }
    this.validateReference(r.subject, 'DocumentReference.subject', errors);
    if (!Array.isArray(r.content) || r.content.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'DOCUMENT_REFERENCE_CONTENT_REQUIRED',
        path: 'DocumentReference.content',
        message: 'DocumentReference.content requires at least one attachment.',
      });
    }
  }

  private validateProvenance(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    if (!Array.isArray(r.target) || r.target.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'PROVENANCE_TARGET_REQUIRED',
        path: 'Provenance.target',
        message: 'Provenance.target requires at least one reference.',
      });
    }
    if (!r.recorded || !ISO_DATE_OR_DATETIME_REGEX.test(String(r.recorded))) {
      errors.push({
        severity: 'ERROR',
        code: 'PROVENANCE_RECORDED_INVALID',
        path: 'Provenance.recorded',
        message: 'Provenance.recorded must be a valid ISO-8601 instant.',
      });
    }
    if (!Array.isArray(r.agent) || r.agent.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'PROVENANCE_AGENT_REQUIRED',
        path: 'Provenance.agent',
        message: 'Provenance.agent requires at least one agent entry.',
      });
    }
  }

  private validateCodeableConcept(
    concept: unknown,
    path: string,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    if (!concept || typeof concept !== 'object') {
      errors.push({
        severity: 'ERROR',
        code: 'CODEABLE_CONCEPT_REQUIRED',
        path,
        message: `${path} must be a valid FHIR CodeableConcept.`,
      });
      return;
    }

    const c = concept as { coding?: Array<{ system?: string; code?: string }>; text?: string };
    if ((!Array.isArray(c.coding) || c.coding.length === 0) && !c.text) {
      errors.push({
        severity: 'ERROR',
        code: 'CODING_OR_TEXT_REQUIRED',
        path,
        message: `${path} must include at least one coding entry or text.`,
      });
      return;
    }

    if (Array.isArray(c.coding)) {
      for (const coding of c.coding) {
        if (!coding.code) {
          errors.push({
            severity: 'ERROR',
            code: 'CODING_CODE_REQUIRED',
            path: `${path}.coding.code`,
            message: 'Coding entry requires a non-empty code.',
          });
        }
        if (coding.system && !KNOWN_TERMINOLOGY_SYSTEMS.has(coding.system)) {
          warnings.push({
            severity: 'WARNING',
            code: 'UNRECOGNIZED_TERMINOLOGY_SYSTEM',
            path: `${path}.coding.system`,
            message: `Terminology system '${coding.system}' is not in the configured standard terminology registry.`,
          });
        }
      }
    }
  }

  private validateAppointment(r: Record<string, unknown>, errors: FhirValidationIssueDto[]): void {
    const validStatuses = [
      'proposed',
      'pending',
      'booked',
      'arrived',
      'fulfilled',
      'cancelled',
      'noshow',
      'entered-in-error',
      'checked-in',
      'waitlist',
    ];
    if (!r.status || !validStatuses.includes(String(r.status))) {
      errors.push({
        severity: 'ERROR',
        code: 'APPOINTMENT_STATUS_INVALID',
        path: 'Appointment.status',
        message: 'Appointment.status must be a valid FHIR R4 AppointmentStatus code.',
      });
    }
    if (!Array.isArray(r.participant) || r.participant.length === 0) {
      errors.push({
        severity: 'ERROR',
        code: 'APPOINTMENT_PARTICIPANT_REQUIRED',
        path: 'Appointment.participant',
        message: 'Appointment requires at least one participant entry.',
      });
    }
    if (r.start && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.start))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_DATE_FORMAT',
        path: 'Appointment.start',
        message: 'Appointment.start must follow ISO-8601 date/time format.',
      });
    }
    if (r.end && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.end))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_DATE_FORMAT',
        path: 'Appointment.end',
        message: 'Appointment.end must follow ISO-8601 date/time format.',
      });
    }
  }

  private validateMedicationStatement(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[]
  ): void {
    const validStatuses = [
      'active',
      'completed',
      'entered-in-error',
      'intended',
      'stopped',
      'on-hold',
      'unknown',
      'not-taken',
    ];
    if (!r.status || !validStatuses.includes(String(r.status))) {
      errors.push({
        severity: 'ERROR',
        code: 'MEDICATION_STATEMENT_STATUS_INVALID',
        path: 'MedicationStatement.status',
        message: 'MedicationStatement.status must be a valid FHIR R4 status code.',
      });
    }
    if (!r.medicationCodeableConcept && !r.medicationReference) {
      errors.push({
        severity: 'ERROR',
        code: 'MEDICATION_REQUIRED',
        path: 'MedicationStatement.medication[x]',
        message: 'MedicationStatement requires medicationCodeableConcept or medicationReference.',
      });
    }
    this.validateReference(r.subject, 'MedicationStatement.subject', errors);
  }

  private validateCondition(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    this.validateReference(r.subject, 'Condition.subject', errors);
    this.validateCodeableConcept(r.code, 'Condition.code', errors, warnings);
    if (r.recordedDate && !ISO_DATE_OR_DATETIME_REGEX.test(String(r.recordedDate))) {
      errors.push({
        severity: 'ERROR',
        code: 'INVALID_DATE_FORMAT',
        path: 'Condition.recordedDate',
        message: 'Condition.recordedDate must follow ISO-8601 format.',
      });
    }
  }

  private validateAllergyIntolerance(
    r: Record<string, unknown>,
    errors: FhirValidationIssueDto[],
    warnings: FhirValidationIssueDto[]
  ): void {
    this.validateReference(r.patient, 'AllergyIntolerance.patient', errors);
    this.validateCodeableConcept(r.code, 'AllergyIntolerance.code', errors, warnings);
    if (
      r.criticality &&
      !['low', 'high', 'unable-to-assess'].includes(String(r.criticality))
    ) {
      errors.push({
        severity: 'ERROR',
        code: 'ALLERGY_CRITICALITY_INVALID',
        path: 'AllergyIntolerance.criticality',
        message: "AllergyIntolerance.criticality must be 'low' | 'high' | 'unable-to-assess'.",
      });
    }
  }

  private validateReference(
    refObj: unknown,
    path: string,
    errors: FhirValidationIssueDto[]
  ): void {
    if (!refObj || typeof refObj !== 'object' || !(refObj as { reference?: string }).reference) {
      errors.push({
        severity: 'ERROR',
        code: 'REFERENCE_REQUIRED',
        path,
        message: `${path}.reference is required.`,
      });
    }
  }

  private extractReferences(node: unknown, out: string[] = []): string[] {
    if (!node || typeof node !== 'object') return out;
    if (Array.isArray(node)) {
      for (const item of node) this.extractReferences(item, out);
      return out;
    }
    const obj = node as Record<string, unknown>;
    if (typeof obj.reference === 'string' && obj.reference.trim()) {
      out.push(obj.reference.trim());
    }
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object') {
        this.extractReferences(val, out);
      }
    }
    return out;
  }
}

export const fhirR4Validator = new FhirR4Validator();

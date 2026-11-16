# HL7 FHIR R4 DiagnosticReport Mapping

## 1. Overview
HealthBridge India implements HL7 FHIR R4 conformance for laboratory diagnostics. The `FhirDiagnosticReportService` transforms internal `LaboratoryReportModel` instances into standardized FHIR R4 Bundles (`type: 'document'`) comprising `DiagnosticReport` and constituent `Observation` resources with LOINC and HL7 v3 interpretation codes.

---

## 2. Resource Hierarchy

```
Bundle (resourceType: "Bundle", type: "document")
  ├── Entry: DiagnosticReport
  │     ├── status: preliminary | final | amended | corrected
  │     ├── category: http://terminology.hl7.org/CodeSystem/v2-0074 (LAB)
  │     ├── code: Diagnostic Test Code (LOINC / Local)
  │     ├── subject: Reference to Patient
  │     ├── performer: Reference to Organization (Laboratory)
  │     ├── result: [ References to Observations ]
  │     └── presentedForm: [ PDF attachment (Base64) ]
  │
  ├── Entry: Observation (Parameter 1)
  │     ├── status: final
  │     ├── code: Parameter LOINC / Local Code
  │     ├── valueQuantity: { value, unit, system: "http://unitsofmeasure.org" }
  │     ├── interpretation: [ HL7 v3 ObservationInterpretation (H, L, A, HH, N) ]
  │     └── referenceRange: [ { text: "13.0 - 17.0 g/dL" } ]
  │
  └── Entry: Observation (Parameter N...)
```

---

## 3. Interpretation & Code Mapping Table

| Internal Flag | HL7 v3 Code | HL7 v3 Display |
| :--- | :--- | :--- |
| `NORMAL` | `N` | Normal |
| `HIGH` / `ABOVE_RANGE` | `H` | High |
| `LOW` / `BELOW_RANGE` | `L` | Low |
| `ABNORMAL` | `A` | Abnormal |
| `CRITICAL` | `HH` | Critical High |

### Status Mapping

| Internal Status | FHIR DiagnosticReport Status |
| :--- | :--- |
| `DRAFT` / `GENERATED` | `preliminary` |
| `PENDING_REVIEW` / `UNDER_REVIEW` | `preliminary` |
| `APPROVED` / `PUBLISHED` / `COMPLETED` | `final` |
| `AMENDED` | `amended` |
| `CANCELLED` | `cancelled` |

---

## 4. API Endpoint

- `GET /api/v1/laboratory/reports/:id/fhir`: Retrieves FHIR Bundle for laboratory staff.
- `GET /api/v1/lab-reports/:id/fhir`: Retrieves FHIR Bundle for authorized patients and physicians.

# Internal-to-FHIR R4 Mapping Matrix — HealthBridge India

Mapping Version: `2026.11-nrces-r4-foundation`  
Target Implementation Guide: NRCeS FHIR Implementation Guide for ABDM (`https://nrces.in/ndhm/fhir/r4/`)

| HealthBridge Entity | Internal Model / Source | Target FHIR R4 Resource | Target NRCeS ABDM Profile | Mapping Status | Unmapped Fields / Gaps |
|---|---|---|---|---|---|
| **Patient Profile** | `UserModel` + `PatientProfileModel` | `Patient` | `.../StructureDefinition/Patient` | **Implemented (Foundation)** | `bloodGroup` requires separate `Observation`; ABHA address optional until M1 verification |
| **Doctor / Pathologist** | `UserModel` + `DoctorProfileModel` / `LaboratoryStaffModel` | `Practitioner` | `.../StructureDefinition/Practitioner` | **Implemented (Foundation)** | `specialization` requires `PractitionerRole`; HPR ID pending onboarding |
| **Laboratory / Facility** | `LaboratoryProfileModel` / `FacilityModel` | `Organization` | `.../StructureDefinition/Organization` | **Implemented (Foundation)** | HFR Facility ID pending sandbox HFR registration |
| **Lab Result Observation** | `TestResultModel` / `LabObservationDto` | `Observation` | `.../StructureDefinition/Observation` | **Implemented (Foundation)** | Local test codes emit warning until mapped to LOINC/SNOMED-CT catalog |
| **Lab Report (Document)** | `LaboratoryReportModel` | `Composition` + `DiagnosticReport` + `Bundle` | `DiagnosticReportRecord` + `DiagnosticReportLab` + `DocumentBundle` | **Implemented (Foundation)** | Binary PDF `presentedForm` base64 embedding & HAPI CLI IG check pending M2 |
| **Clinical Consultation** | `EncounterModel` | `Encounter` + `Condition` + `Composition` | `OPConsultRecord` | **Planned (Milestone 2)** | Mapper not yet implemented; internal schema audited and compatible |
| **Doctor Prescription** | `PrescriptionModel` | `MedicationRequest` + `Composition` | `PrescriptionRecord` | **Planned (Milestone 2)** | SNOMED-CT / Indian drug terminology mapping pending |
| **Lab Order** | `LaboratoryOrderModel` | `ServiceRequest` | `.../StructureDefinition/ServiceRequest` | **Planned (Milestone 2)** | Requires `basedOn` link inside `DiagnosticReportLab` |
| **Lab Specimen** | `LabSampleModel` | `Specimen` | `.../StructureDefinition/Specimen` | **Planned (Milestone 2)** | SNOMED-CT specimen type & body-site coding pending |
| **Medication History** | `PrescriptionModel` / Patient records | `MedicationStatement` | `.../StructureDefinition/MedicationStatement` | **Planned (Milestone 2/3)** | Optional for OP Consult & Wellness records |
| **Uploaded Medical Document** | `MedicalRecordModel` | `DocumentReference` + `Composition` | `HealthDocumentRecord` | **Planned (Milestone 2)** | Requires private object storage binary retrieval & MIME validation |
| **Consent Record** | `ConsentArtifactModel` | `Consent` (internal) vs HIE-CM Consent Artefact | ABDM HIE-CM Consent JSON | **Adapter Implemented** | Strictly separated via `AbdmConsentAdapter` (`origin` boundary) |
| **Audit / Signatory Provenance** | `AuditLogModel` + `signatureMetadata` | `Provenance` | `.../StructureDefinition/Provenance` | **Planned (Milestone 2)** | Internal cryptographic metadata ready for Provenance mapping |
| **FHIR Document Bundle** | Cross-resource transport envelope | `Bundle` (`type: document`) | `.../StructureDefinition/DocumentBundle` | **Implemented & Validated** | `Composition` at `entry[0]` and `urn:uuid` reference checks verified by unit tests |

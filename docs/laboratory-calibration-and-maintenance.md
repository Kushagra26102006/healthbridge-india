# Instrument Calibration & Maintenance Oversight

## 1. Overview

Diagnostic accuracy relies on calibrated optical detectors, pipetting probes, and heating blocks. HealthBridge India maintains an end-to-end ledger of instrument calibrations and maintenance interventions to prevent drift and ensure equipment longevity.

---

## 2. Calibration Architecture

### Calibration Types
- `ROUTINE`: Periodic scheduled calibration (e.g. monthly/quarterly).
- `POST_REPAIR`: Required verification following component replacement or hardware servicing.
- `INITIAL`: Commissioning baseline calibration prior to production release.
- `VERIFICATION`: Ad-hoc quality audit following control shifts.

### Detailed Parameter Checks
Calibrations capture discrete measured values against NIST-traceable standards:
```json
[
  {
    "parameter": "Photometric Accuracy at 340nm",
    "expectedValue": "1.000 Abs",
    "measuredValue": "0.998 Abs",
    "tolerance": "±0.005 Abs",
    "passed": true
  },
  {
    "parameter": "Incubation Block Temperature",
    "expectedValue": "37.0 °C",
    "measuredValue": "37.1 °C",
    "tolerance": "±0.2 °C",
    "passed": true
  }
]
```

### Calibration Lockout & Clearance:
- **Automatic Failure Lockout**: If `calibrationResult === 'FAILED'`, the instrument's calibration status is marked as `FAILED`, and its operating status is switched to `OUT_OF_SERVICE`.
- **Audited Clearance**: An instrument restricted due to calibration failure cannot return to active service until a formal clearance is submitted via `POST /laboratory/quality/calibrations/:id/clear` with verified clearance notes signed by a Quality Manager.

---

## 3. Maintenance Tracking

### Maintenance Categories
- `PREVENTIVE`: Scheduled routine service, lubrication, tubing replacement, sensor cleaning.
- `CORRECTIVE`: Planned corrective fix for non-critical anomalies.
- `BREAKDOWN`: Emergency repairs resulting from unexpected analyzer stoppage.

### Metric Tracking:
- **Downtime Hours**: Recorded for laboratory throughput impact analysis.
- **Parts Replaced**: Traceable components logged (e.g. peristaltic pump heads, photometer lamps).
- **Service Costs**: Recorded in Indian Rupees (₹) for equipment total cost of ownership tracking.
- **Vendor Tracking**: Service provider company and field service engineer credentials logged.

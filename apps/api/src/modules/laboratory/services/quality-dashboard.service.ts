import { Types } from 'mongoose';
import {
  QualityDashboardDto,
  QualityKPIDto,
  QualityAlertDto,
  QualityTrendPointDto,
} from '@healthbridge/shared-types';
import { QCRunModel } from '../models/qc-run.model';
import { QualityIncidentModel } from '../models/quality-incident.model';
import { CAPAModel } from '../models/capa.model';
import { LabInstrumentModel } from '../models/lab-instrument.model';
import { InstrumentCalibrationModel } from '../models/instrument-calibration.model';
import { ReagentModel, ReagentLotModel } from '../models/reagent.model';
import { qualityControlService } from './quality-control.service';
import { qualityIncidentCapaService } from './quality-incident-capa.service';
import { instrumentManagementService } from './instrument-management.service';
import { reagentInventoryService } from './reagent-inventory.service';

export class QualityDashboardService {
  /**
   * Retrieve aggregated Quality Management Dashboard KPIs & analytics.
   */
  async getDashboardData(laboratoryId: string): Promise<QualityDashboardDto> {
    const labObjId = new Types.ObjectId(laboratoryId);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 1. Parallel KPI aggregate queries
    const [
      totalQCRuns,
      failedQCRuns,
      passedQCRuns,
      openIncidentsCount,
      openCAPACount,
      instrumentsInService,
      instrumentsInMaintenance,
      overdueCalibrationsCount,
      expiringLotsCount,
      lowStockReagentsCount,
    ] = await Promise.all([
      QCRunModel.countDocuments({ laboratoryId: labObjId }),
      QCRunModel.countDocuments({ laboratoryId: labObjId, qcStatus: 'FAILED' }),
      QCRunModel.countDocuments({ laboratoryId: labObjId, qcStatus: 'PASSED' }),
      QualityIncidentModel.countDocuments({
        laboratoryId: labObjId,
        status: { $in: ['OPEN', 'UNDER_INVESTIGATION', 'ACTION_REQUIRED'] },
      }),
      CAPAModel.countDocuments({
        laboratoryId: labObjId,
        status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION'] },
      }),
      LabInstrumentModel.countDocuments({ laboratoryId: labObjId, operatingStatus: 'ACTIVE' }),
      LabInstrumentModel.countDocuments({
        laboratoryId: labObjId,
        $or: [{ operatingStatus: 'IN_MAINTENANCE' }, { nextMaintenanceDate: { $lt: now } }],
      }),
      InstrumentCalibrationModel.countDocuments({
        laboratoryId: labObjId,
        status: { $in: ['SCHEDULED', 'FAILED', 'OVERDUE'] },
        dueDate: { $lt: now },
      }),
      ReagentLotModel.countDocuments({
        laboratoryId: labObjId,
        status: 'ACTIVE',
        expiryDate: { $lte: thirtyDaysFromNow, $gte: now },
      }),
      ReagentModel.countDocuments({
        laboratoryId: labObjId,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minimumStockLevel'] },
      }),
    ]);

    const qcPassRate =
      totalQCRuns > 0 ? Math.round((passedQCRuns / totalQCRuns) * 1000) / 10 : 100;

    const kpis: QualityKPIDto = {
      totalQCRuns,
      qcPassRate,
      qcFailureCount: failedQCRuns,
      openQualityIncidents: openIncidentsCount,
      openCAPAActions: openCAPACount,
      instrumentsInService,
      instrumentsRequiringMaintenance: instrumentsInMaintenance,
      overdueCalibrations: overdueCalibrationsCount,
      reagentsApproachingExpiry: expiringLotsCount,
      reagentStockAlerts: lowStockReagentsCount,
    };

    // 2. Fetch sections data
    const [
      recentFailuresRes,
      openIncidentsRes,
      activeCAPAsRes,
      upcomingCalibrationsRes,
      upcomingMaintenanceRes,
      expiringLotsRes,
    ] = await Promise.all([
      qualityControlService.listQCRuns(laboratoryId, { qcStatus: 'FAILED', limit: 5 }),
      qualityIncidentCapaService.listIncidents(laboratoryId, {
        status: 'OPEN',
        limit: 5,
      }),
      qualityIncidentCapaService.listCAPAs(laboratoryId, {
        status: 'IN_PROGRESS',
        limit: 5,
      }),
      instrumentManagementService.listCalibrations(laboratoryId, {
        status: 'SCHEDULED',
        limit: 5,
      }),
      instrumentManagementService.listMaintenance(laboratoryId, {
        status: 'SCHEDULED',
        limit: 5,
      }),
      reagentInventoryService.listReagentLots(laboratoryId, {
        status: 'ACTIVE',
        expiringWithinDays: 30,
        limit: 5,
      }),
    ]);

    // 3. Generate structured quality alerts
    const alerts: QualityAlertDto[] = [];

    if (failedQCRuns > 0) {
      alerts.push({
        id: 'ALT-QC-FAIL',
        type: 'QC_FAILURE',
        severity: 'HIGH',
        title: 'Active QC Failures',
        message: `${failedQCRuns} Quality Control run(s) failed rule validation.`,
        timestamp: new Date().toISOString(),
        actionUrl: '/laboratory/quality/control',
      });
    }

    if (overdueCalibrationsCount > 0) {
      alerts.push({
        id: 'ALT-CAL-OVERDUE',
        type: 'CALIBRATION_OVERDUE',
        severity: 'HIGH',
        title: 'Calibrations Overdue',
        message: `${overdueCalibrationsCount} instrument calibration(s) are overdue. Affected instruments cannot be used for clinical testing.`,
        timestamp: new Date().toISOString(),
        actionUrl: '/laboratory/quality/calibration',
      });
    }

    if (lowStockReagentsCount > 0) {
      alerts.push({
        id: 'ALT-STOCK-LOW',
        type: 'LOW_STOCK',
        severity: 'MEDIUM',
        title: 'Low Reagent Stock',
        message: `${lowStockReagentsCount} reagent(s) are at or below minimum reserve stock level.`,
        timestamp: new Date().toISOString(),
        actionUrl: '/laboratory/inventory/reagents',
      });
    }

    if (expiringLotsCount > 0) {
      alerts.push({
        id: 'ALT-REAG-EXP',
        type: 'REAGENT_EXPIRY',
        severity: 'MEDIUM',
        title: 'Reagent Lots Approaching Expiry',
        message: `${expiringLotsCount} reagent lot(s) will expire within the next 30 days.`,
        timestamp: new Date().toISOString(),
        actionUrl: '/laboratory/inventory/reagents',
      });
    }

    // 4. Monthly QC trends calculation (Past 6 months from real persisted runs)
    const monthlyTrends: QualityTrendPointDto[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const [monthTotal, monthPassed] = await Promise.all([
        QCRunModel.countDocuments({
          laboratoryId: labObjId,
          runDate: { $gte: startOfMonth, $lte: endOfMonth },
        }),
        QCRunModel.countDocuments({
          laboratoryId: labObjId,
          qcStatus: 'PASSED',
          runDate: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

      const monthFailed = monthTotal - monthPassed;
      const rate = monthTotal > 0 ? Math.round((monthPassed / monthTotal) * 1000) / 10 : 100;
      const label = startOfMonth.toLocaleString('default', { month: 'short', year: '2-digit' });

      monthlyTrends.push({
        date: label,
        totalRuns: monthTotal,
        passedRuns: monthPassed,
        failedRuns: monthFailed,
        passRate: rate,
      });
    }

    return {
      kpis,
      recentFailures: recentFailuresRes.items,
      openIncidents: openIncidentsRes.items,
      activeCAPAs: activeCAPAsRes.items,
      upcomingCalibrations: upcomingCalibrationsRes.items,
      upcomingMaintenance: upcomingMaintenanceRes.items,
      expiringLots: expiringLotsRes.items,
      alerts,
      monthlyTrends,
    };
  }
}

export const qualityDashboardService = new QualityDashboardService();

import { Types } from 'mongoose';
import {
  MedicationCatalogModel,
  INITIAL_MEDICATION_CATALOG,
} from '../models/medication-catalog.model';
import {
  MedicationCatalogItemDto,
  MedicationCatalogFilterQueryDto,
} from '@healthbridge/shared-types';
import { AppError } from '../../../shared/errors/app-error';

export class MedicationCatalogService {
  /**
   * Ensure catalog has standard initial pharmaceuticals available
   */
  async ensureCatalogSeeded(): Promise<void> {
    const count = await MedicationCatalogModel.countDocuments();
    if (count === 0) {
      await MedicationCatalogModel.insertMany(INITIAL_MEDICATION_CATALOG);
    }
  }

  /**
   * Search and filter medication catalog entries
   */
  async searchCatalog(
    query: MedicationCatalogFilterQueryDto
  ): Promise<{ items: MedicationCatalogItemDto[]; total: number; page: number; limit: number; totalPages: number }> {
    await this.ensureCatalogSeeded();

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isActive: true };

    if (query.search && query.search.trim().length > 0) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { genericName: regex },
        { brandName: regex },
        { therapeuticClass: regex },
      ];
    }

    if (query.dosageForm && query.dosageForm !== 'ALL') {
      filter.dosageForm = query.dosageForm.toUpperCase();
    }

    if (query.therapeuticClass && query.therapeuticClass !== 'ALL') {
      filter.therapeuticClass = new RegExp(query.therapeuticClass.trim(), 'i');
    }

    const [items, total] = await Promise.all([
      MedicationCatalogModel.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicationCatalogModel.countDocuments(filter),
    ]);

    const mapped: MedicationCatalogItemDto[] = items.map((doc: any) => ({
      id: doc._id.toString(),
      name: doc.name,
      brandName: doc.brandName,
      genericName: doc.genericName,
      dosageForm: doc.dosageForm,
      strength: doc.strength,
      route: doc.route,
      manufacturer: doc.manufacturer,
      packageSize: doc.packageSize,
      schedule: doc.schedule,
      therapeuticClass: doc.therapeuticClass,
      standardDosageUnit: doc.standardDosageUnit,
      instructionsHint: doc.instructionsHint,
      isActive: doc.isActive,
    }));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single medication catalog item by ID
   */
  async getMedicationById(id: string): Promise<MedicationCatalogItemDto> {
    await this.ensureCatalogSeeded();

    if (!Types.ObjectId.isValid(id)) {
      throw AppError.notFound('Invalid medication catalog ID format');
    }

    const doc = await MedicationCatalogModel.findById(new Types.ObjectId(id)).lean();
    if (!doc || !doc.isActive) {
      throw AppError.notFound('Medication not found in catalog');
    }

    return {
      id: doc._id.toString(),
      name: doc.name,
      brandName: doc.brandName,
      genericName: doc.genericName,
      dosageForm: doc.dosageForm,
      strength: doc.strength,
      route: doc.route,
      manufacturer: doc.manufacturer,
      packageSize: doc.packageSize,
      schedule: doc.schedule,
      therapeuticClass: doc.therapeuticClass,
      standardDosageUnit: doc.standardDosageUnit,
      instructionsHint: doc.instructionsHint,
      isActive: doc.isActive,
    };
  }
}

export const medicationCatalogService = new MedicationCatalogService();
export default medicationCatalogService;
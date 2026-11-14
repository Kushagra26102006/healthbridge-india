import { Types } from 'mongoose';
import { DoctorProfileModel } from '../../users/models/doctor-profile.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { doctorScheduleService } from './doctor-schedule.service';
import { AppError } from '../../../shared/errors/app-error';
import type {
  DoctorPublicDto,
  TimeSlotDto,
  ConsultationType,
} from '@healthbridge/shared-types';
import type { DoctorFilterQueryInput } from '@healthbridge/validation';
import mongoose from 'mongoose';

/**
 * Standard seed doctors for demonstration and offline fallback resilience
 */
export const DEMO_DOCTORS: DoctorPublicDto[] = [
  {
    id: '650000000000000000000101',
    userId: '650000000000000000000201',
    name: 'Dr. Rajesh Verma',
    email: 'dr.rajesh.verma@healthbridge.in',
    phone: '+91 98100 12345',
    specialization: ['Cardiology', 'Interventional Cardiology'],
    qualifications: ['MBBS', 'MD (Medicine)', 'DM (Cardiology) — AIIMS'],
    experience: 16,
    registrationNumber: 'MCI-DEL-2008-84920',
    verificationStatus: 'VERIFIED',
    facility: {
      id: '650000000000000000000301',
      name: 'AIIMS New Delhi',
      type: 'HOSPITAL',
      address: {
        line1: 'Ansari Nagar East',
        city: 'New Delhi',
        district: 'South Delhi',
        state: 'Delhi',
        postalCode: '110029',
      },
    },
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    availableToday: true,
  },
  {
    id: '650000000000000000000102',
    userId: '650000000000000000000202',
    name: 'Dr. Priya Sharma',
    email: 'dr.priya.sharma@healthbridge.in',
    phone: '+91 98200 67890',
    specialization: ['Internal Medicine', 'Diabetology'],
    qualifications: ['MBBS', 'MD (General Medicine)', 'Fellowship in Diabetology'],
    experience: 12,
    registrationNumber: 'DMC-2012-49102',
    verificationStatus: 'VERIFIED',
    facility: {
      id: '650000000000000000000302',
      name: 'Max Super Speciality Hospital, Saket',
      type: 'HOSPITAL',
      address: {
        line1: '1, 2, Press Enclave Road, Saket',
        city: 'New Delhi',
        district: 'South Delhi',
        state: 'Delhi',
        postalCode: '110017',
      },
    },
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    availableToday: true,
  },
  {
    id: '650000000000000000000103',
    userId: '650000000000000000000203',
    name: 'Dr. Vikram Seth',
    email: 'dr.vikram.seth@healthbridge.in',
    phone: '+91 98300 45678',
    specialization: ['Gastroenterology', 'Hepatology'],
    qualifications: ['MBBS', 'MD (Medicine)', 'DM (Gastroenterology)'],
    experience: 18,
    registrationNumber: 'MCI-DEL-2006-38291',
    verificationStatus: 'VERIFIED',
    facility: {
      id: '650000000000000000000303',
      name: 'Apollo Hospitals, New Delhi',
      type: 'HOSPITAL',
      address: {
        line1: 'Sarita Vihar, Delhi Mathura Road',
        city: 'New Delhi',
        district: 'South East Delhi',
        state: 'Delhi',
        postalCode: '110076',
      },
    },
    consultationModes: ['IN_PERSON'],
    availableToday: false,
  },
  {
    id: '650000000000000000000104',
    userId: '650000000000000000000204',
    name: 'Dr. Sunita Patel',
    email: 'dr.sunita.patel@healthbridge.in',
    phone: '+91 98400 34567',
    specialization: ['Pediatrics', 'Neonatology'],
    qualifications: ['MBBS', 'DCH', 'DNB (Pediatrics)'],
    experience: 14,
    registrationNumber: 'GMC-2010-74921',
    verificationStatus: 'VERIFIED',
    facility: {
      id: '650000000000000000000304',
      name: 'Fortis Memorial Research Institute',
      type: 'HOSPITAL',
      address: {
        line1: 'Sector 44, Opposite HUDA City Centre',
        city: 'Gurugram',
        district: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
      },
    },
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    availableToday: true,
  },
  {
    id: '650000000000000000000105',
    userId: '650000000000000000000205',
    name: 'Dr. Arvind Swaminathan',
    email: 'dr.arvind.s@healthbridge.in',
    phone: '+91 98500 89012',
    specialization: ['Orthopedics', 'Joint Replacement Surgery'],
    qualifications: ['MBBS', 'MS (Orthopedics)', 'MCh (Orth)'],
    experience: 20,
    registrationNumber: 'TMC-2004-19402',
    verificationStatus: 'VERIFIED',
    facility: {
      id: '650000000000000000000305',
      name: 'Medanta — The Medicity',
      type: 'HOSPITAL',
      address: {
        line1: 'CH Bakhtawar Singh Road, Sector 38',
        city: 'Gurugram',
        district: 'Gurugram',
        state: 'Haryana',
        postalCode: '122001',
      },
    },
    consultationModes: ['IN_PERSON'],
    availableToday: true,
  },
  {
    id: '650000000000000000000106',
    userId: '650000000000000000000206',
    name: 'Dr. Meera Nambiar',
    email: 'dr.meera.nambiar@healthbridge.in',
    phone: '+91 98600 56789',
    specialization: ['Dermatology', 'Venereology'],
    qualifications: ['MBBS', 'MD (Dermatology, Venereology & Leprosy)'],
    experience: 9,
    registrationNumber: 'KMC-2015-83921',
    verificationStatus: 'VERIFIED',
    facility: {
      id: '650000000000000000000306',
      name: 'Skin & Aesthetic Care Clinic',
      type: 'CLINIC',
      address: {
        line1: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560038',
      },
    },
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    availableToday: true,
  },
];

export class DoctorService {
  /**
   * Retrieves doctors list with filtering, searching, and pagination
   */
  async getDoctors(query: DoctorFilterQueryInput): Promise<{
    items: DoctorPublicDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      try {
        const filter: Record<string, unknown> = {
          verificationStatus: 'VERIFIED',
        };

        if (query.specialization) {
          filter.specialization = { $in: [new RegExp(query.specialization, 'i')] };
        }
        if (query.facilityId && Types.ObjectId.isValid(query.facilityId)) {
          filter.facilityId = new Types.ObjectId(query.facilityId);
        }
        if (query.consultationType) {
          filter.consultationModes = { $in: [query.consultationType] };
        }

        const [profiles, total] = await Promise.all([
          DoctorProfileModel.find(filter)
            .populate('userId', 'name email phone')
            .populate('facilityId', 'name facilityType address')
            .skip(skip)
            .limit(limit)
            .lean(),
          DoctorProfileModel.countDocuments(filter),
        ]);

        if (profiles.length > 0) {
          let items: DoctorPublicDto[] = profiles.map((p: any) => ({
            id: p._id.toString(),
            userId: p.userId?._id?.toString() || p.userId?.toString(),
            name: p.userId?.name || 'Dr. Medical Practitioner',
            email: p.userId?.email,
            phone: p.userId?.phone,
            specialization: p.specialization || [],
            qualifications: p.qualifications || [],
            experience: p.experience || 0,
            registrationNumber: p.registrationNumber,
            verificationStatus: p.verificationStatus,
            facility: p.facilityId
              ? {
                  id: p.facilityId._id.toString(),
                  name: p.facilityId.name,
                  type: p.facilityId.facilityType,
                  address: p.facilityId.address,
                }
              : undefined,
            consultationModes: p.consultationModes || ['IN_PERSON', 'TELECONSULTATION'],
            availableToday: true,
          }));

          // Client query search across doctor name and facility name
          if (query.search) {
            const term = query.search.toLowerCase();
            items = items.filter(
              (doc) =>
                doc.name.toLowerCase().includes(term) ||
                doc.facility?.name.toLowerCase().includes(term) ||
                doc.specialization.some((s) => s.toLowerCase().includes(term))
            );
          }

          const totalPages = Math.ceil(total / limit) || 1;
          return { items, total, page, limit, totalPages };
        }
      } catch {
        // Fallback to demo dataset
      }
    }

    // Demo dataset filtering
    let list = [...DEMO_DOCTORS];

    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.specialization.some((s) => s.toLowerCase().includes(term)) ||
          d.facility?.name.toLowerCase().includes(term) ||
          d.facility?.address?.city.toLowerCase().includes(term)
      );
    }

    if (query.specialization) {
      const spec = query.specialization.toLowerCase();
      list = list.filter((d) => d.specialization.some((s) => s.toLowerCase().includes(spec)));
    }

    if (query.city) {
      const city = query.city.toLowerCase();
      list = list.filter((d) => d.facility?.address?.city.toLowerCase().includes(city));
    }

    if (query.consultationType) {
      list = list.filter((d) => d.consultationModes.includes(query.consultationType as ConsultationType));
    }

    const total = list.length;
    const paginated = list.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves single doctor profile with full verification and credentials details
   */
  async getDoctorById(doctorId: string): Promise<DoctorPublicDto> {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && Types.ObjectId.isValid(doctorId)) {
      try {
        const docId = new Types.ObjectId(doctorId);
        const profile = await DoctorProfileModel.findOne({
          $or: [{ _id: docId }, { userId: docId }],
        })
          .populate('userId', 'name email phone')
          .populate('facilityId', 'name facilityType address contactPhone contactEmail')
          .lean();

        if (profile) {
          const p: any = profile;
          return {
            id: p._id.toString(),
            userId: p.userId?._id?.toString() || p.userId?.toString(),
            name: p.userId?.name || 'Dr. Medical Practitioner',
            email: p.userId?.email,
            phone: p.userId?.phone,
            specialization: p.specialization || [],
            qualifications: p.qualifications || [],
            experience: p.experience || 0,
            registrationNumber: p.registrationNumber,
            verificationStatus: p.verificationStatus,
            facility: p.facilityId
              ? {
                  id: p.facilityId._id.toString(),
                  name: p.facilityId.name,
                  type: p.facilityId.facilityType,
                  address: p.facilityId.address,
                }
              : undefined,
            consultationModes: p.consultationModes || ['IN_PERSON', 'TELECONSULTATION'],
            availableToday: true,
          };
        }
      } catch {
        // Fallback
      }
    }

    // Demo lookup
    const demo = DEMO_DOCTORS.find(
      (d) => d.id === doctorId || d.userId === doctorId
    );

    if (!demo) {
      throw AppError.notFound('Doctor profile not found');
    }

    return demo;
  }

  /**
   * Generates discrete daily time slots and calculates actual live availability
   */
  async getDoctorAvailability(doctorId: string, dateStr: string): Promise<{
    date: string;
    doctorId: string;
    slots: TimeSlotDto[];
  }> {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && Types.ObjectId.isValid(doctorId)) {
      try {
        return await doctorScheduleService.getDoctorAvailabilitySlots(doctorId, dateStr);
      } catch {
        // Fallback to static slot generation
      }
    }

    // Generate 30-minute consultation slots between 09:00 and 17:00 IST
    const slotTimes = [
      { start: '09:00', end: '09:30', label: '09:00 AM' },
      { start: '09:30', end: '10:00', label: '09:30 AM' },
      { start: '10:00', end: '10:30', label: '10:00 AM' },
      { start: '10:30', end: '11:00', label: '10:30 AM' },
      { start: '11:00', end: '11:30', label: '11:00 AM' },
      { start: '11:30', end: '12:00', label: '11:30 AM' },
      { start: '14:00', end: '14:30', label: '02:00 PM' },
      { start: '14:30', end: '15:00', label: '02:30 PM' },
      { start: '15:00', end: '15:30', label: '03:00 PM' },
      { start: '15:30', end: '16:00', label: '03:30 PM' },
      { start: '16:00', end: '16:30', label: '04:00 PM' },
      { start: '16:30', end: '17:00', label: '04:30 PM' },
    ];

    // Find booked appointments for this doctor on this day
    const bookedTimestamps = new Set<string>();

    if (isConnected && Types.ObjectId.isValid(doctorId)) {
      try {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const booked = await AppointmentModel.find({
          doctorId: new Types.ObjectId(doctorId),
          scheduledAt: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['REQUESTED', 'CONFIRMED'] },
        }).lean();

        booked.forEach((app) => {
          bookedTimestamps.add(new Date(app.scheduledAt).toISOString());
        });
      } catch {
        // Fallback
      }
    }

    const now = new Date();

    const slots: TimeSlotDto[] = slotTimes.map((slot) => {
      // Build UTC timestamp for IST time (e.g. 09:30 IST is 04:00 UTC)
      // Indian Standard Time is UTC+05:30
      const parts = slot.start.split(':').map(Number);
      const hours = parts[0] ?? 9;
      const minutes = parts[1] ?? 0;
      const slotDate = new Date(`${dateStr}T00:00:00.000Z`);
      // Convert IST hours to UTC: subtract 5 hours and 30 minutes
      const istMinutesTotal = hours * 60 + minutes;
      const utcMinutesTotal = istMinutesTotal - 330;
      slotDate.setUTCMinutes(utcMinutesTotal);

      const timestamp = slotDate.toISOString();
      const isPast = slotDate <= now;
      const isBooked = bookedTimestamps.has(timestamp);

      return {
        time: slot.label,
        startTime: slot.start,
        endTime: slot.end,
        timestamp,
        isAvailable: !isPast && !isBooked,
      };
    });

    return {
      date: dateStr,
      doctorId,
      slots,
    };
  }
}

export const doctorService = new DoctorService();
export default doctorService;

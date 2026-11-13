import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2, 'State is required'),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Postal code must be a 6-digit Indian PIN code'),
});

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Contact name is required'),
  relationship: z.string().trim().min(2, 'Relationship is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number'),
});

export const patientProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  dateOfBirth: z.coerce.date({
    errorMap: () => ({ message: 'Please provide a valid Date of Birth' }),
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  abhaLinkageStatus: z.enum(['NOT_LINKED', 'LINKED', 'PENDING']).default('NOT_LINKED'),
  abhaAddress: z.string().optional(),
  abhaNumber: z.string().optional(),
});

export const doctorProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  registrationNumber: z
    .string()
    .trim()
    .min(3, 'Medical registration number must be at least 3 characters long'),
  specialization: z
    .array(z.string().trim().min(2))
    .min(1, 'At least one medical specialization is required'),
  qualifications: z
    .array(z.string().trim().min(2))
    .min(1, 'At least one educational/medical qualification is required'),
  experience: z.number().int().min(0, 'Experience in years cannot be negative'),
  facilityId: z.string().optional(),
});

export const pharmacyProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  pharmacyLicenseNumber: z
    .string()
    .trim()
    .min(3, 'Pharmacy license number must be at least 3 characters long'),
  facilityId: z.string().optional(),
});

export const laboratoryProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  laboratoryLicenseNumber: z
    .string()
    .trim()
    .min(3, 'Laboratory license number must be at least 3 characters long'),
  facilityId: z.string().optional(),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;
export type PharmacyProfileInput = z.infer<typeof pharmacyProfileSchema>;
export type LaboratoryProfileInput = z.infer<typeof laboratoryProfileSchema>;

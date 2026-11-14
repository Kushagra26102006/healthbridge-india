import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2, 'State is required'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Postal code must be a 6-digit Indian PIN code'),
});

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Contact name is required'),
  relationship: z.string().trim().min(2, 'Relationship is required'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number'),
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

export const updateAddressSchema = z.object({
  line1: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required').optional(),
  district: z.string().trim().min(2, 'District is required').optional(),
  state: z.string().trim().min(2, 'State is required').optional(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Postal code must be a 6-digit Indian PIN code')
    .optional(),
});

export const updateEmergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Contact name is required').optional(),
  relationship: z.string().trim().min(2, 'Relationship is required').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number')
    .optional(),
});

export const updatePatientProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  profileImage: z.string().max(2000000, 'Profile image payload exceeds size limit').optional(),
  address: updateAddressSchema.optional(),
  emergencyContact: updateEmergencyContactSchema.optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one numeric digit')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== null) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const channelPreferencesSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  appointmentUpdates: channelPreferencesSchema.optional(),
  prescriptionUpdates: channelPreferencesSchema.optional(),
  labReportAlerts: channelPreferencesSchema.optional(),
  consentRequests: channelPreferencesSchema.optional(),
  securityAlerts: channelPreferencesSchema.optional(),
});

export const updateDoctorProfileSchema = z.object({
  bio: z.string().trim().max(2000, 'Bio cannot exceed 2000 characters').optional(),
  languages: z.array(z.string().trim().min(2)).optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
  consultationModes: z.array(z.enum(['IN_PERSON', 'TELECONSULTATION'])).optional(),
  workingDays: z.array(z.string()).optional(),
  workingHours: z
    .object({
      start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:MM format'),
      end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:MM format'),
    })
    .optional(),
  profileImage: z.string().max(2000000, 'Profile image payload exceeds size limit').optional(),
  professionalInterests: z.array(z.string().trim().min(2)).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Phone number must be a valid 10-digit Indian mobile number')
    .optional(),
});

export const updateDoctorPracticeSettingsSchema = z.object({
  facilityId: z.string().optional(),
  consultationModes: z.array(z.enum(['IN_PERSON', 'TELECONSULTATION'])).min(1).optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
  slotDurationMinutes: z.number().min(10).max(120).optional(),
  bufferMinutes: z.number().min(0).max(60).optional(),
  autoConfirmAppointments: z.boolean().optional(),
  maxDailyPatients: z.number().min(1).max(200).optional(),
  teleconsultationLink: z.string().url('Must be a valid consultation URL').optional().or(z.literal('')),
});

export const updateDoctorNotificationPreferencesSchema = z.object({
  newAppointmentRequests: channelPreferencesSchema.optional(),
  appointmentChanges: channelPreferencesSchema.optional(),
  patientCheckIns: channelPreferencesSchema.optional(),
  consultationReminders: channelPreferencesSchema.optional(),
  clinicalWorkflowAlerts: channelPreferencesSchema.optional(),
  securityAlerts: channelPreferencesSchema.optional(),
});

export const doctorUploadDocumentSchema = z.object({
  documentType: z.enum([
    'MEDICAL_REGISTRATION',
    'QUALIFICATION',
    'IDENTITY',
    'EXPERIENCE_CERTIFICATE',
    'OTHER',
  ]),
  title: z.string().trim().min(2, 'Document title is required').max(150),
  fileName: z.string().trim().min(3, 'File name is required').max(200),
  fileData: z.string().optional(),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png'], {
    errorMap: () => ({ message: 'Only PDF, JPEG, and PNG document formats are supported' }),
  }),
  fileSize: z.number().min(1).max(10485760, 'File size cannot exceed 10MB'),
});

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;
export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>;
export type UpdateDoctorPracticeSettingsInput = z.infer<typeof updateDoctorPracticeSettingsSchema>;
export type UpdateDoctorNotificationPreferencesInput = z.infer<typeof updateDoctorNotificationPreferencesSchema>;
export type DoctorUploadDocumentInput = z.infer<typeof doctorUploadDocumentSchema>;

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;


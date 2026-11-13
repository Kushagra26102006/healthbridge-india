import { z } from 'zod';

export const prescribedMedicationSchema = z.object({
  name: z.string().trim().min(2, 'Medication name is required'),
  dosage: z.string().trim().min(1, 'Dosage is required (e.g., 500mg, 10ml)'),
  frequency: z.string().trim().min(1, 'Frequency is required (e.g., 1-0-1, OD, BD)'),
  duration: z.string().trim().min(1, 'Duration is required (e.g., 5 days, 2 weeks)'),
  instructions: z.string().trim().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  encounterId: z.string().optional(),
  medications: z
    .array(prescribedMedicationSchema)
    .min(1, 'Prescription must contain at least one medication'),
  instructions: z.string().trim().min(2, 'Clinical instructions are required'),
  validUntil: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Prescription expiry date must be in the future',
  }),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

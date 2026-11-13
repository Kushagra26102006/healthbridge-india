import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes';
import { authRoutes } from '../modules/auth/routes/auth.routes';
import { docsRoutes } from '../modules/docs/docs.routes';
import { userRoutes } from '../modules/users/routes/user.routes';
import { patientRoutes } from '../modules/patients/routes/patient.routes';
import { doctorRoutes } from '../modules/doctors/routes/doctor.routes';
import { appointmentRoutes } from '../modules/appointments/routes/appointment.routes';
import { recordRoutes } from '../modules/records/routes/record.routes';
import { prescriptionRoutes } from '../modules/prescriptions/routes/prescription.routes';
import { consentRoutes } from '../modules/consent/routes/consent.routes';
import { abdmRoutes } from '../modules/abdm/routes/abdm.routes';
import { pharmacyRoutes } from '../modules/pharmacy/routes/pharmacy.routes';
import { laboratoryRoutes } from '../modules/laboratory/routes/laboratory.routes';
import { auditRoutes } from '../modules/audit/routes/audit.routes';
import { apiLimiter, authLimiter } from '../middleware/rate-limit';

export const v1Router = Router();

// Rate-limited Auth routes
v1Router.use('/auth', authLimiter, authRoutes);

// System & Documentation endpoints
v1Router.use('/health', healthRoutes);
v1Router.use('/docs', docsRoutes);

// Modular Healthcare & Clinical Domain Routes (Protected by general API limiter)
v1Router.use('/users', apiLimiter, userRoutes);
v1Router.use('/patients', apiLimiter, patientRoutes);
v1Router.use('/doctors', apiLimiter, doctorRoutes);
v1Router.use('/appointments', apiLimiter, appointmentRoutes);
v1Router.use('/records', apiLimiter, recordRoutes);
v1Router.use('/prescriptions', apiLimiter, prescriptionRoutes);
v1Router.use('/consent', apiLimiter, consentRoutes);
v1Router.use('/abdm', apiLimiter, abdmRoutes);
v1Router.use('/pharmacy', apiLimiter, pharmacyRoutes);
v1Router.use('/laboratory', apiLimiter, laboratoryRoutes);
v1Router.use('/audit', apiLimiter, auditRoutes);

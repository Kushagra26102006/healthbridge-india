import { describe, it, expect } from 'vitest';
import {
  assistantService,
  assistantChatRequestSchema,
} from '../../src/modules/assistant/services/assistant.service';

describe('HealthBridge Assistant Chatbot — Safety, Emergency & RBAC Unit Tests', () => {
  it('immediately escalates emergency keywords to India emergency helplines 112 and 108', () => {
    const res = assistantService.respond('I am having severe chest pain and difficulty breathing', 'PATIENT');
    expect(res.isEmergency).toBe(true);
    expect(res.category).toBe('EMERGENCY');
    expect(res.reply).toContain('112');
    expect(res.reply).toContain('108');
  });

  it('refuses medical diagnosis or medication dosage requests and directs to verified doctors', () => {
    const res = assistantService.respond('Can you diagnose my fever and tell me what medicine should I take?', 'PATIENT');
    expect(res.isEmergency).toBe(false);
    expect(res.category).toBe('CLINICAL_DISCLAIMER');
    expect(res.reply.toLowerCase()).toContain('cannot provide medical diagnoses');
    expect(res.actions.some((a) => a.href === '/patient/appointments/book')).toBe(true);
  });

  it('strictly enforces role-scoped navigation routes (never leaks /admin routes to non-admins)', () => {
    const patientAudit = assistantService.respond('Show me audit logs and security alerts', 'PATIENT');
    expect(patientAudit.actions.every((a) => !a.href.startsWith('/admin/'))).toBe(true);

    const adminAudit = assistantService.respond('Show me audit logs and security alerts', 'ADMIN');
    expect(adminAudit.actions.some((a) => a.href === '/admin/audit-logs')).toBe(true);

    const pharmacyRx = assistantService.respond('Open prescription queue and low stock inventory', 'PHARMACY');
    expect(pharmacyRx.actions.some((a) => a.href === '/pharmacy/prescriptions')).toBe(true);

    const labSamples = assistantService.respond('How do I scan sample barcodes and lab orders?', 'LABORATORY');
    expect(labSamples.actions.some((a) => a.href === '/laboratory/samples/scan')).toBe(true);

    const doctorAppt = assistantService.respond('Show today queue and start consultation', 'DOCTOR');
    expect(doctorAppt.actions.some((a) => a.href === '/doctor/queue')).toBe(true);
  });

  it('validates chat payloads and rejects empty or oversized messages', () => {
    expect(assistantChatRequestSchema.safeParse({ message: '   ' }).success).toBe(false);
    expect(assistantChatRequestSchema.safeParse({ message: 'a'.repeat(501) }).success).toBe(false);
    expect(assistantChatRequestSchema.safeParse({ message: 'How does ABHA work?' }).success).toBe(true);
  });
});

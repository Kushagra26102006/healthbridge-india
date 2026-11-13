'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Video,
  Users,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  useDoctors,
  useDoctorProfile,
  useDoctorAvailability,
  useBookAppointment,
} from '@/features/appointments/hooks/use-appointments';
import { AppointmentCalendar } from './AppointmentCalendar';
import { TimeSlotSelector } from './TimeSlotSelector';
import { BookingSummary } from './BookingSummary';
import { DoctorSearch } from './DoctorSearch';
import type {
  DoctorPublicDto,
  ConsultationType,
  TimeSlotDto,
  AppointmentDetailDto,
} from '@healthbridge/shared-types';

const STEPS = [
  { id: 1, title: 'Doctor', icon: Stethoscope },
  { id: 2, title: 'Mode', icon: Video },
  { id: 3, title: 'Date', icon: CalendarIcon },
  { id: 4, title: 'Slot', icon: Clock },
  { id: 5, title: 'Reason', icon: FileText },
  { id: 6, title: 'Review', icon: CheckCircle2 },
];

export const AppointmentBookingWizard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDoctorId = searchParams.get('doctorId');

  const [currentStep, setCurrentStep] = useState<number>(queryDoctorId ? 2 : 1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorPublicDto | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('IN_PERSON');

  // Tomorrow as default date in YYYY-MM-DD
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0]!;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingResult, setBookingResult] = useState<{
    status: 'IDLE' | 'SUCCESS' | 'CONFLICT' | 'ERROR';
    message?: string;
    appointment?: AppointmentDetailDto;
  }>({ status: 'IDLE' });

  // Data queries
  const { doctors, isLoading: isDoctorsLoading } = useDoctors({
    search: doctorSearch,
    limit: 12,
  });

  const { doctor: preloadedDoctor } = useDoctorProfile(queryDoctorId || undefined);

  useEffect(() => {
    if (preloadedDoctor && !selectedDoctor) {
      setSelectedDoctor(preloadedDoctor);
      if (currentStep === 1) setCurrentStep(2);
    }
  }, [preloadedDoctor, selectedDoctor, currentStep]);

  // Doctor availability for selected date
  const { slots, isLoading: isSlotsLoading } = useDoctorAvailability(
    selectedDoctor?.userId,
    selectedDate
  );

  const bookMutation = useBookAppointment();

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot || !reason.trim()) return;

    try {
      const result = await bookMutation.mutateAsync({
        doctorId: selectedDoctor.userId,
        facilityId: selectedDoctor.facility?.id,
        scheduledAt: selectedSlot.timestamp,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        consultationType,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      setBookingResult({
        status: 'SUCCESS',
        appointment: result,
      });
      setCurrentStep(7); // Result step
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        setBookingResult({
          status: 'CONFLICT',
          message:
            err.response?.data?.message ||
            'This appointment slot was just reserved by another patient. Please select another slot.',
        });
        setCurrentStep(7);
      } else {
        setBookingResult({
          status: 'ERROR',
          message:
            err.response?.data?.message ||
            err.message ||
            'Failed to schedule appointment. Please try again.',
        });
        setCurrentStep(7);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Indicator */}
      {currentStep <= 6 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-6 gap-2">
            {STEPS.map((s) => {
              const StepIcon = s.icon;
              const isActive = currentStep === s.id;
              const isPassed = currentStep > s.id;

              return (
                <div
                  key={s.id}
                  className={`flex flex-col items-center text-center space-y-1.5 transition-colors ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400 font-semibold'
                      : isPassed
                      ? 'text-slate-800 dark:text-slate-200 font-medium'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md'
                        : isPassed
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className="text-[11px] hidden sm:block truncate w-full">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 1: Select Doctor */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Select Healthcare Practitioner
            </h2>
            <p className="text-xs text-slate-500">
              Choose a verified specialist to conduct your clinical consultation.
            </p>
          </div>

          <DoctorSearch
            initialSearch={doctorSearch}
            onSearchChange={setDoctorSearch}
            placeholder="Search by doctor name or specialization..."
          />

          {isDoctorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Stethoscope className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No specialists matched your query
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDoctorSearch('')}
                className="text-xs"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {doctors.map((doc) => {
                const isSelected = selectedDoctor?.userId === doc.userId;
                return (
                  <Card
                    key={doc.userId}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setCurrentStep(2);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-teal-500 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/20 dark:bg-teal-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {doc.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {doc.name}
                          </span>
                          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {doc.specialization.join(', ')} • {doc.experience} yrs exp
                        </p>
                        {doc.facility && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            {doc.facility.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Consultation Mode */}
      {currentStep === 2 && selectedDoctor && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Select Consultation Mode
            </h2>
            <p className="text-xs text-slate-500">
              Consulting with <span className="font-semibold text-teal-600">{selectedDoctor.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              onClick={() => {
                setConsultationType('IN_PERSON');
                setCurrentStep(3);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all hover:border-teal-500 ${
                consultationType === 'IN_PERSON'
                  ? 'border-teal-600 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    In-Person Clinic Visit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Visit {selectedDoctor.facility?.name || 'the clinic'} in person for physical examination and diagnostics.
                  </p>
                  {selectedDoctor.facility?.address?.line1 && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      📍 {selectedDoctor.facility.address.line1}, {selectedDoctor.facility.address.city}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card
              onClick={() => {
                setConsultationType('TELECONSULTATION');
                setCurrentStep(3);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all hover:border-blue-500 ${
                consultationType === 'TELECONSULTATION'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Video className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    Secure Teleconsultation
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-definition encrypted video consultation from home with digital prescription delivery.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    🎥 Video link activated 10 minutes prior
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="text-xs h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Change Doctor
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentStep(3)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4"
            >
              Continue to Date
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Date & Slot Selection */}
      {(currentStep === 3 || currentStep === 4) && selectedDoctor && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Select Consultation Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Choose an available date and time slot for{' '}
              <span className="font-semibold text-teal-600">{selectedDoctor.name}</span> (
              {consultationType === 'IN_PERSON' ? 'In-Person' : 'Teleconsultation'})
            </p>
          </div>

          <AppointmentCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null); // Reset slot on date change
            }}
          />

          <TimeSlotSelector
            slots={slots}
            selectedSlot={selectedSlot}
            onSlotSelect={(slot) => {
              setSelectedSlot(slot);
              setCurrentStep(5);
            }}
            isLoading={isSlotsLoading}
          />

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(2)}
              className="text-xs h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>

            <Button
              size="sm"
              disabled={!selectedSlot}
              onClick={() => setCurrentStep(5)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4"
            >
              Continue to Reason
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Reason for Visit */}
      {currentStep === 5 && selectedDoctor && selectedSlot && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Clinical Reason & Medical Notes
            </h2>
            <p className="text-xs text-slate-500">
              Help {selectedDoctor.name} prepare by describing your current symptoms or reason for consultation.
            </p>
          </div>

          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Reason for Consultation *</span>
                <span className="text-[11px] text-slate-400 font-normal">Min 5 characters</span>
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Chest tightness, regular hypertension checkup, seasonal cough..."
                className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Additional Notes / Past History (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Taking Telmisartan 40mg daily, recent ECG attached in records..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(4)}
              className="text-xs h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Change Slot
            </Button>

            <Button
              size="sm"
              disabled={reason.trim().length < 5}
              onClick={() => setCurrentStep(6)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4"
            >
              Review Booking
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Confirmation */}
      {currentStep === 6 && selectedDoctor && selectedSlot && (
        <BookingSummary
          doctor={selectedDoctor}
          consultationType={consultationType}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          reason={reason}
          notes={notes}
          onConfirm={handleConfirmBooking}
          onBack={() => setCurrentStep(5)}
          isSubmitting={bookMutation.isPending}
        />
      )}

      {/* STEP 7: Booking Result (Success / Conflict / Error) */}
      {currentStep === 7 && (
        <div className="space-y-6">
          {bookingResult.status === 'SUCCESS' && bookingResult.appointment && (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                  Confirmed
                </Badge>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Appointment Booked Successfully!
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your appointment with {bookingResult.appointment.doctorName} is confirmed for{' '}
                  {new Date(bookingResult.appointment.scheduledAt).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  at {bookingResult.appointment.startTime} (IST).
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/patient/appointments')}
                  className="text-xs h-10 px-4 rounded-xl"
                >
                  View My Appointments
                </Button>

                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/patient/appointments/${bookingResult.appointment!.id}`)
                  }
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-10 px-5 rounded-xl font-medium"
                >
                  View Appointment Details
                </Button>
              </div>
            </Card>
          )}

          {bookingResult.status === 'CONFLICT' && (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                  Slot Conflict
                </Badge>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Time Slot Already Booked
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {bookingResult.message ||
                    'Another patient confirmed this slot a moment before you. Please pick another available time slot.'}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedSlot(null);
                    setCurrentStep(4);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-10 px-6 rounded-xl font-medium flex items-center space-x-1"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Select Another Slot
                </Button>
              </div>
            </Card>
          )}

          {bookingResult.status === 'ERROR' && (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
                  Error
                </Badge>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Booking Failed
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {bookingResult.message}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(6)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-10 px-6 rounded-xl font-medium"
                >
                  Try Again
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

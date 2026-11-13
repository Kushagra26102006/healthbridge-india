'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Video,
  Users,
  Award,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppointmentCalendar } from './AppointmentCalendar';
import { TimeSlotSelector } from './TimeSlotSelector';
import { useDoctorAvailability } from '@/features/appointments/hooks/use-appointments';
import type { DoctorPublicDto, TimeSlotDto } from '@healthbridge/shared-types';

export interface DoctorProfileProps {
  doctor: DoctorPublicDto;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({ doctor }) => {
  const router = useRouter();

  // Tomorrow as default date in YYYY-MM-DD
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0]!;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null);

  const { slots, isLoading: isSlotsLoading } = useDoctorAvailability(
    doctor.userId,
    selectedDate
  );

  const isVerified = doctor.verificationStatus === 'VERIFIED';
  const hasInPerson = doctor.consultationModes?.includes('IN_PERSON');
  const hasTeleconsult = doctor.consultationModes?.includes('TELECONSULTATION');

  const handleBookSelectedSlot = () => {
    if (selectedSlot) {
      router.push(
        `/patient/appointments/book?doctorId=${doctor.userId}&date=${selectedDate}&slot=${selectedSlot.startTime}`
      );
    } else {
      router.push(`/patient/appointments/book?doctorId=${doctor.userId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 -ml-2"
        >
          <Link href="/patient/doctors">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Doctors Directory
          </Link>
        </Button>
      </div>

      {/* Main Profile Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {doctor.name
                  .replace('Dr. ', '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              {isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm"
                  title="ABHA Verified Medical Practitioner"
                >
                  <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400 fill-teal-500/20" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {doctor.name}
                </h1>
                {isVerified && (
                  <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs font-medium">
                    Verified Practitioner
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {doctor.specialization.map((spec) => (
                  <Badge
                    key={spec}
                    variant="secondary"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5"
                  >
                    {spec}
                  </Badge>
                ))}
              </div>

              {doctor.registrationNumber && (
                <p className="text-xs text-slate-400 pt-1">
                  Registration: <span className="font-mono">{doctor.registrationNumber}</span>
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleBookSelectedSlot}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-6 py-2.5 rounded-xl shadow-sm font-semibold flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <span>Book Consultation</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Credentials, Affiliation & Experience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <Award className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Qualifications
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {doctor.qualifications?.join(', ') || 'MBBS, MD'}
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Clinical Experience
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {doctor.experience} Years Active Practice
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <Building2 className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Primary Facility
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                {doctor.facility?.name || 'Authorized Hospital'}
              </span>
              {doctor.facility?.address?.city && (
                <span className="text-xs text-slate-500">
                  {doctor.facility.address.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Consultation Modes Support */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Available Consultation Modes
          </span>
          <div className="flex flex-wrap gap-2">
            {hasInPerson && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 text-xs font-medium">
                <Users className="h-4 w-4 text-teal-600" />
                <span>In-Person Clinic Consultation</span>
              </div>
            )}
            {hasTeleconsult && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-medium">
                <Video className="h-4 w-4 text-blue-600" />
                <span>Encrypted Teleconsultation (Video / Audio)</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Real-time Availability & Slot Booking Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              <span>Real-Time Appointment Slots</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select your preferred consultation date and time slot to proceed with booking.
            </p>
          </div>

          {selectedSlot && (
            <Button
              size="sm"
              onClick={handleBookSelectedSlot}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl shadow-sm font-semibold flex items-center space-x-1"
            >
              <span>Book {selectedSlot.time}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>

        <AppointmentCalendar
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setSelectedSlot(null);
          }}
        />

        <TimeSlotSelector
          slots={slots}
          selectedSlot={selectedSlot}
          onSlotSelect={setSelectedSlot}
          isLoading={isSlotsLoading}
        />
      </Card>
    </div>
  );
};

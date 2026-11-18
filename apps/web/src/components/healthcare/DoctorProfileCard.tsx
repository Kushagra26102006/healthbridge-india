import * as React from 'react';
import { Building2, Video, MapPin, Award, BadgeCheck } from 'lucide-react';
import type { DoctorPublicDto } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { cn } from '@/lib/utils';

export interface DoctorProfileCardProps {
  doctor: DoctorPublicDto;
  onSelect?: (doctor: DoctorPublicDto) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function DoctorProfileCard({
  doctor,
  onSelect,
  actions,
  className,
}: DoctorProfileCardProps) {
  const isVerified = doctor.verificationStatus === 'VERIFIED';

  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(doctor) : undefined}
      className={cn('p-5 flex flex-col gap-4', className)}
    >
      <div className="flex items-start gap-3.5">
        <Avatar
          name={doctor.name}
          size="lg"
          status={doctor.availableToday ? 'online' : isVerified ? 'verified' : undefined}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-card-heading truncate">{doctor.name}</h3>
            {isVerified && (
              <BadgeCheck
                className="h-4 w-4 text-secondary shrink-0"
                aria-label="HPR Verified Practitioner"
              />
            )}
          </div>
          {doctor.specialization.length > 0 && (
            <p className="text-xs sm:text-sm font-medium text-primary truncate">
              {doctor.specialization.join(' • ')}
            </p>
          )}
          {doctor.qualifications.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {doctor.qualifications.join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Award className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{doctor.experience} yrs experience</span>
        </span>
        {doctor.facility?.name && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{doctor.facility.name}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/80">
        <div className="flex flex-wrap items-center gap-1.5">
          {doctor.consultationModes.includes('IN_PERSON') && (
            <Badge variant="neutral" size="sm">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span>In-Person</span>
            </Badge>
          )}
          {doctor.consultationModes.includes('TELECONSULTATION') && (
            <Badge variant="teal" size="sm">
              <Video className="h-3 w-3" aria-hidden="true" />
              <span>Teleconsult</span>
            </Badge>
          )}
        </div>

        {doctor.availableToday !== undefined && (
          <StatusIndicator
            status={doctor.availableToday ? 'online' : 'offline'}
            label={doctor.availableToday ? 'Available Today' : 'Next Slot Scheduled'}
            size="sm"
          />
        )}
      </div>

      {actions && (
        <div
          className="flex flex-wrap items-center justify-end gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </Card>
  );
}

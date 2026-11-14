'use client';

import React from 'react';
import { User, Calendar, MapPin, Heart, Phone, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PatientProfileDto } from '@healthbridge/shared-types';

export interface PersonalInformationCardProps {
  profile?: PatientProfileDto;
  onEditClick?: () => void;
}

export const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({
  profile,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not Provided';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const birth = new Date(dateStr);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  const age = calculateAge(profile?.dateOfBirth);

  const address = profile?.address;
  const emergency = profile?.emergencyContact;

  return (
    <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Personal & Demographics
            </CardTitle>
          </div>
          {profile?.bloodGroup && (
            <Badge variant="outline" className="border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
              Blood Group: {profile.bloodGroup}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5 text-xs">
        {/* Core Demographics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Full Legal Name
            </span>
            <p className="font-bold text-foreground">{profile?.name || 'Not specified'}</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date of Birth
            </span>
            <p className="font-semibold text-foreground">
              {formatDate(profile?.dateOfBirth)}
              {age !== null && <span className="text-muted-foreground font-normal ml-1">({age} yrs)</span>}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Gender
            </span>
            <p className="font-semibold text-foreground capitalize">
              {profile?.gender ? profile.gender.toLowerCase() : 'Not specified'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500" />
              Blood Group
            </span>
            <p className="font-semibold text-foreground">
              {profile?.bloodGroup || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Address and Emergency Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
          {/* Residential Address */}
          <div className="space-y-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Residential Address</span>
            </span>
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1 leading-relaxed">
              {address ? (
                <>
                  {address.line1 && <p className="text-foreground">{address.line1}</p>}
                  <p className="text-foreground font-medium">
                    {address.city}, {address.district}
                  </p>
                  <p className="text-muted-foreground">
                    {address.state} — <span className="font-mono font-semibold">{address.postalCode}</span>
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground italic">No address provided</p>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-rose-500" />
              <span>Emergency Contact</span>
            </span>
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1 leading-relaxed">
              {emergency ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{emergency.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {emergency.relationship}
                    </Badge>
                  </div>
                  <p className="font-mono text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>Phone: +91 {emergency.phone}</span>
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground italic">No emergency contact on file</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


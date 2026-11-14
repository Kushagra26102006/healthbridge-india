'use client';

import React, { useState } from 'react';
import { User, Calendar, MapPin, Phone, AlertCircle, Save, X, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdatePatientProfile } from '@/features/patient/hooks/use-profile';
import type { PatientProfileDto, Gender, BloodGroup } from '@healthbridge/shared-types';

export interface EditProfileFormProps {
  profile: PatientProfileDto;
  onCancel: () => void;
  onSuccess: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  profile,
  onCancel,
  onSuccess,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || '');
  const [gender, setGender] = useState<Gender>(profile.gender || 'OTHER');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(profile.bloodGroup || '');

  // Address
  const [line1, setLine1] = useState(profile.address?.line1 || '');
  const [city, setCity] = useState(profile.address?.city || '');
  const [district, setDistrict] = useState(profile.address?.district || '');
  const [state, setState] = useState(profile.address?.state || '');
  const [postalCode, setPostalCode] = useState(profile.address?.postalCode || '');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContact?.name || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(
    profile.emergencyContact?.relationship || 'Family'
  );
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContact?.phone || '');

  const [formError, setFormError] = useState<string | null>(null);

  const updateMutation = useUpdatePatientProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Full legal name is required');
      return;
    }

    if (postalCode && !/^\d{6}$/.test(postalCode)) {
      setFormError('Postal code must be a 6-digit Indian PIN code');
      return;
    }

    if (emergencyPhone && !/^[6-9]\d{9}$/.test(emergencyPhone)) {
      setFormError('Emergency contact phone must be a valid 10-digit Indian mobile number');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender,
        bloodGroup: (bloodGroup as BloodGroup) || undefined,
        address: {
          line1: line1.trim() || undefined,
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
        emergencyContact: {
          name: emergencyName.trim(),
          relationship: emergencyRelationship.trim(),
          phone: emergencyPhone.trim(),
        },
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update patient profile';
      setFormError(msg);
    }
  };

  return (
    <Card className="border-teal-500/30 shadow-lg bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-teal-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Edit Personal Information
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Update legal identity, residential address, and emergency contact
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-5 space-y-5 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Legal Identity Notice */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span>
              Account roles, national verification flags, and ABDM identifiers cannot be edited here.
              Contact customer support or use ABDM KYC workflow for sovereign identity updates.
            </span>
          </div>

          {/* Basic Personal Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <User className="h-3 w-3 text-teal-600" />
                Full Legal Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                required
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-teal-600" />
                Date of Birth
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup | '')}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Blood Group (Optional)</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* Residential Address Fields */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-teal-600" />
              <span>Residential Address</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Address Line (Street, House/Flat No.)</label>
              <Input
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="e.g. Flat 402, Shanti Nilayam, MG Road"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">City *</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">District *</label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. South Delhi"
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">State *</label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Delhi"
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">PIN Code *</label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  required
                  className="text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Fields */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-rose-500" />
              <span>Emergency Contact</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Contact Name *</label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Sunita Kumar"
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Relationship *</label>
                <Input
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="e.g. Spouse / Parent / Sibling"
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Mobile Phone (10-digits) *</label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  required
                  className="text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2.5 p-4 border-t border-border/60 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={updateMutation.isPending}
            className="text-xs rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={updateMutation.isPending}
            className="text-xs gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateMutation.isPending ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};


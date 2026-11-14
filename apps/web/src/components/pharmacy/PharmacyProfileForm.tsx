'use client';

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  ShieldCheck,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PharmacyProfileDto, UpdatePharmacyProfileDto } from '@healthbridge/shared-types';

export interface PharmacyProfileFormProps {
  profile: PharmacyProfileDto;
  onSave: (dto: UpdatePharmacyProfileDto) => Promise<unknown>;
  isSaving?: boolean;
}

const ALL_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const AVAILABLE_SERVICES = [
  { id: 'IN_STORE_PICKUP', label: 'In-Store Pickup' },
  { id: 'HOME_DELIVERY', label: 'Doorstep Delivery' },
  { id: 'PRESCRIPTION_REFILL', label: 'Prescription Refill Tracking' },
  { id: 'EMERGENCY_MEDICINE', label: 'Emergency 24x7 Medicines' },
  { id: 'VACCINATION_SUPPORT', label: 'Vaccination Support' },
];

export function PharmacyProfileForm({ profile, onSave, isSaving = false }: PharmacyProfileFormProps) {
  const [pharmacyName, setPharmacyName] = useState(profile.pharmacyName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [description, setDescription] = useState(profile.description || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');

  const [line1, setLine1] = useState(profile.address?.line1 || '');
  const [city, setCity] = useState(profile.address?.city || 'New Delhi');
  const [state, setState] = useState(profile.address?.state || 'Delhi');
  const [postalCode, setPostalCode] = useState(profile.address?.postalCode || '110001');

  const [openingTime, setOpeningTime] = useState(profile.openingTime || '08:00');
  const [closingTime, setClosingTime] = useState(profile.closingTime || '22:00');
  const [is24Hours, setIs24Hours] = useState(Boolean(profile.is24Hours));
  const [weeklyAvailability, setWeeklyAvailability] = useState<string[]>(
    profile.weeklyAvailability || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  );
  const [supportedServices, setSupportedServices] = useState<string[]>(
    profile.supportedServices || ['IN_STORE_PICKUP', 'PRESCRIPTION_REFILL']
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    if (weeklyAvailability.includes(day)) {
      setWeeklyAvailability(weeklyAvailability.filter((d) => d !== day));
    } else {
      setWeeklyAvailability([...weeklyAvailability, day]);
    }
  };

  const toggleService = (serviceId: string) => {
    if (supportedServices.includes(serviceId)) {
      setSupportedServices(supportedServices.filter((s) => s !== serviceId));
    } else {
      setSupportedServices([...supportedServices, serviceId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave({
        pharmacyName,
        phone,
        description,
        logoUrl: logoUrl || undefined,
        address: {
          line1,
          city,
          state,
          postalCode,
          country: 'India',
        },
        openingTime,
        closingTime,
        is24Hours,
        weeklyAvailability,
        supportedServices,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Pharmacy profile information successfully updated.
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* 1. Basic Details */}
      <Card className="border border-border/80 bg-card/60 rounded-2xl shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Basic Pharmacy Details
          </CardTitle>
          <CardDescription className="text-xs">
            Commercial trade identity, description, and primary communication channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Pharmacy Trade Name *
              </label>
              <input
                type="text"
                required
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="e.g. Apollo Pharmacy Connaught Place"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Contact Phone (10 digits) *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Registered Contact Email (Account Bound)
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-muted/60 border border-border text-muted-foreground font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Logo / Storefront Image URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Description & Specializations
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief clinical summary of medicines stocked, special refrigeration capabilities, or 24/7 delivery services..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Location & Facility */}
      <Card className="border border-border/80 bg-card/60 rounded-2xl shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Physical Location & Address
          </CardTitle>
          <CardDescription className="text-xs">
            Geographic location for in-store patient collections and prescription dispatch routing.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Address Line (Shop / Floor / Building / Street)
            </label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="e.g. Ground Floor, Block A, 12 Press Enclave"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Statutory Registration & Verification Status */}
      <Card className="border border-border/80 bg-card/60 rounded-2xl shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Statutory License & Verification
            </span>
            <Badge
              variant="outline"
              className={
                profile.verificationStatus === 'VERIFIED'
                  ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                  : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
              }
            >
              {profile.verificationStatus}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Drug Controller statutory credentials. License numbers and verification status cannot be self-edited.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Drug License Number (Read-Only)
              </label>
              <input
                type="text"
                disabled
                value={profile.pharmacyLicenseNumber}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-muted/60 border border-border text-foreground font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                disabled
                value={profile.gstin || 'GSTIN-PENDING-SUBMISSION'}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-muted/60 border border-border text-foreground font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <p>
              To update statutory drug licenses or request physical audit re-inspection, please contact the
              State Drug Control Administration or submit updated certificates through HealthBridge Partner Support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Operating Hours & Services */}
      <Card className="border border-border/80 bg-card/60 rounded-2xl shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Operating Hours & Supported Services
          </CardTitle>
          <CardDescription className="text-xs">
            Working hours determine when patients can place on-demand fulfillment orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="24hours"
              checked={is24Hours}
              onChange={(e) => setIs24Hours(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-border"
            />
            <label htmlFor="24hours" className="text-xs font-semibold text-foreground cursor-pointer">
              Open 24x7 (Round-the-clock emergency pharmacy services)
            </label>
          </div>

          {!is24Hours && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Daily Opening Time (24h format)
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Daily Closing Time (24h format)
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-background border border-border focus:border-teal-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Weekly Operating Days
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const active = weeklyAvailability.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                      active
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Supported Patient Fulfillment Services
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SERVICES.map((srv) => {
                const active = supportedServices.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-colors ${
                      active
                        ? 'bg-teal-500/10 border-teal-500/30 text-foreground font-medium'
                        : 'bg-card/40 border-border text-muted-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleService(srv.id)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-border"
                    />
                    <span>{srv.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-md shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Changes...' : 'Save Profile Settings'}
        </button>
      </div>
    </form>
  );
}
export default PharmacyProfileForm;


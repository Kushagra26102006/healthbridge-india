'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  usePharmacyProfile,
  useUpdatePharmacyProfile,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function PharmacyGeneralSettingsPage() {
  const { data: profile, isLoading, refetch } = usePharmacyProfile();
  const updateMutation = useUpdatePharmacyProfile();

  const [pharmacyName, setPharmacyName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setPharmacyName(profile.pharmacyName || '');
      setPhone(profile.phone || '');
      setDescription(profile.description || '');
      setWebsiteUrl(profile.websiteUrl || '');
      setLogoUrl(profile.logoUrl || '');
      setAddressLine1(profile.address?.line1 || '');
      setCity(profile.address?.city || 'New Delhi');
      setState(profile.address?.state || 'Delhi');
      setPostalCode(profile.address?.postalCode || '110001');
      setCountry(profile.address?.country || 'India');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMessage(null);

    try {
      await updateMutation.mutateAsync({
        pharmacyName: pharmacyName.trim(),
        phone: phone.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        address: {
          line1: addressLine1.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update general settings');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full" />
        <div className="h-96 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Establishment Profile</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          General Information & Address
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure store identification, dispensary contact information, and physical premises location.
        </p>
      </div>

      <PharmacySettingsNav />

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>General establishment details saved successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Establishment Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pharmacy / Trade Name *
              </label>
              <Input
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="e.g. Apollo Pharmacy Connaught Place"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Contact Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Email (Read-only Account ID)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="pl-9 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://examplepharmacy.in"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Logo / Storefront Image URL
              </label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://images.example.com/pharmacy-logo.png"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Establishment Description
              </label>
              <Textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your pharmaceutical services, certified cold chain capabilities, consultation facilities..."
              />
            </div>
          </div>
        </div>

        {/* Physical Premises Address */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Dispensary Premises Address</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street Address / Shop No.
              </label>
              <Input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Shop 12-B, Ground Floor, Market Complex"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                City *
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New Delhi"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                State / UT *
              </label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Delhi"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                PIN Code (6 digits) *
              </label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="110001"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Country
              </label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={updateMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-sky-600 hover:bg-sky-700 text-white"
            disabled={updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save General Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  X,
  Save,
  AlertCircle,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { DoctorProfileDto, UpdateDoctorProfileDto } from '@healthbridge/shared-types';

interface DoctorProfileEditorProps {
  profile: DoctorProfileDto;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateDoctorProfileDto) => Promise<void>;
  isSaving: boolean;
}

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
];

export function DoctorProfileEditor({
  profile,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: DoctorProfileEditorProps) {
  const [bio, setBio] = useState(profile.bio || '');
  const [consultationFee, setConsultationFee] = useState<number>(profile.consultationFee ?? 500);
  const [languages, setLanguages] = useState<string[]>(profile.languages || ['English', 'Hindi']);
  const [consultationModes, setConsultationModes] = useState<('IN_PERSON' | 'TELECONSULTATION')[]>(
    profile.consultationModes || ['IN_PERSON', 'TELECONSULTATION']
  );
  const [phone, setPhone] = useState(profile.phone || '');
  const [professionalInterests, setProfessionalInterests] = useState<string[]>(
    profile.professionalInterests || []
  );
  const [newInterest, setNewInterest] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleMode = (mode: 'IN_PERSON' | 'TELECONSULTATION') => {
    if (consultationModes.includes(mode) && consultationModes.length === 1) {
      return; // Must have at least one mode
    }
    setConsultationModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const addInterest = () => {
    if (newInterest.trim() && !professionalInterests.includes(newInterest.trim())) {
      setProfessionalInterests([...professionalInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (tag: string) => {
    setProfessionalInterests(professionalInterests.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (consultationFee < 0) {
      setErrorMsg('Consultation fee cannot be negative');
      return;
    }

    if (languages.length === 0) {
      setErrorMsg('Please select at least one spoken language');
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    try {
      await onSave({
        bio: bio.trim(),
        consultationFee,
        languages,
        consultationModes,
        professionalInterests,
        phone: phone || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update professional profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Edit Professional Profile
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update permitted clinical information, consultation details and contact preferences
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Protected Fields Notice */}
          <div className="p-3 rounded-xl border border-border/80 bg-muted/40 text-xs flex items-start gap-2.5 text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Verified Credentials Notice: </span>
              Medical Registration Number ({profile.registrationNumber}), Primary Specializations ({profile.specialization.join(', ')}), and Verification Status cannot be modified directly. Sensitive credential changes require authorized administrative re-verification.
            </div>
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Contact Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit Indian Mobile Number"
              className="text-xs h-9"
              maxLength={10}
            />
          </div>

          {/* Professional Biography */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Professional Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Describe your clinical background, philosophy of care, and expertise..."
              className="w-full text-xs rounded-xl border border-border bg-background p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="text-[11px] text-muted-foreground text-right">
              {bio.length}/2000 characters
            </div>
          </div>

          {/* Consultation Fee & Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Standard Consultation Fee (₹)</label>
              <Input
                type="number"
                min={0}
                step={50}
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Consultation Modes</label>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant={consultationModes.includes('IN_PERSON') ? 'default' : 'outline'}
                  onClick={() => toggleMode('IN_PERSON')}
                  className={`text-xs h-8 ${
                    consultationModes.includes('IN_PERSON') ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  In-Person Clinic
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={consultationModes.includes('TELECONSULTATION') ? 'default' : 'outline'}
                  onClick={() => toggleMode('TELECONSULTATION')}
                  className={`text-xs h-8 ${
                    consultationModes.includes('TELECONSULTATION') ? 'bg-teal-600 text-white' : ''
                  }`}
                >
                  Teleconsultation
                </Button>
              </div>
            </div>
          </div>

          {/* Spoken Languages */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Languages Spoken</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const selected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${
                      selected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-400'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Professional Interests / Subspecialties */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Clinical Interests & Subspecialties
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInterest();
                  }
                }}
                placeholder="e.g. Preventive Cardiology, Diabetes Management"
                className="text-xs h-9 flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={addInterest}
                className="text-xs h-9 gap-1"
                disabled={!newInterest.trim()}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {professionalInterests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {professionalInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-medium"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${interest}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/80 flex items-center justify-end gap-3 bg-muted/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving Changes...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DoctorProfileEditor;

'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface EncounterSaveStatusProps {
  isDraft: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt?: Date;
  version: number;
  onSaveDraft: () => void;
  onFinalize: () => void;
}

export function EncounterSaveStatus({
  isDraft,
  isSaving,
  isCompleting,
  hasUnsavedChanges,
  lastSavedAt,
  version,
  onSaveDraft,
  onFinalize,
}: EncounterSaveStatusProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl px-4 py-2.5 shadow-xs sticky top-3 z-20">
        {/* Left: Status Indicators */}
        <div className="flex items-center gap-3 text-xs">
          {isDraft ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/40 text-[10px]">
              Draft Mode (v{version})
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/40 text-[10px] gap-1">
              <Lock className="h-3 w-3" />
              Finalized EMR Record
            </Badge>
          )}

          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isSaving ? (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving draft...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                {lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString('en-IN')}` : 'All changes saved'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        {isDraft && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSaving || isCompleting}
              className="text-xs gap-1.5 h-8 border-border/80"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              Save Draft
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSaving || isCompleting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 shadow-xs"
            >
              {isCompleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              Finalize Consultation
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Finalization */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                Finalize Clinical Encounter
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Finalizing this encounter locks the clinical notes, diagnoses, and vitals.
                Once completed, clinical records are legally immutable under ABDM guidelines.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Ensure all diagnoses, notes, and treatment instructions are accurate before proceeding.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isCompleting}
                className="text-xs"
              >
                Continue Editing
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowConfirmModal(false);
                  onFinalize();
                }}
                disabled={isCompleting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                {isCompleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm & Finalize
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState } from 'react';
import { Mail, Phone, CheckCircle2, AlertCircle, Send, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { PatientProfileDto } from '@healthbridge/shared-types';

export interface ContactInformationCardProps {
  profile?: PatientProfileDto;
}

export const ContactInformationCard: React.FC<ContactInformationCardProps> = ({
  profile,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResendEmailVerification = async () => {
    if (!profile?.email) return;
    try {
      setIsResending(true);
      setResendStatus(null);
      await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email: profile.email });
      setResendStatus('Verification email dispatched. Please check your inbox.');
    } catch {
      setResendStatus('Failed to send verification link. Please try again shortly.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold text-foreground">
            Contact Channels & Verification
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 text-xs">
        {resendStatus && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
            <span>{resendStatus}</span>
          </div>
        )}

        {/* Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Primary Email
                </span>
                {profile?.emailVerified ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/10 text-[10px] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Unverified</span>
                  </Badge>
                )}
              </div>
              <p className="font-semibold text-foreground text-sm truncate">{profile?.email || 'N/A'}</p>
            </div>

            {!profile?.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendEmailVerification}
                disabled={isResending}
                className="w-full text-[11px] h-8 rounded-xl gap-1.5 border-border"
              >
                <Send className="h-3 w-3" />
                <span>{isResending ? 'Sending...' : 'Resend Verification Link'}</span>
              </Button>
            )}
          </div>

          {/* Phone */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Mobile Number
                </span>
                {profile?.phoneVerified ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified OTP</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
                    SMS Gateway Ready
                  </Badge>
                )}
              </div>
              <p className="font-mono font-semibold text-foreground text-sm">
                +91 {profile?.phone || 'N/A'}
              </p>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Used for critical prescription alerts, OTP logins, and emergency contact verification.
            </p>
          </div>
        </div>

        {/* DPDP Notice */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
          <span>
            Under DPDP Act and ABDM guidelines, primary contact updates require step-up authentication
            to prevent unauthorized redirection of healthcare data.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

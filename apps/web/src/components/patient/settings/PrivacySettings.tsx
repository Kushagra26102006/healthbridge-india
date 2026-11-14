'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Lock,
  Download,
  Trash2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const PrivacySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Consent Management Shortcut */}
      <Card className="border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-card to-cyan-500/10 rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-600 text-white text-[10px] font-medium">
                  ABDM Consent Manager
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  DPDP Act Compliant
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                Granular Health Data Access Control
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Control exactly which healthcare practitioners, diagnostic labs, and clinics can
                access your health records. Approve, decline, or revoke access permissions at any time.
              </p>
            </div>

            <Link href="/patient/consent">
              <Button size="sm" className="text-xs gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shrink-0">
                <span>Manage Consents</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. Data Governance & Sovereign Privacy Principles */}
      <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Data Privacy Governance & Policies
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                How HealthBridge India stores, processes, and protects your medical history
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Zero Unconsented Sharing</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No third-party insurer, employer, or commercial advertiser receives access to your
                medical records. Every health provider query requires an active, unexpired digital
                consent artifact.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Full Audit Transparency</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Every record retrieval, prescription view, and consent grant is logged in an
                immutable, append-only security log with exact timestamp, provider registry ID, and clinical purpose.
              </p>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-foreground text-xs">Legal Policies & Declarations</span>
              <p className="text-[11px] text-muted-foreground">
                Review our comprehensive Privacy Policy and Terms of Medical Data Processing
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl border-border gap-1"
                asChild
              >
                <Link href="/privacy" target="_blank">
                  <span>Privacy Policy</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl border-border gap-1"
                asChild
              >
                <Link href="/terms" target="_blank">
                  <span>Terms of Service</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Account Data Management & Portability (Documented Future Integrations) */}
      <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Data Portability & Account Erasure
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Indian Digital Personal Data Protection (DPDP) Act Rights
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10">
              Roadmap Feature
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0" />
              <span>Compliant Portability Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              In strict accordance with the DPDP Act and clinical data retention statutes (MCI / NMC
              clinical records guidelines), full FHIR R4 archive export and irreversible account erasure
              workflows are currently scheduled for the upcoming production release.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Export Archive */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-teal-600" />
                  <span>Download Health Vault Archive (FHIR R4)</span>
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Export an encrypted bundle containing all prescriptions, lab results, and consultation records.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs rounded-xl opacity-60 cursor-not-allowed justify-start"
              >
                <span>Export Data Archive (Coming Soon)</span>
              </Button>
            </div>

            {/* Erasure */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Right to Erasure Request</span>
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Request closure of your HealthBridge account and cryptographic de-indexing of personal data.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs rounded-xl opacity-60 cursor-not-allowed justify-start"
              >
                <span>Request Account Erasure (Coming Soon)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


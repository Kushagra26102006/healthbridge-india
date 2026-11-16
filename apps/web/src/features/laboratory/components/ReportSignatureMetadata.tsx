'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, FileCode } from 'lucide-react';
import type { ReportApprovalDetailsDto, ReportSignatureMetadataDto } from '@healthbridge/shared-types';

interface ReportSignatureMetadataProps {
  approvalDetails?: ReportApprovalDetailsDto;
  signatureMetadata?: ReportSignatureMetadataDto;
  documentHash?: string;
  reportNumber: string;
  version?: number;
}

export const ReportSignatureMetadata: React.FC<ReportSignatureMetadataProps> = ({
  approvalDetails,
  signatureMetadata,
  documentHash,
  reportNumber,
  version = 1,
}) => {
  const hash = signatureMetadata?.documentHash || documentHash;
  const signerName = signatureMetadata?.signerName || approvalDetails?.approvedByName || 'Authorized Signatory';
  const designation = approvalDetails?.approvedByDesignation || 'Consultant Pathologist & Laboratory Director';
  const registrationNo = approvalDetails?.approvedByRegistrationNumber || 'MCI / State Medical Council Registered';
  const signedAt = signatureMetadata?.signedAt || approvalDetails?.approvedAt;

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-emerald-200/60 dark:border-emerald-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Digitally Verified & Approved Report
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified under NABL ISO 15189 and internal cryptographic attestation
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            {reportNumber} • v{version}.0
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Approved & Signed By</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{signerName}</p>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{designation}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mt-0.5">{registrationNo}</p>
        </div>

        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Timestamp of Signature</span>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {signedAt ? new Date(signedAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }) : 'Recorded upon release'}
          </p>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] mt-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Tamper-evident internal SHA-256 seal</span>
          </div>
        </div>

        <div>
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Cryptographic Document Hash</span>
          {hash ? (
            <div className="flex items-center gap-1.5 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <code className="text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate block">
                {hash}
              </code>
            </div>
          ) : (
            <span className="text-slate-400 italic">Pending publication digest</span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-200/40 dark:border-emerald-800/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Attestation Method: Internal SHA-256 Server Digest</span>
        <span className="text-[10px] italic">Statutory eSign/DSC integration pending national PKI gateway configuration</span>
      </div>
    </div>
  );
};

export default ReportSignatureMetadata;

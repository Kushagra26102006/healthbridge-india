'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecordDetails, RecordDetailSkeleton } from '@/components/patient/records';
import { useRecordDetails, useDownloadRecord } from '@/features/records/hooks/use-records';

export default function PatientRecordDetailPage() {
  const params = useParams();
  const recordId = typeof params.recordId === 'string' ? params.recordId : '';

  const { record, isLoading, isError, error } = useRecordDetails(recordId);
  const { download, isDownloading } = useDownloadRecord();

  const handleDownload = () => {
    if (record) {
      download(record.id, record.fileName);
    }
  };

  if (isLoading) {
    return <RecordDetailSkeleton />;
  }

  if (isError || !record) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">Record Access Denied or Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error?.message ||
              'This medical record could not be found or you do not have permission to view it under ABDM privacy policies.'}
          </p>
        </div>
        <Link href="/patient/records">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Health Records
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <RecordDetails record={record} onDownload={handleDownload} isDownloading={isDownloading} />
  );
}

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RecordDetails, RecordDetailSkeleton } from '@/components/patient/records';
import { ErrorState } from '@/components/ui/error-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useRecordDetails,
  useDownloadRecord,
  useArchiveRecord,
} from '@/features/records/hooks/use-records';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';

export default function PatientRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { announce } = useLiveAnnouncer();
  const recordId = typeof params.recordId === 'string' ? params.recordId : '';

  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  const { record, isLoading, isError, error, refetch } = useRecordDetails(recordId);
  const { download, isDownloading } = useDownloadRecord();
  const archiveMutation = useArchiveRecord({
    onSuccess: () => {
      announce('Medical document archived.');
      router.push('/patient/records');
    },
  });

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
      <div className="max-w-lg mx-auto py-12">
        <ErrorState
          error={error}
          title="Document Access Denied or Not Found"
          onRetry={() => refetch()}
          backHref="/patient/records"
          backLabel="Return to Medical Documents"
        />
      </div>
    );
  }

  return (
    <>
      <RecordDetails
        record={record}
        onDownload={handleDownload}
        onArchive={() => setConfirmArchiveOpen(true)}
        isDownloading={isDownloading}
        isArchiving={archiveMutation.isPending}
      />

      <ConfirmDialog
        open={confirmArchiveOpen}
        onClose={() => setConfirmArchiveOpen(false)}
        title="Archive Medical Document?"
        description={`"${record.title}" will be archived from your active documents list while preserving the security audit trail.`}
        confirmLabel="Archive Document"
        variant="danger"
        loading={archiveMutation.isPending}
        onConfirm={async () => {
          await archiveMutation.mutateAsync(record.id);
          setConfirmArchiveOpen(false);
        }}
      />
    </>
  );
}

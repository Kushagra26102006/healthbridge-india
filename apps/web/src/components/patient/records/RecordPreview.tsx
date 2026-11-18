'use client';

import React from 'react';
import { SecureDocumentViewer } from '@/components/documents/SecureDocumentViewer';
import type { MedicalRecordDetailDto } from '@healthbridge/shared-types';

export interface RecordPreviewProps {
  record: MedicalRecordDetailDto;
  onDownload: () => void;
  isDownloading?: boolean;
}

/**
 * Inline medical record preview delegating to the Phase 16 SecureDocumentViewer
 * (short-lived HMAC signed link + private blob streaming + zoom/rotate/PDF navigation).
 */
export function RecordPreview({ record, onDownload, isDownloading = false }: RecordPreviewProps) {
  return (
    <SecureDocumentViewer
      record={record}
      onDownload={onDownload}
      isDownloading={isDownloading}
      viewerHeightClass="h-[520px]"
    />
  );
}

export default RecordPreview;

/**
 * HealthBridge India — Laboratory Reports Hook
 * Provides reactive query states, pagination, and mutations for the reporting lifecycle.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { laboratoryReportsApi, ReportFilterParams } from '../api/laboratory-reports-api';
import type {
  LabReportDetailDto,
  LabReportListItemDto,
  LabReportVersionDto,
  GenerateReportDraftDto,
  SubmitReportForReviewDto,
  ReviewReportDto,
  ApproveReportDto,
  PublishReportDto,
  RequestAmendmentDto,
  FHIRDiagnosticReportBundle,
} from '@healthbridge/shared-types';

export function useLaboratoryReports(initialFilters?: ReportFilterParams) {
  const [reports, setReports] = useState<LabReportListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ReportFilterParams>(initialFilters || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await laboratoryReportsApi.listReports({ ...filters, page });
      setReports(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load laboratory reports');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    total,
    page,
    totalPages,
    setPage,
    filters,
    setFilters,
    isLoading,
    error,
    refresh: fetchReports,
  };
}

export function useLaboratoryReportDetail(reportId?: string) {
  const [report, setReport] = useState<LabReportDetailDto | null>(null);
  const [versions, setVersions] = useState<LabReportVersionDto[]>([]);
  const [fhirBundle, setFhirBundle] = useState<FHIRDiagnosticReportBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!reportId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await laboratoryReportsApi.getReportById(reportId);
      setReport(data);
      const versionList = await laboratoryReportsApi.getReportVersions(reportId);
      setVersions(versionList);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load report details');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const loadFhir = async (): Promise<FHIRDiagnosticReportBundle | undefined> => {
    if (!reportId) return undefined;
    try {
      const bundle = await laboratoryReportsApi.getFhirBundle(reportId);
      setFhirBundle(bundle);
      return bundle;
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load FHIR bundle');
      return undefined;
    }
  };

  const generateDraft = async (dto: GenerateReportDraftDto) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await laboratoryReportsApi.generateDraft(dto);
      setReport(result);
      setSuccessMessage('Report draft compiled successfully');
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to generate report draft';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForReview = async (dto: SubmitReportForReviewDto) => {
    if (!reportId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await laboratoryReportsApi.submitForReview(reportId, dto);
      setReport(result);
      setSuccessMessage('Report submitted for medical pathologist review');
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit report for review';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewReport = async (dto: ReviewReportDto) => {
    if (!reportId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await laboratoryReportsApi.reviewReport(reportId, dto);
      setReport(result);
      setSuccessMessage(`Review decision '${dto.decision}' recorded successfully`);
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record review decision';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveReport = async (dto: ApproveReportDto) => {
    if (!reportId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await laboratoryReportsApi.approveReport(reportId, dto);
      setReport(result);
      setSuccessMessage('Report formally approved with digital signature attestation');
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve report';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishReport = async (dto: PublishReportDto) => {
    if (!reportId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await laboratoryReportsApi.publishReport(reportId, dto);
      setReport(result);
      setSuccessMessage('Diagnostic report published and released to patient and physician');
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to publish report';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestAmendment = async (dto: RequestAmendmentDto) => {
    if (!reportId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await laboratoryReportsApi.requestAmendment(reportId, dto);
      setReport(result);
      setSuccessMessage('Amendment initiated. Draft v' + (result.currentVersion || 2) + ' created for review.');
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to initiate report amendment';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPdf = async (version?: number) => {
    if (!reportId) return;
    try {
      const blob = await laboratoryReportsApi.downloadReportPdf(reportId, version);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report?.reportNumber || 'report'}-v${version || report?.currentVersion || 1}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to download report PDF');
    }
  };

  return {
    report,
    versions,
    fhirBundle,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
    refresh: fetchDetail,
    loadFhir,
    generateDraft,
    submitForReview,
    reviewReport,
    approveReport,
    publishReport,
    requestAmendment,
    downloadPdf,
  };
}

import type { ApiErrorDetail, ApiResponse } from '@healthbridge/shared-types';

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly errors?: ApiErrorDetail[];
  public readonly isNetworkError: boolean;
  public readonly retryAfter?: number;
  public readonly responseData?: ApiResponse;

  constructor(params: {
    message: string;
    statusCode?: number;
    code?: string;
    requestId?: string;
    errors?: ApiErrorDetail[];
    isNetworkError?: boolean;
    retryAfter?: number;
    responseData?: ApiResponse;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.statusCode = params.statusCode ?? 500;
    this.code = params.code ?? 'UNKNOWN_ERROR';
    this.requestId = params.requestId;
    this.errors = params.errors;
    this.isNetworkError = params.isNetworkError ?? false;
    this.retryAfter = params.retryAfter;
    this.responseData = params.responseData;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

import { describe, it, expect } from 'vitest';
import { sendSuccess, sendError } from '../../src/utils/api-response';
import { HttpStatus } from '../../src/shared/constants/http-status';
import { ErrorCode } from '../../src/shared/errors/error-codes';

// Mock Express Response
const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    payload: null as any,
    req: { requestId: 'test-req-id-123' },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.payload = data;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    getHeader(name: string) {
      return this.headers[name];
    },
  };
  return res;
};

describe('API Response Helpers Unit Tests', () => {
  it('should format standard success response with default message and status 200', () => {
    const res = createMockResponse();
    const data = { userId: 'usr-1', name: 'Rohan Sharma' };

    sendSuccess(res, data);

    expect(res.statusCode).toBe(HttpStatus.OK);
    expect(res.payload.success).toBe(true);
    expect(res.payload.message).toBe('Request completed');
    expect(res.payload.data).toEqual(data);
    expect(res.payload.requestId).toBe('test-req-id-123');
    expect(res.payload.timestamp).toBeDefined();
  });

  it('should format success response with custom message and metadata', () => {
    const res = createMockResponse();
    const meta = { page: 1, limit: 10, total: 50, totalPages: 5 };

    sendSuccess(res, ['item-1', 'item-2'], 'Items retrieved successfully', HttpStatus.OK, meta);

    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    expect(res.payload.message).toBe('Items retrieved successfully');
    expect(res.payload.meta).toEqual(meta);
  });

  it('should format standard error response with error code and request id', () => {
    const res = createMockResponse();

    sendError(res, 'Invalid credentials provided', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);

    expect(res.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(res.payload.success).toBe(false);
    expect(res.payload.message).toBe('Invalid credentials provided');
    expect(res.payload.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(res.payload.requestId).toBe('test-req-id-123');
    expect(res.payload.timestamp).toBeDefined();
  });

  it('should handle backward-compatible error signature where codeOrErrors is an array', () => {
    const res = createMockResponse();
    const errors = [{ field: 'phone', message: 'Must be 10 digits' }];

    sendError(res, 'Validation error', HttpStatus.BAD_REQUEST, errors);

    expect(res.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(res.payload.success).toBe(false);
    expect(res.payload.errors).toEqual(errors);
    expect(res.payload.code).toBe(ErrorCode.BAD_REQUEST);
  });
});


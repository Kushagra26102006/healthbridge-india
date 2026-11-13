import pino from 'pino';

const SENSITIVE_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-abdm-auth"]',
  'authorization',
  'cookie',
  'password',
  'confirmPassword',
  'newPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'verificationToken',
  'otp',
  'phoneOtp',
  'emailOtp',
  'abhaNumber',
  'abhaAddress',
  'healthId',
  'healthIdNumber',
  'medicalRecords',
  'records',
  'diagnosis',
  'observations',
  'prescriptions',
  'resourceReference',
];

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';

export const pinoInstance = pino({
  level: isDevelopment ? 'debug' : 'info',
  redact: {
    paths: SENSITIVE_REDACT_PATHS,
    censor: '[REDACTED]',
  },
  base: {
    env: nodeEnv,
    service: 'healthbridge-api',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * HealthBridge Unified Logger Interface
 * Supports both standard Pino calls and backwards-compatible (message, payload) signatures
 */
export const logger = {
  info: (message: string, payload?: Record<string, unknown>): void => {
    if (payload) {
      pinoInstance.info(payload, message);
    } else {
      pinoInstance.info(message);
    }
  },

  warn: (message: string, payload?: Record<string, unknown>): void => {
    if (payload) {
      pinoInstance.warn(payload, message);
    } else {
      pinoInstance.warn(message);
    }
  },

  error: (message: string, error?: unknown, payload?: Record<string, unknown>): void => {
    const errorDetails: Record<string, unknown> = { ...(payload || {}) };

    if (error instanceof Error) {
      errorDetails.err = {
        message: error.message,
        name: error.name,
        stack: isDevelopment ? error.stack : undefined,
      };
    } else if (error !== undefined) {
      errorDetails.err = error;
    }

    pinoInstance.error(errorDetails, message);
  },

  debug: (message: string, payload?: Record<string, unknown>): void => {
    if (payload) {
      pinoInstance.debug(payload, message);
    } else {
      pinoInstance.debug(message);
    }
  },

  child: (bindings: Record<string, unknown>) => {
    return pinoInstance.child(bindings);
  },

  raw: pinoInstance,
};

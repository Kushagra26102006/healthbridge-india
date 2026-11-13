/**
 * Structured Logger for HealthBridge India
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  [key: string]: unknown;
}

const formatMessage = (level: LogLevel, message: string, payload?: LogPayload): string => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (payload && Object.keys(payload).length > 0) {
    return `${base} | ${JSON.stringify(payload)}`;
  }
  return base;
};

export const logger = {
  info: (message: string, payload?: LogPayload): void => {
    console.log(formatMessage('info', message, payload));
  },
  warn: (message: string, payload?: LogPayload): void => {
    console.warn(formatMessage('warn', message, payload));
  },
  error: (message: string, error?: unknown, payload?: LogPayload): void => {
    const errorDetails =
      error instanceof Error
        ? { errorMessage: error.message, stack: error.stack, ...payload }
        : { error, ...payload };
    console.error(formatMessage('error', message, errorDetails));
  },
  debug: (message: string, payload?: LogPayload): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, payload));
    }
  },
};


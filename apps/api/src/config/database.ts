import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export type DbStatus = 'connected' | 'disconnected' | 'connecting' | 'uninitialized';

interface ConnectionHealth {
  status: DbStatus;
  latencyMs?: number;
  host?: string;
  name?: string;
}

let isConnecting = false;

// Setup event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  logger.info('MongoDB Atlas connection established successfully', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB Atlas connection error encountered:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB Atlas disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB Atlas reconnected');
});

/**
 * Initializes connection to MongoDB Atlas or local MongoDB instance
 */
export const connectDatabase = async (customUri?: string): Promise<typeof mongoose | null> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (isConnecting) {
    return null;
  }

  isConnecting = true;

  try {
    const mongoUri = customUri || env.MONGODB_URI;

    // Mask credentials for clean logging
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    logger.info(`Connecting to MongoDB at: ${maskedUri}`);

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    isConnecting = false;
    return connection;
  } catch (error) {
    isConnecting = false;
    logger.error('Failed to connect to MongoDB Atlas during initialization:', error);
    // Non-fatal during local bootstrap so health check can report status
    return null;
  }
};

/**
 * Gracefully disconnects from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB Atlas connection closed successfully');
    }
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
  }
};

/**
 * Returns the current database connection health and latency
 */
export const getDatabaseStatus = async (): Promise<ConnectionHealth> => {
  const readyState = mongoose.connection.readyState;

  const statusMap: Record<number, DbStatus> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected',
  };

  const status = statusMap[readyState] ?? 'uninitialized';

  if (status === 'connected' && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const latencyMs = Date.now() - start;

      return {
        status: 'connected',
        latencyMs,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      };
    } catch {
      return { status: 'disconnected' };
    }
  }

  return { status };
};


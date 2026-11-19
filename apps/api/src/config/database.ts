import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export type DbStatus = 'connected' | 'disconnected' | 'connecting' | 'uninitialized';

export interface ConnectionHealth {
  status: DbStatus;
  latencyMs?: number;
  host?: string;
  name?: string;
}

let isConnecting = false;
let reconnectTimer: NodeJS.Timeout | null = null;

function scheduleReconnect(customUri?: string): void {
  if (env.NODE_ENV === 'test' || reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (mongoose.connection.readyState === 0) {
      logger.info('Retrying MongoDB connection in background...');
      void connectDatabase(customUri);
    }
  }, 10000);
  reconnectTimer.unref();
}

// In production, disable automatic index builds to prevent performance degradation or index locks
if (env.NODE_ENV === 'production') {
  mongoose.set('autoIndex', false);
} else {
  mongoose.set('autoIndex', true);
}

// Setup event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established successfully', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error encountered:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
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

    // Enforce TLS & strict certificate validation in production (never allow TLS bypass)
    if (env.NODE_ENV === 'production') {
      const lowered = mongoUri.toLowerCase();
      if (
        lowered.includes('tls=false') ||
        lowered.includes('ssl=false') ||
        lowered.includes('tlsallowinvalidcertificates=true') ||
        lowered.includes('tlsallowinvalidhostnames=true')
      ) {
        throw new Error(
          'Security policy violation: Production MongoDB connections must enforce TLS with valid certificates.'
        );
      }
    }

    // Mask credentials for clean logging
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    logger.info(`Connecting to MongoDB at: ${maskedUri}`);

    // Ensure database name defaults to 'healthbridge' if not specified or defaulting to 'test'
    const urlWithoutQuery = mongoUri.split('?')[0] || '';
    const pathPart = urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf('/') + 1);
    const resolvedDbName =
      env.NODE_ENV === 'test' || (pathPart && pathPart !== '' && pathPart !== 'test')
        ? undefined
        : 'healthbridge';

    const connection = await mongoose.connect(mongoUri, {
      dbName: resolvedDbName,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      maxPoolSize: env.DB_MAX_POOL_SIZE ?? 20,
      minPoolSize: env.DB_MIN_POOL_SIZE ?? 5,
    });

    isConnecting = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    return connection;
  } catch (error) {
    isConnecting = false;
    logger.error('Failed to connect to MongoDB during initialization:', error);
    // Automatically retry connecting in background when DB comes online or Atlas IP is whitelisted
    scheduleReconnect(customUri);
    return null;
  }
};

/**
 * Explicitly synchronizes indexes in non-production environments or controlled migrations
 */
export const syncDatabaseIndexes = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Cannot sync indexes: Database not connected');
    return;
  }

  try {
    logger.info('Starting database index synchronization...');
    await mongoose.syncIndexes();
    logger.info('Database index synchronization completed successfully');
  } catch (error) {
    logger.error('Failed to sync database indexes:', error);
    throw error;
  }
};

/**
 * Gracefully disconnects from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed successfully');
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

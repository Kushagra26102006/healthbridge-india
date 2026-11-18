/**
 * HealthBridge India — Centralized Key Management & Authenticated Field Encryption (Day 9 Task 03)
 *
 * Security guarantees:
 *   - Uses Node.js native AES-256-GCM (authenticated encryption — NEVER custom crypto)
 *   - Unique 12-byte cryptographic random IV for every encryption call
 *   - Versioned ciphertext envelope: { version, algorithm, keyId, iv, ciphertext, authTag }
 *   - Strict authentication tag verification — NO plaintext fallback on failure
 *   - Supports historical key versions for zero-downtime key rotation
 *   - Blocks retiring any key version still referenced by active records or backups
 *   - Clearly separates local development key provider from cloud KMS boundaries
 *     (AWS_KMS / GCP_KMS / AZURE_KEY_VAULT fail closed unless provisioned)
 */

import crypto from 'crypto';
import { AppError } from '../../shared/errors/app-error';
import { securityAuditMonitor } from '../security-audit.monitor';

export const ENCRYPTION_ENVELOPE_VERSION = 1;
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm' as const;

export type KeyProviderKind =
  | 'DEVELOPMENT_LOCAL_ONLY'
  | 'AWS_KMS'
  | 'GCP_KMS'
  | 'AZURE_KEY_VAULT';

export type KeyVersionStatus = 'ACTIVE' | 'HISTORICAL_DECRYPT_ONLY' | 'RETIRED';

export interface EncryptedEnvelope {
  version: number;
  algorithm: typeof ENCRYPTION_ALGORITHM;
  keyId: string;
  iv: string; // Base64 (12 bytes)
  ciphertext: string; // Base64
  authTag: string; // Base64 (16 bytes)
}

export interface KeyVersionMetadata {
  keyId: string;
  version: number;
  status: KeyVersionStatus;
  createdAt: string;
  rotatedAt?: string;
  retiredAt?: string;
  provider: KeyProviderKind;
}

export interface DataProtectionIncident {
  id: string;
  type:
    | 'DECRYPTION_FAILED'
    | 'INVALID_AUTH_TAG'
    | 'UNKNOWN_KEY_ID'
    | 'INTEGRITY_MISMATCH'
    | 'UNAUTHORIZED_DOCUMENT_ACCESS'
    | 'MALWARE_SCAN_ALERT'
    | 'KEY_ROTATION_EVENT'
    | 'RESTORE_FAILURE';
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface KeyProviderAdapter {
  readonly providerKind: KeyProviderKind;
  readonly isProductionSafe: boolean;
  getActiveKey(): { keyId: string; version: number; keyMaterial: Buffer };
  getKeyById(keyId: string): { keyId: string; version: number; status: KeyVersionStatus; keyMaterial: Buffer } | null;
  rotateKey(reason?: string): KeyVersionMetadata;
  retireKey(keyId: string, verifiedZeroReferences: boolean): KeyVersionMetadata;
  listKeyMetadata(): KeyVersionMetadata[];
}

/**
 * Clearly labelled DEVELOPMENT-ONLY local in-memory/env key provider.
 * Must NEVER be used as the production key management solution.
 */
export class DevelopmentLocalKeyProvider implements KeyProviderAdapter {
  readonly providerKind: KeyProviderKind = 'DEVELOPMENT_LOCAL_ONLY';
  readonly isProductionSafe = false;

  private readonly keys = new Map<
    string,
    { keyId: string; version: number; status: KeyVersionStatus; keyMaterial: Buffer; createdAt: string; rotatedAt?: string; retiredAt?: string }
  >();
  private activeKeyId: string;
  private latestVersion = 1;

  constructor(seedKeyHex?: string) {
    const initialKeyId = 'hb-dev-kms-v1';
    const keyMaterial =
      seedKeyHex && /^[0-9a-fA-F]{64}$/.test(seedKeyHex)
        ? Buffer.from(seedKeyHex, 'hex')
        : crypto
            .createHash('sha256')
            .update(
              `hb-dev-local-kms-v1:${process.env.ABDM_IDENTIFIER_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || 'dev-local-seed'}`
            )
            .digest();

    this.keys.set(initialKeyId, {
      keyId: initialKeyId,
      version: 1,
      status: 'ACTIVE',
      keyMaterial,
      createdAt: new Date().toISOString(),
    });
    this.activeKeyId = initialKeyId;
  }

  getActiveKey() {
    const active = this.keys.get(this.activeKeyId);
    if (!active || active.status !== 'ACTIVE') {
      throw new AppError('Active encryption key is unavailable.', 500);
    }
    return { keyId: active.keyId, version: active.version, keyMaterial: active.keyMaterial };
  }

  getKeyById(keyId: string) {
    const entry = this.keys.get(keyId);
    if (!entry) return null;
    return {
      keyId: entry.keyId,
      version: entry.version,
      status: entry.status,
      keyMaterial: entry.keyMaterial,
    };
  }

  rotateKey(): KeyVersionMetadata {
    const now = new Date().toISOString();
    const prev = this.keys.get(this.activeKeyId);
    if (prev) {
      prev.status = 'HISTORICAL_DECRYPT_ONLY';
      prev.rotatedAt = now;
    }

    this.latestVersion += 1;
    const nextKeyId = `hb-dev-kms-v${this.latestVersion}`;
    const nextMaterial = crypto.randomBytes(32);

    this.keys.set(nextKeyId, {
      keyId: nextKeyId,
      version: this.latestVersion,
      status: 'ACTIVE',
      keyMaterial: nextMaterial,
      createdAt: now,
    });
    this.activeKeyId = nextKeyId;

    return {
      keyId: nextKeyId,
      version: this.latestVersion,
      status: 'ACTIVE',
      createdAt: now,
      provider: this.providerKind,
    };
  }

  retireKey(keyId: string, verifiedZeroReferences: boolean): KeyVersionMetadata {
    const entry = this.keys.get(keyId);
    if (!entry) {
      throw AppError.notFound(`Unknown key identifier '${keyId}'.`);
    }
    if (entry.status === 'ACTIVE') {
      throw AppError.badRequest('Cannot retire the currently active encryption key. Rotate first.');
    }
    if (!verifiedZeroReferences) {
      throw AppError.badRequest(
        `Cannot retire key '${keyId}' until zero active records and backup dependencies are explicitly verified.`
      );
    }
    entry.status = 'RETIRED';
    entry.retiredAt = new Date().toISOString();

    return {
      keyId: entry.keyId,
      version: entry.version,
      status: entry.status,
      createdAt: entry.createdAt,
      rotatedAt: entry.rotatedAt,
      retiredAt: entry.retiredAt,
      provider: this.providerKind,
    };
  }

  listKeyMetadata(): KeyVersionMetadata[] {
    // NEVER exposes keyMaterial
    return Array.from(this.keys.values()).map((k) => ({
      keyId: k.keyId,
      version: k.version,
      status: k.status,
      createdAt: k.createdAt,
      rotatedAt: k.rotatedAt,
      retiredAt: k.retiredAt,
      provider: this.providerKind,
    }));
  }
}

/**
 * Unconfigured managed cloud KMS boundary — fails closed until real cloud SDK/KMS credentials
 * are provisioned in the deployment environment.
 */
export class UnconfiguredCloudKmsAdapter implements KeyProviderAdapter {
  readonly isProductionSafe = true;

  constructor(public readonly providerKind: Exclude<KeyProviderKind, 'DEVELOPMENT_LOCAL_ONLY'>) {}

  private failClosed(): never {
    throw new AppError(
      `Managed KMS provider '${this.providerKind}' is selected but not configured with runtime credentials.`,
      503
    );
  }

  getActiveKey() {
    return this.failClosed();
  }
  getKeyById() {
    return this.failClosed();
  }
  rotateKey() {
    return this.failClosed();
  }
  retireKey() {
    return this.failClosed();
  }
  listKeyMetadata(): KeyVersionMetadata[] {
    return [];
  }
}

export class KeyManagementService {
  private readonly incidents: DataProtectionIncident[] = [];

  constructor(
    private provider: KeyProviderAdapter = new DevelopmentLocalKeyProvider()
  ) {}

  setProvider(provider: KeyProviderAdapter): void {
    this.provider = provider;
  }

  getProviderSummary() {
    const active = this.provider.listKeyMetadata().find((k) => k.status === 'ACTIVE');
    return {
      providerKind: this.provider.providerKind,
      isProductionSafe: this.provider.isProductionSafe,
      activeKeyId: active?.keyId || null,
      activeKeyVersion: active?.version || null,
      totalKeyVersions: this.provider.listKeyMetadata().length,
      keys: this.provider.listKeyMetadata(),
    };
  }

  getActiveKeyVersion(): { keyId: string; version: number } {
    const active = this.provider.getActiveKey();
    return { keyId: active.keyId, version: active.version };
  }

  getRecentIncidents(limit = 25): DataProtectionIncident[] {
    return this.incidents.slice(0, limit);
  }

  recordIncident(
    incident: Omit<DataProtectionIncident, 'id' | 'timestamp'>,
    actor?: { actorId?: string; actorRole?: 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'SYSTEM' }
  ): void {
    const entry: DataProtectionIncident = {
      id: `dpinc_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      ...incident,
    };
    this.incidents.unshift(entry);
    if (this.incidents.length > 100) {
      this.incidents.length = 100;
    }

    void securityAuditMonitor.record({
      actorId: actor?.actorId,
      actorRole: actor?.actorRole || 'SYSTEM',
      action: incident.type,
      resourceType: 'DATA_PROTECTION',
      resourceId: entry.id,
      outcome: incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'BLOCKED' : 'SUCCESS',
      metadata: {
        severity: incident.severity,
        ...(incident.metadata || {}),
      },
    });
  }

  /**
   * Encrypts UTF-8 plaintext or raw Buffer using AES-256-GCM with a fresh 12-byte random IV.
   * Optional AAD (Additional Authenticated Data) cryptographically binds ciphertext to record context.
   */
  encrypt(plaintext: string | Buffer, aad?: string): EncryptedEnvelope {
    const active = this.provider.getActiveKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, active.keyMaterial, iv);

    if (aad) {
      cipher.setAAD(Buffer.from(aad, 'utf-8'));
    }

    const inputBuf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf-8');
    const encrypted = Buffer.concat([cipher.update(inputBuf), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      version: ENCRYPTION_ENVELOPE_VERSION,
      algorithm: ENCRYPTION_ALGORITHM,
      keyId: active.keyId,
      iv: iv.toString('base64'),
      ciphertext: encrypted.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  /**
   * Decrypts a versioned AES-256-GCM envelope. Supports ACTIVE and HISTORICAL_DECRYPT_ONLY keys.
   * Strictly rejects corrupted ciphertext, invalid authTag, wrong AAD, or missing/retired keys.
   * NEVER falls back to plaintext.
   */
  decryptToBuffer(envelope: EncryptedEnvelope, aad?: string): Buffer {
    if (
      !envelope ||
      envelope.version !== ENCRYPTION_ENVELOPE_VERSION ||
      envelope.algorithm !== ENCRYPTION_ALGORITHM ||
      !envelope.keyId ||
      !envelope.iv ||
      !envelope.ciphertext ||
      !envelope.authTag
    ) {
      this.recordIncident({
        type: 'DECRYPTION_FAILED',
        severity: 'HIGH',
        message: 'Malformed encrypted envelope rejected.',
      });
      throw AppError.badRequest('Invalid encrypted data envelope.');
    }

    const keyEntry = this.provider.getKeyById(envelope.keyId);
    if (!keyEntry) {
      this.recordIncident({
        type: 'UNKNOWN_KEY_ID',
        severity: 'CRITICAL',
        message: `Decryption attempted with unknown keyId '${envelope.keyId}'.`,
        metadata: { keyId: envelope.keyId },
      });
      throw new AppError(`Encryption key '${envelope.keyId}' not found.`, 500);
    }

    if (keyEntry.status === 'RETIRED') {
      this.recordIncident({
        type: 'DECRYPTION_FAILED',
        severity: 'HIGH',
        message: `Decryption attempted using retired keyId '${envelope.keyId}'.`,
        metadata: { keyId: envelope.keyId },
      });
      throw new AppError(`Encryption key '${envelope.keyId}' has been retired.`, 500);
    }

    try {
      const iv = Buffer.from(envelope.iv, 'base64');
      const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
      const authTag = Buffer.from(envelope.authTag, 'base64');

      if (iv.length !== 12 || authTag.length !== 16) {
        throw new Error('Invalid IV or authentication tag length');
      }

      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyEntry.keyMaterial, iv);
      decipher.setAuthTag(authTag);
      if (aad) {
        decipher.setAAD(Buffer.from(aad, 'utf-8'));
      }

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      this.recordIncident({
        type: 'INVALID_AUTH_TAG',
        severity: 'CRITICAL',
        message: 'Authenticated decryption failed (invalid auth tag, wrong key, or tampered ciphertext).',
        metadata: { keyId: envelope.keyId },
      });
      throw new AppError('Decryption failed: integrity or key authentication check failed.', 500);
    }
  }

  decrypt(envelope: EncryptedEnvelope, aad?: string): string {
    return this.decryptToBuffer(envelope, aad).toString('utf-8');
  }

  rotateKey(actorId?: string): KeyVersionMetadata {
    const created = this.provider.rotateKey();
    this.recordIncident(
      {
        type: 'KEY_ROTATION_EVENT',
        severity: 'MEDIUM',
        message: `Encryption key rotated to active version '${created.keyId}' (v${created.version}).`,
        metadata: { newKeyId: created.keyId, version: created.version },
      },
      { actorId, actorRole: actorId ? 'ADMIN' : 'SYSTEM' }
    );
    return created;
  }

  reEncrypt(envelope: EncryptedEnvelope, aad?: string): { envelope: EncryptedEnvelope; rotated: boolean } {
    const active = this.provider.getActiveKey();
    if (envelope.keyId === active.keyId) {
      return { envelope, rotated: false };
    }
    const plaintextBuf = this.decryptToBuffer(envelope, aad);
    const refreshed = this.encrypt(plaintextBuf, aad);
    return { envelope: refreshed, rotated: true };
  }

  retireKeySafely(keyId: string, verifiedZeroReferences: boolean, actorId?: string): KeyVersionMetadata {
    const retired = this.provider.retireKey(keyId, verifiedZeroReferences);
    this.recordIncident(
      {
        type: 'KEY_ROTATION_EVENT',
        severity: 'MEDIUM',
        message: `Historical encryption key '${keyId}' retired after zero-reference verification.`,
        metadata: { retiredKeyId: keyId },
      },
      { actorId, actorRole: actorId ? 'ADMIN' : 'SYSTEM' }
    );
    return retired;
  }
}

export const keyManagementService = new KeyManagementService();
export default keyManagementService;

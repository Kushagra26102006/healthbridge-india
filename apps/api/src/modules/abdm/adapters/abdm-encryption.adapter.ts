/**
 * HealthBridge India — ABDM Secure Data Encryption & Key Exchange Adapter (Day 7 Task 04)
 *
 * Implements the official ABDM Fidelius protocol architecture:
 *   - Ephemeral ECDH key agreement + 32-byte random nonce per session (Perfect Forward Secrecy)
 *   - Dual-nonce XOR mixing: first 20 bytes = HKDF-SHA-256 salt, last 12 bytes = AES-256-GCM IV
 *   - HKDF-SHA-256 (empty info, 32-byte symmetric key)
 *   - AES-256-GCM (`AES/GCM/NoPadding`, 16-byte authentication tag appended to ciphertext, Base64)
 *
 * IMPORTANT INTEROPERABILITY & HONESTY DISCLOSURE:
 * Official ABDM Sandbox & Production Fidelius nodes use BouncyCastle's **short-Weierstrass
 * Curve25519** parameters rather than standard RFC 7748 Montgomery X25519. Node.js native
 * `crypto` provides Montgomery X25519 only. Therefore:
 *   - In `development` / automated test mode, `MockLocalX25519FideliusProvider` performs genuine
 *     local X25519 + HKDF-SHA256 + AES-256-GCM round-trip encryption while explicitly declaring
 *     `providerMode: 'MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS'` and
 *     `liveFideliusConfigured: false`.
 *   - In `sandbox` or `production` mode, live encryption FAILS CLOSED (`ABDM_ENCRYPTION_NOT_CONFIGURED`)
 *     until an official Java Fidelius CLI/sidecar or verified short-Weierstrass Curve25519 KMS
 *     provider is configured.
 *
 * SECURITY INVARIANTS:
 *   1. No private key is ever hardcoded, persisted to MongoDB, logged, or returned to frontend.
 *   2. Ephemeral private keys exist only in server memory with a strict 15-minute TTL and are
 *      explicitly purged after decryption or expiry.
 *   3. Unencrypted transfers are rejected whenever `requireEncryption !== false`.
 */

import crypto from 'crypto';
import type {
  AbdmEncryptionProviderMode,
  AbdmEncryptionReadinessDto,
  AbdmFideliusKeyMaterialDto,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from '../services/abdm-configuration.service';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface EphemeralKeyPairHandle {
  sessionId: string;
  keyMaterial: AbdmFideliusKeyMaterialDto;
  expiresAt: string;
}

export interface EncryptedHealthPayload {
  ciphertextBase64: string;
  ciphertextSha256: string;
  senderKeyMaterial: AbdmFideliusKeyMaterialDto;
  providerMode: AbdmEncryptionProviderMode;
  isMocked: boolean;
}

export interface DecryptedHealthPayload {
  plaintext: string;
  plaintextSha256: string;
  providerMode: AbdmEncryptionProviderMode;
  isMocked: boolean;
}

export interface IAbdmEncryptionProvider {
  readonly providerMode: AbdmEncryptionProviderMode;
  readonly liveFideliusConfigured: boolean;
  generateEphemeralKeyMaterial(sessionId: string): EphemeralKeyPairHandle;
  encryptForPeer(
    plaintext: string,
    peerKeyMaterial: AbdmFideliusKeyMaterialDto,
    sessionId?: string
  ): EncryptedHealthPayload;
  decryptFromPeer(
    ciphertextBase64: string,
    peerKeyMaterial: AbdmFideliusKeyMaterialDto,
    sessionId: string
  ): DecryptedHealthPayload;
  purgeSessionKey(sessionId: string): void;
  getActiveSessionCount(): number;
}

interface StoredEphemeralKey {
  privateKey: crypto.KeyObject;
  nonce: Buffer;
  expiresAtMs: number;
}

/**
 * Computes HKDF-SHA-256 derived 32-byte AES key and 12-byte GCM IV using the exact
 * ABDM Fidelius dual-nonce XOR split (first 20 bytes = HKDF salt, last 12 bytes = GCM IV).
 */
function deriveFideliusKeyAndIv(
  sharedSecret: Buffer,
  senderNonceBase64: string,
  requesterNonceBase64: string
): { symmetricKey: Buffer; iv: Buffer } {
  const senderNonce = Buffer.from(senderNonceBase64, 'base64');
  const requesterNonce = Buffer.from(requesterNonceBase64, 'base64');

  if (senderNonce.length !== 32 || requesterNonce.length !== 32) {
    throw new AbdmIntegrationError({
      message: 'Fidelius key material requires 32-byte Base64-encoded nonces from both peers.',
      abdmCode: 'ABDM_VALIDATION_ERROR',
      statusCode: 422,
    });
  }

  const xored = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    xored[i] = senderNonce[i]! ^ requesterNonce[i]!;
  }

  const salt = xored.subarray(0, 20);
  const iv = xored.subarray(20, 32);

  const derived = crypto.hkdfSync('sha256', sharedSecret, salt, Buffer.alloc(0), 32);
  return {
    symmetricKey: Buffer.from(derived),
    iv,
  };
}

/**
 * Local Mock/Development Fidelius-shaped provider using Node.js X25519 + HKDF-SHA256 + AES-256-GCM.
 * Explicitly NOT compatible with BouncyCastle short-Weierstrass Curve25519 live ABDM nodes.
 */
export class MockLocalX25519FideliusProvider implements IAbdmEncryptionProvider {
  public readonly providerMode: AbdmEncryptionProviderMode =
    'MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS';
  public readonly liveFideliusConfigured = false;
  private readonly keyTtlMs = 15 * 60 * 1000; // 15 minutes
  private readonly ephemeralStore = new Map<string, StoredEphemeralKey>();

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.ephemeralStore.entries()) {
      if (entry.expiresAtMs <= now) {
        entry.nonce.fill(0);
        this.ephemeralStore.delete(id);
      }
    }
  }

  generateEphemeralKeyMaterial(sessionId: string): EphemeralKeyPairHandle {
    this.cleanupExpired();
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
    const nonce = crypto.randomBytes(32);
    const expiresAtMs = Date.now() + this.keyTtlMs;
    const expiry = new Date(expiresAtMs).toISOString();

    this.ephemeralStore.set(sessionId, {
      privateKey,
      nonce,
      expiresAtMs,
    });

    const pubDerBase64 = (publicKey.export({ type: 'spki', format: 'der' }) as Buffer).toString(
      'base64'
    );

    return {
      sessionId,
      expiresAt: expiry,
      keyMaterial: {
        cryptoAlg: 'ECDH',
        curve: 'Curve25519',
        dhPublicKey: {
          expiry,
          parameters: 'Curve25519/32byte random key',
          keyValue: pubDerBase64,
        },
        nonce: nonce.toString('base64'),
      },
    };
  }

  encryptForPeer(
    plaintext: string,
    peerKeyMaterial: AbdmFideliusKeyMaterialDto,
    sessionId?: string
  ): EncryptedHealthPayload {
    this.cleanupExpired();
    const ephemeralId = sessionId || `hip-enc-${crypto.randomUUID()}`;
    const local = this.generateEphemeralKeyMaterial(ephemeralId);
    const stored = this.ephemeralStore.get(ephemeralId)!;

    try {
      const peerPubKey = crypto.createPublicKey({
        key: Buffer.from(peerKeyMaterial.dhPublicKey.keyValue, 'base64'),
        format: 'der',
        type: 'spki',
      });

      const sharedSecret = crypto.diffieHellman({
        privateKey: stored.privateKey,
        publicKey: peerPubKey,
      });

      const { symmetricKey, iv } = deriveFideliusKeyAndIv(
        sharedSecret,
        local.keyMaterial.nonce,
        peerKeyMaterial.nonce
      );

      const cipher = crypto.createCipheriv('aes-256-gcm', symmetricKey, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      // Fidelius appends the 16-byte GCM tag directly to the ciphertext before Base64 encoding
      const combined = Buffer.concat([encrypted, authTag]);
      const ciphertextBase64 = combined.toString('base64');

      // Zero sensitive buffers immediately
      sharedSecret.fill(0);
      symmetricKey.fill(0);

      return {
        ciphertextBase64,
        ciphertextSha256: crypto.createHash('sha256').update(ciphertextBase64).digest('hex'),
        senderKeyMaterial: local.keyMaterial,
        providerMode: this.providerMode,
        isMocked: true,
      };
    } catch (err) {
      if (err instanceof AbdmIntegrationError) throw err;
      throw new AbdmIntegrationError({
        message: 'Failed to encrypt health information payload with peer key material.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 422,
      });
    } finally {
      // HIP ephemeral private key is single-use and purged immediately after encryption
      this.purgeSessionKey(ephemeralId);
    }
  }

  decryptFromPeer(
    ciphertextBase64: string,
    peerKeyMaterial: AbdmFideliusKeyMaterialDto,
    sessionId: string
  ): DecryptedHealthPayload {
    this.cleanupExpired();
    const stored = this.ephemeralStore.get(sessionId);
    if (!stored) {
      throw new AbdmIntegrationError({
        message: 'Ephemeral decryption key for this transaction is missing or expired.',
        abdmCode: 'ABDM_SESSION_EXPIRED',
        statusCode: 410,
      });
    }

    try {
      const peerPubKey = crypto.createPublicKey({
        key: Buffer.from(peerKeyMaterial.dhPublicKey.keyValue, 'base64'),
        format: 'der',
        type: 'spki',
      });

      const sharedSecret = crypto.diffieHellman({
        privateKey: stored.privateKey,
        publicKey: peerPubKey,
      });

      const { symmetricKey, iv } = deriveFideliusKeyAndIv(
        sharedSecret,
        peerKeyMaterial.nonce,
        stored.nonce.toString('base64')
      );

      const combined = Buffer.from(ciphertextBase64, 'base64');
      if (combined.length < 17) {
        throw new AbdmIntegrationError({
          message: 'Encrypted payload is malformed or truncated.',
          abdmCode: 'ABDM_VALIDATION_ERROR',
          statusCode: 422,
        });
      }

      const authTag = combined.subarray(combined.length - 16);
      const ciphertext = combined.subarray(0, combined.length - 16);

      const decipher = crypto.createDecipheriv('aes-256-gcm', symmetricKey, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const plaintext = decrypted.toString('utf8');

      sharedSecret.fill(0);
      symmetricKey.fill(0);

      return {
        plaintext,
        plaintextSha256: crypto.createHash('sha256').update(plaintext).digest('hex'),
        providerMode: this.providerMode,
        isMocked: true,
      };
    } catch (err) {
      if (err instanceof AbdmIntegrationError) throw err;
      throw new AbdmIntegrationError({
        message: 'Encrypted health information payload failed cryptographic decryption/integrity verification.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 422,
      });
    }
  }

  purgeSessionKey(sessionId: string): void {
    const entry = this.ephemeralStore.get(sessionId);
    if (entry) {
      entry.nonce.fill(0);
      this.ephemeralStore.delete(sessionId);
    }
  }

  getActiveSessionCount(): number {
    this.cleanupExpired();
    return this.ephemeralStore.size;
  }
}

export class AbdmEncryptionAdapter {
  private readonly mockProvider = new MockLocalX25519FideliusProvider();
  private customLiveProvider: IAbdmEncryptionProvider | null = null;

  /**
   * Allows injecting a verified live BouncyCastle short-Weierstrass Curve25519 Fidelius provider
   * once official sandbox/production sidecar or KMS integration is provisioned.
   */
  registerLiveProvider(provider: IAbdmEncryptionProvider): void {
    this.customLiveProvider = provider;
  }

  getReadiness(envSource: NodeJS.ProcessEnv = process.env): AbdmEncryptionReadinessDto {
    const config = abdmConfigurationService.loadConfig(envSource);
    if (this.customLiveProvider?.liveFideliusConfigured) {
      return {
        providerMode: this.customLiveProvider.providerMode,
        liveFideliusConfigured: true,
        algorithmSpec: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM',
        activeEphemeralKeysCount: this.customLiveProvider.getActiveSessionCount(),
        note: 'Verified live Fidelius encryption provider registered.',
      };
    }

    if (config.environment === 'development') {
      return {
        providerMode: this.mockProvider.providerMode,
        liveFideliusConfigured: false,
        algorithmSpec: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM',
        activeEphemeralKeysCount: this.mockProvider.getActiveSessionCount(),
        note: 'Development mock adapter active (local X25519 + HKDF-SHA256 + AES-256-GCM). Official ABDM BouncyCastle short-Weierstrass Curve25519 Fidelius provider is NOT configured for live sandbox/production.',
      };
    }

    return {
      providerMode: 'NOT_CONFIGURED',
      liveFideliusConfigured: false,
      algorithmSpec: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM',
      activeEphemeralKeysCount: 0,
      note: 'Live Fidelius encryption provider is NOT configured. Sandbox and production encrypted transfers remain blocked until an official short-Weierstrass Curve25519 Fidelius sidecar/KMS is attached.',
    };
  }

  private resolveProvider(envSource: NodeJS.ProcessEnv = process.env): IAbdmEncryptionProvider {
    const config = abdmConfigurationService.loadConfig(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM encryption operations are blocked while ABDM integration is disabled.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }

    if (config.environment === 'production' && !config.allowProduction) {
      throw new AbdmIntegrationError({
        message: 'ABDM production mode is locked (ABDM_ALLOW_PRODUCTION=false).',
        abdmCode: 'ABDM_PRODUCTION_LOCKED',
        statusCode: 403,
      });
    }

    if (this.customLiveProvider?.liveFideliusConfigured) {
      return this.customLiveProvider;
    }

    if (config.environment === 'development') {
      return this.mockProvider;
    }

    throw new AbdmIntegrationError({
      message:
        'Live ABDM Fidelius (short-Weierstrass Curve25519) encryption provider is not configured for sandbox/production transfers.',
      abdmCode: 'ABDM_ENCRYPTION_NOT_CONFIGURED',
      statusCode: 503,
    });
  }

  generateEphemeralKeyMaterial(
    sessionId: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): EphemeralKeyPairHandle {
    return this.resolveProvider(envSource).generateEphemeralKeyMaterial(sessionId);
  }

  encryptBundleForPeer(
    bundleJson: string,
    peerKeyMaterial: AbdmFideliusKeyMaterialDto,
    sessionId?: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): EncryptedHealthPayload {
    return this.resolveProvider(envSource).encryptForPeer(bundleJson, peerKeyMaterial, sessionId);
  }

  decryptBundleFromPeer(
    ciphertextBase64: string,
    peerKeyMaterial: AbdmFideliusKeyMaterialDto,
    sessionId: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): DecryptedHealthPayload {
    return this.resolveProvider(envSource).decryptFromPeer(
      ciphertextBase64,
      peerKeyMaterial,
      sessionId
    );
  }

  purgeSessionKey(sessionId: string): void {
    this.mockProvider.purgeSessionKey(sessionId);
    this.customLiveProvider?.purgeSessionKey(sessionId);
  }
}

export const abdmEncryptionAdapter = new AbdmEncryptionAdapter();

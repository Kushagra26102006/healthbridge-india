/**
 * HealthBridge India — ABHA Cryptography & Secure Storage Utilities (Day 7 Task 02)
 *
 * 1. Official ABDM ABHA V3 Field Encryption:
 *    RSA/ECB/OAEPWithSHA-1AndMGF1Padding (SHA-1 digest & MGF1) -> Base64 ciphertext.
 *    Used to encrypt Aadhaar numbers, ABHA numbers, ABHA addresses, mobile numbers, and OTP values
 *    using the public certificate fetched from `GET /v3/profile/public/certificate`.
 *
 * 2. At-Rest Identifier Storage Security:
 *    - AES-256-GCM authenticated encryption for storing verified ABHA numbers at rest.
 *    - Deterministic HMAC-SHA256 blind index for duplicate/cross-patient link prevention
 *      without storing plaintext ABHA numbers in queryable indexes.
 */

import crypto from 'crypto';
import { AbdmIntegrationError } from '../errors/abdm-error';
import { normalizeAbhaNumber } from './redaction';

const DEV_FALLBACK_STORAGE_SEED = 'hb_dev_only_abha_storage_key_do_not_use_in_prod_2026';

function deriveAesKey(source: NodeJS.ProcessEnv = process.env): Buffer {
  const configured = source.ABDM_IDENTIFIER_ENCRYPTION_KEY?.trim();
  const isProdOrSandbox =
    source.ABDM_ENVIRONMENT === 'production' || source.ABDM_ENVIRONMENT === 'sandbox';

  if (configured && !configured.toLowerCase().startsWith('your_')) {
    if (/^[0-9a-fA-F]{64}$/.test(configured)) {
      return Buffer.from(configured, 'hex');
    }
    return crypto.createHash('sha256').update(configured).digest();
  }

  if (isProdOrSandbox && source.ABDM_ENABLED === 'true') {
    throw new AbdmIntegrationError({
      message:
        'ABDM_IDENTIFIER_ENCRYPTION_KEY must be configured with a strong secret in sandbox/production.',
      abdmCode: 'ABDM_NOT_CONFIGURED',
      statusCode: 503,
    });
  }

  // Deterministic development/test key derived from JWT secret or dev seed
  const seed = source.JWT_ACCESS_SECRET || DEV_FALLBACK_STORAGE_SEED;
  return crypto.createHash('sha256').update(`abha-aes:${seed}`).digest();
}

function deriveHmacKey(source: NodeJS.ProcessEnv = process.env): Buffer {
  const aesKey = deriveAesKey(source);
  return crypto.createHash('sha256').update(Buffer.concat([aesKey, Buffer.from(':hmac-index')])).digest();
}

/**
 * Formats a raw Base64 DER SPKI public key (as returned by ABHA V3 `/v3/profile/public/certificate`)
 * or existing PEM string into valid PEM format.
 */
export function formatPublicKeyPem(publicKeyOrPem: string): string {
  const trimmed = publicKeyOrPem.trim();
  if (trimmed.includes('BEGIN PUBLIC KEY') || trimmed.includes('BEGIN CERTIFICATE')) {
    return trimmed;
  }
  const clean = trimmed.replace(/\s+/g, '');
  const lines = clean.match(/.{1,64}/g)?.join('\n') || clean;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

/**
 * Encrypts a sensitive field per ABDM ABHA V3 spec (`RSA/ECB/OAEPWithSHA-1AndMGF1Padding`).
 * Returns Base64 ciphertext. Never logs plaintext.
 */
export function encryptAbhaV3Field(plaintext: string, publicKeyOrPem: string): string {
  try {
    const pem = formatPublicKeyPem(publicKeyOrPem);
    const encrypted = crypto.publicEncrypt(
      {
        key: pem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1', // Mandatory per official ABDM ABHA V3 spec
      },
      Buffer.from(plaintext, 'utf8')
    );
    return encrypted.toString('base64');
  } catch (err: any) {
    throw new AbdmIntegrationError({
      message: `Failed to RSA-OAEP encrypt sensitive ABHA payload: ${err?.message || 'invalid certificate'}`,
      abdmCode: 'ABDM_VALIDATION_ERROR',
      statusCode: 500,
    });
  }
}

/**
 * Encrypts an ABHA number for database storage using AES-256-GCM (random 12-byte IV + 16-byte auth tag).
 * Output format: `v1:<ivHex>:<authTagHex>:<ciphertextHex>`
 */
export function encryptAbhaNumberForStorage(
  rawAbhaNumber: string,
  source: NodeJS.ProcessEnv = process.env
): string {
  const normalized = normalizeAbhaNumber(rawAbhaNumber);
  const key = deriveAesKey(source);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a stored AES-256-GCM encrypted ABHA number (server-side authorized flows only).
 */
export function decryptAbhaNumberFromStorage(
  payload: string,
  source: NodeJS.ProcessEnv = process.env
): string {
  const parts = payload.split(':');
  const [version, ivHex, authTagHex, cipherHex] = parts;
  if (parts.length !== 4 || version !== 'v1' || !ivHex || !authTagHex || !cipherHex) {
    throw new AbdmIntegrationError({
      message: 'Invalid encrypted ABHA identifier format',
      abdmCode: 'ABDM_VALIDATION_ERROR',
      statusCode: 500,
    });
  }
  const key = deriveAesKey(source);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Encrypts arbitrary sensitive UTF-8 payload (e.g., consent artefact sensitive metadata)
 * using AES-256-GCM (random 12-byte IV + 16-byte auth tag).
 * Output format: `v1:<ivHex>:<authTagHex>:<ciphertextHex>`
 */
export function encryptSensitivePayloadForStorage(
  plaintext: string,
  source: NodeJS.ProcessEnv = process.env
): string {
  const key = deriveAesKey(source);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a stored AES-256-GCM encrypted sensitive payload.
 */
export function decryptSensitivePayloadFromStorage(
  payload: string,
  source: NodeJS.ProcessEnv = process.env
): string {
  return decryptAbhaNumberFromStorage(payload, source);
}

/**
 * Computes a deterministic HMAC-SHA256 blind index of the normalized 14-digit ABHA number
 * to enforce global uniqueness across active patient links without exposing plaintext in indexes.
 */
export function computeAbhaNumberHash(
  rawAbhaNumber: string,
  source: NodeJS.ProcessEnv = process.env
): string {
  const normalized = normalizeAbhaNumber(rawAbhaNumber);
  const hmacKey = deriveHmacKey(source);
  return crypto.createHmac('sha256', hmacKey).update(normalized).digest('hex');
}

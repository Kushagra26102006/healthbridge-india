import crypto from 'crypto';
import { env } from '../../../config/env';
import type { VideoProviderMode } from '../models/video-consultation.model';

export interface VideoRoomTokenRequest {
  userId: string;
  role: 'PATIENT' | 'DOCTOR';
  roomName: string;
  appointmentId: string;
  consultationId: string;
  clientSessionId: string;
  ttlSeconds?: number;
}

export interface VideoRoomTokenResult {
  token: string;
  provider: VideoProviderMode;
  providerUrl?: string;
  roomName: string;
  expiresAt: string;
  ttlSeconds: number;
  recordingEnabled: false;
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
}

export interface VerifiedRoomTokenClaims {
  sub: string;
  role: 'PATIENT' | 'DOCTOR';
  roomName: string;
  appointmentId: string;
  consultationId: string;
  clientSessionId: string;
  provider: VideoProviderMode;
  exp: number;
  jti: string;
}

const DEFAULT_ICE_SERVERS: Array<{ urls: string[] }> = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

const base64UrlEncode = (input: string | Buffer): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (input: string): string => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
};

export class VideoTokenService {
  /**
   * Resolves the active video infrastructure provider cleanly without exposing secrets.
   */
  getProviderConfig(): {
    configuredProvider: VideoProviderMode;
    livekitConfigured: boolean;
    livekitUrl?: string;
    tokenTtlSeconds: number;
    recordingEnabledByDefault: false;
    iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  } {
    const livekitConfigured = Boolean(
      env.VIDEO_PROVIDER === 'livekit' &&
        env.VIDEO_LIVEKIT_URL &&
        env.VIDEO_LIVEKIT_API_KEY &&
        env.VIDEO_LIVEKIT_API_SECRET
    );

    const configuredProvider: VideoProviderMode = livekitConfigured ? 'LIVEKIT' : 'WEBRTC_DIRECT';

    let iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> =
      DEFAULT_ICE_SERVERS;
    if (env.VIDEO_ICE_SERVERS_JSON) {
      try {
        const parsed = JSON.parse(env.VIDEO_ICE_SERVERS_JSON);
        if (Array.isArray(parsed) && parsed.length > 0) {
          iceServers = parsed;
        }
      } catch {
        iceServers = DEFAULT_ICE_SERVERS;
      }
    }

    return {
      configuredProvider,
      livekitConfigured,
      livekitUrl: livekitConfigured ? env.VIDEO_LIVEKIT_URL : undefined,
      tokenTtlSeconds: env.VIDEO_TOKEN_TTL_SECONDS || 900,
      recordingEnabledByDefault: false,
      iceServers,
    };
  }

  /**
   * Generates an opaque, cryptographically random room slug containing ZERO PHI.
   */
  generateOpaqueRoomName(): string {
    return `hb-vc-${crypto.randomBytes(12).toString('hex')}`;
  }

  /**
   * Signs a short-lived HS256 JWT strictly on the backend.
   * - For LiveKit: conforms to LiveKit AccessToken JWT specification (roomRecord: false).
   * - For WebRTC Direct: binds userId, role, roomName, appointmentId, consultationId, and clientSessionId.
   */
  issueRoomToken(req: VideoRoomTokenRequest): VideoRoomTokenResult {
    const cfg = this.getProviderConfig();
    const ttlSeconds = Math.min(3600, Math.max(60, req.ttlSeconds ?? cfg.tokenTtlSeconds));
    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + ttlSeconds;
    const jti = crypto.randomUUID();

    const header = { alg: 'HS256', typ: 'JWT' };

    let payload: Record<string, unknown>;
    let signingSecret: string;

    if (cfg.configuredProvider === 'LIVEKIT' && env.VIDEO_LIVEKIT_API_KEY && env.VIDEO_LIVEKIT_API_SECRET) {
      signingSecret = env.VIDEO_LIVEKIT_API_SECRET;
      payload = {
        iss: env.VIDEO_LIVEKIT_API_KEY,
        sub: req.userId,
        nbf: nowSec - 5,
        iat: nowSec,
        exp,
        jti,
        // LiveKit standard VideoGrant — explicitly disables room recording
        video: {
          room: req.roomName,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          roomRecord: false,
          hidden: false,
        },
        // Non-PHI technical binding metadata
        hb: {
          role: req.role,
          appointmentId: req.appointmentId,
          consultationId: req.consultationId,
          clientSessionId: req.clientSessionId,
          provider: 'LIVEKIT',
        },
      };
    } else {
      signingSecret = `${env.JWT_ACCESS_SECRET}:telemedicine-room`;
      payload = {
        iss: 'healthbridge-telemedicine',
        aud: 'healthbridge-webrtc-room',
        typ: 'telemedicine_room',
        sub: req.userId,
        role: req.role,
        roomName: req.roomName,
        appointmentId: req.appointmentId,
        consultationId: req.consultationId,
        clientSessionId: req.clientSessionId,
        provider: 'WEBRTC_DIRECT',
        recordingAllowed: false,
        iat: nowSec,
        exp,
        jti,
      };
    }

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', signingSecret)
      .update(signingInput)
      .digest();
    const token = `${signingInput}.${base64UrlEncode(signature)}`;

    return {
      token,
      provider: cfg.configuredProvider,
      providerUrl: cfg.livekitUrl,
      roomName: req.roomName,
      expiresAt: new Date(exp * 1000).toISOString(),
      ttlSeconds,
      recordingEnabled: false,
      iceServers: cfg.iceServers,
    };
  }

  /**
   * Verifies signature, expiry, room binding, and participant identity for a room token.
   */
  verifyRoomToken(
    token: string,
    expectedRoomName: string,
    expectedUserId: string
  ): VerifiedRoomTokenClaims {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('INVALID_ROOM_TOKEN_FORMAT');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
    const payloadJson = JSON.parse(base64UrlDecode(encodedPayload)) as Record<string, unknown>;

    const provider: VideoProviderMode =
      payloadJson.provider === 'LIVEKIT' || (payloadJson.hb as any)?.provider === 'LIVEKIT'
        ? 'LIVEKIT'
        : 'WEBRTC_DIRECT';

    const signingSecret =
      provider === 'LIVEKIT' && env.VIDEO_LIVEKIT_API_SECRET
        ? env.VIDEO_LIVEKIT_API_SECRET
        : `${env.JWT_ACCESS_SECRET}:telemedicine-room`;

    const expectedSig = base64UrlEncode(
      crypto
        .createHmac('sha256', signingSecret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest()
    );

    const sigBuf = Buffer.from(encodedSignature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new Error('INVALID_ROOM_TOKEN_SIGNATURE');
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const exp = Number(payloadJson.exp || 0);
    if (!exp || nowSec >= exp) {
      throw new Error('ROOM_TOKEN_EXPIRED');
    }

    const roomName =
      provider === 'LIVEKIT'
        ? String((payloadJson.video as Record<string, unknown> | undefined)?.room || '')
        : String(payloadJson.roomName || '');
    const sub = String(payloadJson.sub || '');

    if (roomName !== expectedRoomName || sub !== expectedUserId) {
      throw new Error('ROOM_TOKEN_SCOPE_MISMATCH');
    }

    const hbMeta = (payloadJson.hb || payloadJson) as Record<string, unknown>;
    return {
      sub,
      role: hbMeta.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
      roomName,
      appointmentId: String(hbMeta.appointmentId || ''),
      consultationId: String(hbMeta.consultationId || ''),
      clientSessionId: String(hbMeta.clientSessionId || ''),
      provider,
      exp,
      jti: String(payloadJson.jti || ''),
    };
  }
}

export const videoTokenService = new VideoTokenService();

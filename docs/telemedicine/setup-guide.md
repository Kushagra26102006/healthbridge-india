# HealthBridge India — Video Consultation Setup Guide

## 1. Environment Variables

Configure backend variables in `apps/api/.env` (never expose API keys or secrets in `apps/web/.env.local` or `NEXT_PUBLIC_*`):

```dotenv
# Backend (apps/api/.env)
# Mode: "webrtc_direct" for local development/testing | "livekit" for managed or self-hosted SFU
VIDEO_PROVIDER=webrtc_direct

# Required only when VIDEO_PROVIDER=livekit
VIDEO_LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
VIDEO_LIVEKIT_API_KEY=your_livekit_api_key
VIDEO_LIVEKIT_API_SECRET=your_livekit_api_secret

# Short-lived room token TTL (seconds, clamped between 120 and 3600; default 900 = 15 min)
VIDEO_TOKEN_TTL_SECONDS=900

# Recording MUST remain disabled by default
VIDEO_RECORDING_ENABLED=false

# ICE / STUN / TURN servers for WebRTC NAT traversal (JSON array)
VIDEO_ICE_SERVERS_JSON=[{"urls":["stun:stun.l.google.com:19302"]}]
```

When deploying with LiveKit SFU, expose **only the public WebSocket origin** to Next.js CSP in `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_VIDEO_WS_ORIGIN=wss://your-livekit-instance.livekit.cloud
```

---

## 2. Local Development Testing (Two Browser Tabs / Devices)

1. Ensure MongoDB is running and seed synthetic data (includes confirmed & requested `TELECONSULTATION` appointments):
   ```bash
   pnpm --dir healthbridge-india seed
   ```
2. Start backend (`:5001`) and frontend (`:3000`):
   ```bash
   pnpm --dir healthbridge-india dev
   ```
3. **Tab 1 (Doctor):** Sign in as `dr.priya.sharma@healthbridge.local` (`DemoSecure#2026`).
   - Open `/doctor/dashboard` → locate **Upcoming Video Consultations**.
   - Test **Accept** / **Reject** on the `REQUESTED` teleconsultation, and click **Join Consultation** on Ramesh Patel's confirmed teleconsultation.
4. **Tab 2 / Incognito (Patient):** Sign in as `ramesh.patel@healthbridge.local` (`DemoSecure#2026`).
   - Open `/patient/appointments`, select the confirmed Teleconsultation appointment, and click **Join Video Consultation**.
   - Accept the telemedicine informed consent & non-emergency disclaimer, verify camera/mic preview in the Waiting Room, and join the room.
5. **Admin Telemetry:** Sign in as `admin.demo@healthbridge.local` (`DemoSecure#2026`) and open `/admin/telemedicine`.

---

## 3. Production Readiness Prerequisites (Required Before Live Clinical Use)

> **Important:** Video calling is **NOT** production-ready until every item below is completed and verified on real devices:

1. **Provision Managed or Self-Hosted LiveKit SFU** in an India region (`ap-south-1` Mumbai / Hyderabad) with TLS (`wss://`).
2. **Configure Dedicated TURN/STUN Relays** (UDP/TCP 443 TLS) to support strict hospital firewalls and carrier-grade NAT mobile networks.
3. **Enforce HTTPS Everywhere:** Browser `navigator.mediaDevices.getUserMedia` requires a secure origin (`https://` in production; `localhost` only works locally).
4. **Real-Device Matrix Testing:** Validate audio/video, network handoff (Wi-Fi ↔ 4G/5G), and audio-only fallback on iOS Safari, Android Chrome, macOS Safari/Chrome, and Windows Edge/Chrome.
5. **Independent Security & Clinical Governance Review:** Validate compliance with India Telemedicine Practice Guidelines and DPDP Act requirements before onboarding real patients.

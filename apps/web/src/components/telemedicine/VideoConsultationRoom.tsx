'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Pill,
  ArrowLeft,
  Lock,
  Wifi,
  WifiOff,
  Loader2,
  Headphones,
  Save,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  telemedicineApi,
  type VideoConsultationSessionDto,
  type VideoRoomTokenResponseDto,
  type VideoConsultationMode,
} from '@/features/telemedicine/api/telemedicine-api';

export type CallUiStage =
  | 'LOADING'
  | 'CONSENT_REQUIRED'
  | 'WAITING_ROOM'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'COMPLETED'
  | 'ERROR';

export interface VideoConsultationRoomProps {
  appointmentId: string;
  portalRole: 'PATIENT' | 'DOCTOR';
  backHref: string;
  backLabel?: string;
}

const formatElapsed = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function VideoConsultationRoom({
  appointmentId,
  portalRole,
  backHref,
  backLabel = 'Back to Appointments',
}: VideoConsultationRoomProps) {
  const [stage, setStage] = useState<CallUiStage>('LOADING');
  const [session, setSession] = useState<VideoConsultationSessionDto | null>(null);
  const [roomTokenData, setRoomTokenData] = useState<VideoRoomTokenResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consent state (Patient)
  const [consentChecked, setConsentChecked] = useState(false);
  const [emergencyChecked, setEmergencyChecked] = useState(false);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);

  // Media controls & permissions
  const [mode, setMode] = useState<VideoConsultationMode>('VIDEO');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'IDLE' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE'>('IDLE');
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Doctor consultation notes state
  const [notes, setNotes] = useState({
    chiefComplaint: '',
    clinicalObservations: '',
    summary: '',
    followUpPlan: '',
  });
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<string | null>(null);
  const [notesFeedback, setNotesFeedback] = useState<string | null>(null);

  // Refs for WebRTC & DOM video/audio elements
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const lastSignalTimeRef = useRef<string | undefined>(undefined);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const clientSessionIdRef = useRef<string>(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `hb-client-${Date.now()}`
  );
  const offerSentRef = useRef(false);

  const stopMediaAndRtc = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.onicecandidate = null;
        peerRef.current.ontrack = null;
        peerRef.current.onconnectionstatechange = null;
        peerRef.current.close();
      } catch {
        // ignore cleanup error
      }
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteConnected(false);
    offerSentRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaAndRtc();
    };
  }, [stopMediaAndRtc]);

  // Acquire local media (camera + mic, or audio-only fallback)
  const acquireLocalMedia = useCallback(
    async (requestedMode: VideoConsultationMode): Promise<MediaStream | null> => {
      setMediaError(null);
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setPermissionState('UNAVAILABLE');
        setMediaError(
          'Your browser does not support WebRTC media capture or requires an HTTPS connection.'
        );
        return null;
      }

      // Stop any existing local stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video:
            requestedMode === 'VIDEO'
              ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
              : false,
        });
        localStreamRef.current = stream;
        setPermissionState('GRANTED');
        setCameraEnabled(requestedMode === 'VIDEO');
        setMicEnabled(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return stream;
      } catch (err: unknown) {
        const errName = err instanceof Error ? err.name : 'MediaError';
        // Automatic fallback to audio-only when camera is busy or missing
        if (
          requestedMode === 'VIDEO' &&
          (errName === 'NotFoundError' || errName === 'NotReadableError' || errName === 'OverconstrainedError')
        ) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = audioStream;
            setMode('AUDIO_ONLY');
            setCameraEnabled(false);
            setMicEnabled(true);
            setPermissionState('GRANTED');
            setMediaError(
              'Camera was unavailable — automatically switched to Audio-Only consultation mode.'
            );
            return audioStream;
          } catch {
            // Fall through to full denial handling
          }
        }

        setPermissionState(errName === 'NotAllowedError' ? 'DENIED' : 'UNAVAILABLE');
        setMediaError(
          errName === 'NotAllowedError'
            ? 'Camera or microphone permission was denied. Allow access in your browser address bar, or switch to Audio-Only mode and retry.'
            : 'Unable to access camera or microphone. Check that no other app is using your camera or switch to Audio-Only mode.'
        );
        return null;
      }
    },
    []
  );

  // Initial session load
  const loadSession = useCallback(async () => {
    try {
      setStage('LOADING');
      setErrorMessage(null);
      const data = await telemedicineApi.getSession(appointmentId);
      setSession(data);
      setMode(data.mode || 'VIDEO');
      if (data.consultationNotes) {
        setNotes({
          chiefComplaint: data.consultationNotes.chiefComplaint || '',
          clinicalObservations: data.consultationNotes.clinicalObservations || '',
          summary: data.consultationNotes.summary || '',
          followUpPlan: data.consultationNotes.followUpPlan || '',
        });
        if (data.consultationNotes.updatedAt) {
          setNotesSavedAt(data.consultationNotes.updatedAt);
        }
      }

      if (data.status === 'COMPLETED') {
        setStage('COMPLETED');
        return;
      }
      if (!data.canJoin) {
        setErrorMessage(
          `This appointment is currently "${data.appointment.status}" and cannot enter a video room.`
        );
        setStage('ERROR');
        return;
      }

      if (portalRole === 'PATIENT' && !data.consent.granted) {
        setStage('CONSENT_REQUIRED');
      } else {
        setStage('WAITING_ROOM');
      }
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Unable to load video consultation room');
      setErrorMessage(message);
      setStage('ERROR');
    }
  }, [appointmentId, portalRole]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Attach local preview stream when entering waiting room or live call
  useEffect(() => {
    if (stage === 'WAITING_ROOM' && !localStreamRef.current && permissionState === 'IDLE') {
      acquireLocalMedia(mode);
    } else if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [stage, mode, permissionState, acquireLocalMedia]);

  // Live duration timer while connected
  useEffect(() => {
    if (stage !== 'CONNECTED') return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  // Speaker mute sync on remote media element
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !speakerEnabled;
    }
  }, [speakerEnabled]);

  const handleAcceptConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked || !emergencyChecked) return;
    try {
      setIsSubmittingConsent(true);
      setErrorMessage(null);
      await telemedicineApi.grantConsent(appointmentId, {
        consentAccepted: true,
        emergencyDisclaimerAcknowledged: true,
      });
      setSession((prev) =>
        prev
          ? {
              ...prev,
              consent: {
                ...prev.consent,
                granted: true,
                grantedAt: new Date().toISOString(),
                emergencyDisclaimerAcknowledged: true,
              },
            }
          : prev
      );
      setStage('WAITING_ROOM');
    } catch (err: unknown) {
      setErrorMessage(
        (err as any)?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Failed to record telemedicine consent')
      );
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  // Start WebRTC connection & signaling loop
  const startCallConnection = useCallback(
    async (requestedMode: VideoConsultationMode) => {
      try {
        setErrorMessage(null);
        setStage('CONNECTING');

        let stream = localStreamRef.current;
        if (!stream) {
          stream = await acquireLocalMedia(requestedMode);
        }

        const tokenResp = await telemedicineApi.issueJoinToken(appointmentId, {
          mode: requestedMode,
          clientSessionId: clientSessionIdRef.current,
        });
        setRoomTokenData(tokenResp);

        // Configure encrypted WebRTC RTCPeerConnection (DTLS-SRTP media transport)
        if (typeof RTCPeerConnection === 'undefined') {
          setStage('CONNECTED');
          return;
        }

        const pc = new RTCPeerConnection({ iceServers: tokenResp.iceServers });
        peerRef.current = pc;

        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream!);
          });
        }

        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.muted = !speakerEnabled;
          }
          setRemoteConnected(true);
          setStage('CONNECTED');
          telemedicineApi
            .updateState(appointmentId, { status: 'CONNECTED', mode: requestedMode })
            .catch(() => undefined);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            telemedicineApi
              .postSignal(tokenResp.consultationId, {
                roomToken: tokenResp.token,
                signalType: 'ICE_CANDIDATE',
                payload: { candidate: event.candidate.toJSON() },
              })
              .catch(() => undefined);
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === 'connected') {
            setRemoteConnected(true);
            setStage('CONNECTED');
            telemedicineApi
              .updateState(appointmentId, { status: 'CONNECTED', mode: requestedMode })
              .catch(() => undefined);
          } else if (state === 'disconnected') {
            setStage('RECONNECTING');
            telemedicineApi
              .updateState(appointmentId, { status: 'RECONNECTING' })
              .catch(() => undefined);
          } else if (state === 'failed') {
            setStage('RECONNECTING');
            telemedicineApi
              .updateState(appointmentId, {
                status: 'FAILED',
                failureCode: 'ICE_CONNECTION_FAILED',
                failureCategory: 'NETWORK_INTERRUPTION',
              })
              .catch(() => undefined);
          }
        };

        // Doctor initiates SDP offer once both peers are present (or immediately to await patient)
        const initiateOffer = async () => {
          if (offerSentRef.current || pc.signalingState !== 'stable') return;
          offerSentRef.current = true;
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: requestedMode === 'VIDEO',
          });
          await pc.setLocalDescription(offer);
          await telemedicineApi.postSignal(tokenResp.consultationId, {
            roomToken: tokenResp.token,
            signalType: 'OFFER',
            payload: { sdp: offer },
          });
        };

        // Start signaling poll loop for authenticated peer SDP/ICE messages
        const pollOnce = async () => {
          if (!peerRef.current) return;
          try {
            const resp = await telemedicineApi.pollSignals(
              tokenResp.consultationId,
              tokenResp.token,
              lastSignalTimeRef.current
            );

            if (
              portalRole === 'DOCTOR' &&
              resp.presence.patientJoined &&
              !offerSentRef.current
            ) {
              await initiateOffer();
            }

            for (const sig of resp.signals) {
              if (processedSignalIdsRef.current.has(sig.id)) continue;
              processedSignalIdsRef.current.add(sig.id);
              lastSignalTimeRef.current = sig.createdAt;

              if (sig.signalType === 'OFFER' && sig.payload.sdp) {
                await pc.setRemoteDescription(
                  new RTCSessionDescription(sig.payload.sdp as RTCSessionDescriptionInit)
                );
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await telemedicineApi.postSignal(tokenResp.consultationId, {
                  roomToken: tokenResp.token,
                  signalType: 'ANSWER',
                  payload: { sdp: answer },
                });
              } else if (sig.signalType === 'ANSWER' && sig.payload.sdp) {
                if (pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(
                    new RTCSessionDescription(sig.payload.sdp as RTCSessionDescriptionInit)
                  );
                }
              } else if (sig.signalType === 'ICE_CANDIDATE' && sig.payload.candidate) {
                await pc
                  .addIceCandidate(new RTCIceCandidate(sig.payload.candidate as RTCIceCandidateInit))
                  .catch(() => undefined);
              } else if (sig.signalType === 'HANGUP') {
                stopMediaAndRtc();
                setStage('COMPLETED');
              }
            }
          } catch {
            // Transient poll error; keep retrying until user reconnects or ends call
          }
        };

        await pollOnce();
        pollTimerRef.current = window.setInterval(pollOnce, 2000);
      } catch (err: unknown) {
        const msg =
          (err as any)?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Unable to connect to video consultation room');
        setErrorMessage(msg);
        setStage('ERROR');
      }
    },
    [appointmentId, portalRole, acquireLocalMedia, speakerEnabled, stopMediaAndRtc]
  );

  const handleToggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const next = !cameraEnabled;
    videoTracks.forEach((t) => {
      t.enabled = next;
    });
    setCameraEnabled(next);
  };

  const handleToggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micEnabled;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setMicEnabled(next);
  };

  const handleSwitchAudioOnly = async () => {
    setMode('AUDIO_ONLY');
    setCameraEnabled(false);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = false;
        t.stop();
      });
    }
    await telemedicineApi
      .updateState(appointmentId, { mode: 'AUDIO_ONLY' })
      .catch(() => undefined);
  };

  const handleReconnect = async () => {
    stopMediaAndRtc();
    processedSignalIdsRef.current.clear();
    lastSignalTimeRef.current = undefined;
    await startCallConnection(mode);
  };

  const handleEndCall = async () => {
    if (roomTokenData) {
      await telemedicineApi
        .postSignal(roomTokenData.consultationId, {
          roomToken: roomTokenData.token,
          signalType: 'HANGUP',
          payload: { endedBy: portalRole },
        })
        .catch(() => undefined);
    }
    await telemedicineApi
      .updateState(appointmentId, { status: 'COMPLETED' })
      .catch(() => undefined);
    stopMediaAndRtc();
    setStage('COMPLETED');
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingNotes(true);
      setNotesFeedback(null);
      await telemedicineApi.saveNotes(appointmentId, notes);
      setNotesSavedAt(new Date().toISOString());
      setNotesFeedback('Consultation notes saved securely.');
    } catch (err: unknown) {
      setNotesFeedback(
        (err as any)?.response?.data?.message || 'Unable to save consultation notes right now.'
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const statusBadgeMeta: Record<CallUiStage, { label: string; className: string }> = {
    LOADING: { label: 'Loading Room', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
    CONSENT_REQUIRED: { label: 'Consent Required', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    WAITING_ROOM: { label: 'Waiting Room', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
    CONNECTING: { label: 'Connecting...', className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' },
    CONNECTED: { label: 'Connected • Encrypted', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    RECONNECTING: { label: 'Reconnecting...', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    COMPLETED: { label: 'Consultation Completed', className: 'bg-teal-500/15 text-teal-700 dark:text-teal-300' },
    ERROR: { label: 'Connection Error', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  };

  const prescriptionHref = session
    ? `/doctor/prescriptions/new?patientId=${encodeURIComponent(session.patient.id)}&patientName=${encodeURIComponent(session.patient.name)}${
        session.appointment.encounterId
          ? `&encounterId=${encodeURIComponent(session.appointment.encounterId)}`
          : ''
      }`
    : '/doctor/prescriptions/new';

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Top Navigation & Security Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="text-xs -ml-2">
          <Link href={backHref}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {backLabel}
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`text-xs border-0 ${statusBadgeMeta[stage].className}`}>
            {stage === 'CONNECTED' ? (
              <Wifi className="h-3 w-3 mr-1" aria-hidden="true" />
            ) : stage === 'RECONNECTING' || stage === 'ERROR' ? (
              <WifiOff className="h-3 w-3 mr-1" aria-hidden="true" />
            ) : (
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
            )}
            {statusBadgeMeta[stage].label}
          </Badge>

          <Badge variant="outline" className="text-xs gap-1">
            <Lock className="h-3 w-3 text-teal-600" aria-hidden="true" />
            <span>DTLS-SRTP Encrypted</span>
          </Badge>

          <Badge variant="outline" className="text-xs gap-1">
            <ShieldCheck className="h-3 w-3 text-blue-600" aria-hidden="true" />
            <span>Not Recorded</span>
          </Badge>
        </div>
      </div>

      {/* Mandatory Non-Emergency Medical Disclaimer Banner */}
      <div
        role="note"
        aria-label="Emergency medical disclaimer"
        className="rounded-xl border border-amber-300/80 dark:border-amber-800/70 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200"
      >
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <span className="font-semibold">Not an Emergency Service:</span>{' '}
          {session?.emergencyDisclaimer ||
            'Video consultation is not intended for life-threatening medical emergencies. In India, dial 112 or 108 immediately or visit the nearest emergency department.'}
        </p>
      </div>

      {/* Loading View */}
      {stage === 'LOADING' && (
        <Card className="p-12 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm font-medium text-foreground">
            Verifying appointment authorization and preparing secure consultation room...
          </p>
        </Card>
      )}

      {/* Error View */}
      {stage === 'ERROR' && (
        <Card className="p-8 max-w-xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Unable to Join Video Consultation</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {errorMessage || 'An unexpected error occurred while initializing the secure room.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={loadSession}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry Connection
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Patient Informed Consent Gate */}
      {stage === 'CONSENT_REQUIRED' && session && (
        <Card className="p-6 sm:p-8 max-w-2xl mx-auto space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Telemedicine Informed Consent Required
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Before entering your encrypted consultation room with{' '}
                <span className="font-semibold text-foreground">{session.doctor.name}</span>, please
                review and confirm your consent.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Privacy &amp; Security Guarantees</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Only you and your assigned doctor can enter this room via short-lived signed tokens.</li>
              <li>Audio and video streams are encrypted in transit (WebRTC DTLS-SRTP).</li>
              <li>Call recording is disabled by default; no video or audio is recorded.</li>
              <li>You may switch to audio-only mode or end the consultation at any time.</li>
            </ul>
          </div>

          <form onSubmit={handleAcceptConsent} className="space-y-4">
            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
                required
              />
              <span>
                I consent to participate in this remote teleconsultation with {session.doctor.name}{' '}
                and understand its scope and limitations compared to an in-person examination.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyChecked}
                onChange={(e) => setEmergencyChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500"
                required
              />
              <span>
                I understand this video consultation is <strong>not an emergency service</strong>{' '}
                and I will contact 112 / 108 or visit an emergency room for urgent symptoms.
              </span>
            </label>

            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errorMessage}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="teal"
                disabled={!consentChecked || !emergencyChecked || isSubmittingConsent}
              >
                {isSubmittingConsent ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                )}
                Accept &amp; Enter Waiting Room
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href={backHref}>Cancel</Link>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Completed Consultation View */}
      {stage === 'COMPLETED' && session && (
        <Card className="p-8 max-w-2xl mx-auto text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Video Consultation Completed</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your encrypted consultation room has been closed and all media tracks were released.
              {elapsedSeconds > 0 ? ` Session duration: ${formatElapsed(elapsedSeconds)}.` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {portalRole === 'DOCTOR' && (
              <Button variant="teal" asChild>
                <Link href={prescriptionHref}>
                  <Pill className="h-4 w-4 mr-1.5" />
                  Create Digital Prescription
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Waiting Room & Active Video Call Workspace */}
      {(stage === 'WAITING_ROOM' ||
        stage === 'CONNECTING' ||
        stage === 'CONNECTED' ||
        stage === 'RECONNECTING') &&
        session && (
          <div
            className={`grid grid-cols-1 gap-5 ${
              portalRole === 'DOCTOR' ? 'lg:grid-cols-12' : 'lg:grid-cols-12'
            }`}
          >
            {/* Primary Video / Audio Stage */}
            <div className={portalRole === 'DOCTOR' ? 'lg:col-span-8 space-y-4' : 'lg:col-span-8 space-y-4'}>
              <Card className="overflow-hidden border-border/80 bg-slate-950 text-white rounded-2xl shadow-lg">
                {/* Stage Header */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        stage === 'CONNECTED'
                          ? 'bg-emerald-400 animate-pulse'
                          : stage === 'RECONNECTING'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-sky-400'
                      }`}
                    />
                    <span className="font-semibold">
                      {portalRole === 'PATIENT' ? session.doctor.name : session.patient.name}
                    </span>
                    <span className="text-slate-400">
                      • {session.appointment.startTime}–{session.appointment.endTime} IST
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300 font-mono">
                    {stage === 'CONNECTED' && <span>{formatElapsed(elapsedSeconds)}</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                      {mode === 'AUDIO_ONLY' ? 'Audio-Only' : 'HD Video'}
                    </span>
                  </div>
                </div>

                {/* Video Viewport */}
                <div className="relative aspect-[16/10] sm:aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 flex items-center justify-center">
                  {stage === 'WAITING_ROOM' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {mode === 'VIDEO' && cameraEnabled && permissionState === 'GRANTED' ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="text-center space-y-3 p-6 max-w-md">
                          <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center mx-auto">
                            {mode === 'AUDIO_ONLY' ? (
                              <Headphones className="h-8 w-8" />
                            ) : (
                              <VideoOff className="h-8 w-8" />
                            )}
                          </div>
                          <h2 className="text-lg font-bold">
                            {mode === 'AUDIO_ONLY' ? 'Audio-Only Mode Ready' : 'Secure Waiting Room'}
                          </h2>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {mediaError ||
                              'Test your microphone and camera below before joining the encrypted consultation.'}
                          </p>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs bg-slate-950/75 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-slate-200">
                          {portalRole === 'PATIENT'
                            ? `Waiting room for ${session.doctor.name}`
                            : `Patient consent: ${session.consent.granted ? 'Granted' : 'Pending'}`}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => acquireLocalMedia(mode)}
                          className="bg-slate-950/75 text-white border-white/20 hover:bg-white/15 text-xs h-8"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Retest Devices
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Remote Peer Video/Audio Stream */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${
                          remoteConnected && mode === 'VIDEO' ? 'opacity-100' : 'opacity-0'
                        }`}
                      />

                      {(!remoteConnected || mode === 'AUDIO_ONLY') && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                            {stage === 'CONNECTING' || stage === 'RECONNECTING' ? (
                              <Loader2 className="h-9 w-9 animate-spin" />
                            ) : (
                              <Headphones className="h-9 w-9" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-bold text-white">
                              {stage === 'RECONNECTING'
                                ? 'Network interrupted — Reconnecting...'
                                : remoteConnected
                                  ? 'Audio-Only Consultation Active'
                                  : portalRole === 'PATIENT'
                                    ? `Waiting for ${session.doctor.name} to join...`
                                    : `Waiting for ${session.patient.name} to join...`}
                            </p>
                            <p className="text-xs text-slate-300 max-w-sm">
                              Encrypted peer channel is open. You can switch to Audio-Only mode or
                              tap Reconnect at any time if network bandwidth drops.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Local PiP Preview */}
                      {mode === 'VIDEO' && cameraEnabled && (
                        <div className="absolute bottom-3 right-3 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden border border-white/20 bg-slate-900 shadow-xl">
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Permission / Media Feedback Banner */}
                {mediaError && (
                  <div className="px-4 py-2.5 bg-amber-950/60 border-t border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2">
                    <span>{mediaError}</span>
                    {mode === 'VIDEO' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSwitchAudioOnly}
                        className="h-7 text-[11px] border-amber-400/40 text-amber-100 hover:bg-amber-900/50"
                      >
                        Use Audio-Only
                      </Button>
                    )}
                  </div>
                )}

                {/* Call Controls Bar */}
                <div className="p-4 bg-slate-900 border-t border-white/10 flex flex-wrap items-center justify-center gap-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleToggleMic}
                    aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                    className={`h-10 px-3.5 rounded-xl border-white/15 ${
                      micEnabled
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
                    }`}
                  >
                    {micEnabled ? <Mic className="h-4 w-4 mr-1.5" /> : <MicOff className="h-4 w-4 mr-1.5" />}
                    <span className="text-xs">{micEnabled ? 'Mic On' : 'Muted'}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleToggleCamera}
                    disabled={mode === 'AUDIO_ONLY'}
                    aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                    className={`h-10 px-3.5 rounded-xl border-white/15 ${
                      cameraEnabled && mode === 'VIDEO'
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cameraEnabled && mode === 'VIDEO' ? (
                      <Video className="h-4 w-4 mr-1.5" />
                    ) : (
                      <VideoOff className="h-4 w-4 mr-1.5" />
                    )}
                    <span className="text-xs">
                      {mode === 'AUDIO_ONLY' ? 'Audio-Only' : cameraEnabled ? 'Camera On' : 'Camera Off'}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSpeakerEnabled((prev) => !prev)}
                    aria-label={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
                    className={`h-10 px-3.5 rounded-xl border-white/15 ${
                      speakerEnabled
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-amber-600 text-white border-amber-500 hover:bg-amber-700'
                    }`}
                  >
                    {speakerEnabled ? (
                      <Volume2 className="h-4 w-4 mr-1.5" />
                    ) : (
                      <VolumeX className="h-4 w-4 mr-1.5" />
                    )}
                    <span className="text-xs">{speakerEnabled ? 'Speaker On' : 'Speaker Off'}</span>
                  </Button>

                  {mode === 'VIDEO' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSwitchAudioOnly}
                      className="h-10 px-3.5 rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Headphones className="h-4 w-4 mr-1.5" />
                      <span className="text-xs">Audio-Only</span>
                    </Button>
                  )}

                  {stage === 'WAITING_ROOM' ? (
                    <Button
                      type="button"
                      variant="teal"
                      size="sm"
                      onClick={() => startCallConnection(mode)}
                      className="h-10 px-5 rounded-xl font-semibold"
                    >
                      <PhoneCall className="h-4 w-4 mr-1.5" />
                      <span>
                        {mode === 'AUDIO_ONLY' ? 'Join Audio Consultation' : 'Join Video Room'}
                      </span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleReconnect}
                        className="h-10 px-3.5 rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20"
                      >
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        <span className="text-xs">Reconnect</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleEndCall}
                        className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                      >
                        <PhoneOff className="h-4 w-4 mr-1.5" />
                        <span className="text-xs">End Call</span>
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Clinical / Appointment Details Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* Appointment & Participant Context Card */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                    <span>
                      {portalRole === 'DOCTOR' ? 'Authorized Patient Info' : 'Consultation Details'}
                    </span>
                  </h2>
                  <Badge variant="outline" className="text-[10px]">
                    {session.appointment.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">
                      {portalRole === 'DOCTOR' ? 'Patient' : 'Doctor'}
                    </span>
                    <span className="font-semibold text-foreground text-right">
                      {portalRole === 'DOCTOR' ? session.patient.name : session.doctor.name}
                    </span>
                  </div>

                  {portalRole === 'PATIENT' && session.doctor.specialization.length > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Specialty</span>
                      <span className="text-foreground text-right">
                        {session.doctor.specialization.join(', ')}
                      </span>
                    </div>
                  )}

                  {portalRole === 'DOCTOR' && session.patient.phone && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Contact</span>
                      <span className="font-mono text-foreground">{session.patient.phone}</span>
                    </div>
                  )}

                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Schedule</span>
                    <span className="text-foreground text-right">
                      {new Date(session.appointment.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {session.appointment.startTime}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/70">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">
                      Clinical Reason
                    </p>
                    <p className="text-xs text-foreground bg-muted/40 rounded-lg p-2.5 border border-border/60">
                      {session.appointment.reason}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Doctor-Only Clinical Notes & Prescription Workflow Integration */}
              {portalRole === 'DOCTOR' && (
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>Consultation Notes</span>
                    </h2>
                    <Button variant="teal" size="sm" asChild className="h-8 text-xs">
                      <Link href={prescriptionHref} target="_blank" rel="noopener noreferrer">
                        <Pill className="h-3.5 w-3.5 mr-1" />
                        Create Prescription
                      </Link>
                    </Button>
                  </div>

                  <form onSubmit={handleSaveNotes} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Chief Complaint
                      </label>
                      <input
                        type="text"
                        value={notes.chiefComplaint}
                        onChange={(e) => setNotes((p) => ({ ...p, chiefComplaint: e.target.value }))}
                        placeholder="e.g. Follow-up blood pressure monitoring"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Clinical Observations
                      </label>
                      <textarea
                        rows={3}
                        value={notes.clinicalObservations}
                        onChange={(e) =>
                          setNotes((p) => ({ ...p, clinicalObservations: e.target.value }))
                        }
                        placeholder="Record symptoms, home vitals reported, and video assessment..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Assessment &amp; Follow-Up Plan
                      </label>
                      <textarea
                        rows={2}
                        value={notes.followUpPlan}
                        onChange={(e) => setNotes((p) => ({ ...p, followUpPlan: e.target.value }))}
                        placeholder="Next review timeline, red-flag advice, investigations..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    {notesFeedback && (
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                        {notesFeedback}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {notesSavedAt
                          ? `Saved ${new Date(notesSavedAt).toLocaleTimeString('en-IN')}`
                          : 'Not saved yet'}
                      </span>
                      <Button type="submit" size="sm" variant="outline" disabled={isSavingNotes}>
                        {isSavingNotes ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1" />
                        )}
                        Save Notes
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Patient Connection & Privacy Tips */}
              {portalRole === 'PATIENT' && (
                <Card className="p-5 space-y-2.5">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                    <span>Privacy &amp; Call Guidance</span>
                  </h2>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Sit in a well-lit, quiet room with stable Wi-Fi or 4G/5G connectivity.</li>
                    <li>• Keep recent prescriptions and lab reports ready to discuss.</li>
                    <li>• Low bandwidth? Tap <strong>Audio-Only</strong> anytime to maintain clear voice quality.</li>
                    <li>• Your video session is encrypted end-to-end in transit and never recorded.</li>
                  </ul>
                </Card>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default VideoConsultationRoom;

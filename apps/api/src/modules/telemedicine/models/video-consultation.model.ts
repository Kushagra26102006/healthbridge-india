import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type VideoConsultationStatus =
  | 'SCHEDULED'
  | 'WAITING_ROOM'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type VideoConsultationMode = 'VIDEO' | 'AUDIO_ONLY';
export type VideoProviderMode = 'WEBRTC_DIRECT' | 'LIVEKIT';

export interface IVideoConsultationConsent {
  granted: boolean;
  grantedAt?: Date;
  consentVersion: string;
  emergencyDisclaimerAcknowledged: boolean;
  ipHash?: string;
}

export interface IVideoConsultationNotes {
  chiefComplaint?: string;
  clinicalObservations?: string;
  summary?: string;
  followUpPlan?: string;
  updatedAt?: Date;
  updatedBy?: Types.ObjectId;
}

export interface IVideoTechnicalMetrics {
  reconnectCount: number;
  failureCount: number;
  lastFailureCode?: string;
  lastFailureCategory?: string;
  audioFallbackUsed: boolean;
  durationSeconds?: number;
}

export interface IVideoConsultationDocument extends Document {
  appointmentId: Types.ObjectId;
  roomName: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  encounterId?: Types.ObjectId;
  provider: VideoProviderMode;
  status: VideoConsultationStatus;
  mode: VideoConsultationMode;
  recordingEnabled: boolean;
  patientConsent: IVideoConsultationConsent;
  patientInWaitingRoom: boolean;
  doctorInWaitingRoom: boolean;
  patientJoinedAt?: Date;
  doctorJoinedAt?: Date;
  patientLeftAt?: Date;
  doctorLeftAt?: Date;
  activePatientSessionId?: string;
  activeDoctorSessionId?: string;
  consultationNotes: IVideoConsultationNotes;
  technicalMetrics: IVideoTechnicalMetrics;
  startedAt?: Date;
  endedAt?: Date;
  endedByRole?: 'PATIENT' | 'DOCTOR' | 'SYSTEM';
  createdAt: Date;
  updatedAt: Date;
}

const VideoConsultationSchema = new Schema<IVideoConsultationDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
    /**
     * Opaque cryptographic room identifier (e.g. hb-vc-9a3f7c...).
     * MUST NEVER contain patient name, doctor name, diagnosis, or PHI.
     */
    roomName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: 'Encounter',
    },
    provider: {
      type: String,
      enum: ['WEBRTC_DIRECT', 'LIVEKIT'],
      default: 'WEBRTC_DIRECT',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'SCHEDULED',
        'WAITING_ROOM',
        'CONNECTING',
        'CONNECTED',
        'RECONNECTING',
        'COMPLETED',
        'CANCELLED',
        'FAILED',
      ],
      default: 'SCHEDULED',
      index: true,
    },
    mode: {
      type: String,
      enum: ['VIDEO', 'AUDIO_ONLY'],
      default: 'VIDEO',
    },
    recordingEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    patientConsent: {
      granted: { type: Boolean, default: false },
      grantedAt: { type: Date },
      consentVersion: { type: String, default: 'HB-TELEMED-V1' },
      emergencyDisclaimerAcknowledged: { type: Boolean, default: false },
      ipHash: { type: String, trim: true },
    },
    patientInWaitingRoom: { type: Boolean, default: false },
    doctorInWaitingRoom: { type: Boolean, default: false },
    patientJoinedAt: { type: Date },
    doctorJoinedAt: { type: Date },
    patientLeftAt: { type: Date },
    doctorLeftAt: { type: Date },
    activePatientSessionId: { type: String, trim: true },
    activeDoctorSessionId: { type: String, trim: true },
    consultationNotes: {
      chiefComplaint: { type: String, trim: true, maxlength: 1000 },
      clinicalObservations: { type: String, trim: true, maxlength: 4000 },
      summary: { type: String, trim: true, maxlength: 4000 },
      followUpPlan: { type: String, trim: true, maxlength: 2000 },
      updatedAt: { type: Date },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    technicalMetrics: {
      reconnectCount: { type: Number, default: 0, min: 0 },
      failureCount: { type: Number, default: 0, min: 0 },
      lastFailureCode: { type: String, trim: true, maxlength: 80 },
      lastFailureCategory: { type: String, trim: true, maxlength: 80 },
      audioFallbackUsed: { type: Boolean, default: false },
      durationSeconds: { type: Number, min: 0 },
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    endedByRole: { type: String, enum: ['PATIENT', 'DOCTOR', 'SYSTEM'] },
  },
  {
    timestamps: true,
    collection: 'videoConsultations',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

VideoConsultationSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
VideoConsultationSchema.index({ patientId: 1, status: 1, createdAt: -1 });
VideoConsultationSchema.index({ status: 1, createdAt: -1 });

export const VideoConsultationModel: Model<IVideoConsultationDocument> =
  (mongoose.models.VideoConsultation as Model<IVideoConsultationDocument>) ||
  mongoose.model<IVideoConsultationDocument>('VideoConsultation', VideoConsultationSchema);

/**
 * Ephemeral WebRTC Signaling Relay Message (auto-purged via MongoDB TTL after 1 hour).
 * Stores ONLY encrypted-transport SDP/ICE technical negotiation payloads, never clinical PHI.
 */
export interface IVideoSignalMessageDocument extends Document {
  consultationId: Types.ObjectId;
  roomName: string;
  senderId: Types.ObjectId;
  senderRole: 'PATIENT' | 'DOCTOR';
  recipientId: Types.ObjectId;
  signalType: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MEDIA_STATE' | 'HANGUP';
  payload: Record<string, unknown>;
  createdAt: Date;
}

const VideoSignalMessageSchema = new Schema<IVideoSignalMessageDocument>(
  {
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'VideoConsultation',
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['PATIENT', 'DOCTOR'],
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    signalType: {
      type: String,
      enum: ['OFFER', 'ANSWER', 'ICE_CANDIDATE', 'MEDIA_STATE', 'HANGUP'],
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600, // Auto-expire ephemeral WebRTC signaling after 1 hour
    },
  },
  {
    collection: 'videoSignalMessages',
  }
);

VideoSignalMessageSchema.index({ consultationId: 1, recipientId: 1, createdAt: 1 });

export const VideoSignalMessageModel: Model<IVideoSignalMessageDocument> =
  (mongoose.models.VideoSignalMessage as Model<IVideoSignalMessageDocument>) ||
  mongoose.model<IVideoSignalMessageDocument>('VideoSignalMessage', VideoSignalMessageSchema);

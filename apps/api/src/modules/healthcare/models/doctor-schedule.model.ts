import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IWorkingWindow {
  start: string;
  end: string;
}

export interface IBreakInterval {
  start: string;
  end: string;
  label?: string;
}

export interface IDaySchedule {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  isEnabled: boolean;
  workingWindows: IWorkingWindow[];
  breaks: IBreakInterval[];
  slotDurationMinutes: number;
  bufferMinutes: number;
  consultationModes: ('IN_PERSON' | 'TELECONSULTATION')[];
}

export interface IConsultationTypeConfig {
  type: 'IN_PERSON' | 'TELECONSULTATION' | 'FOLLOW_UP';
  name: string;
  isEnabled: boolean;
  durationMinutes: number;
  facilityId?: Types.ObjectId;
  fee?: number;
  bufferMinutes: number;
  description?: string;
}

export interface IBlockedDate {
  _id: Types.ObjectId;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  reason: string;
  createdAt: Date;
}

export interface IScheduleOverride {
  _id: Types.ObjectId;
  date: string;
  isWorkingDay: boolean;
  reason: string;
  workingWindows: IWorkingWindow[];
  breaks: IBreakInterval[];
  createdAt: Date;
}

export interface IDoctorScheduleDocument extends Document {
  doctorId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  timezone: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  weeklySchedule: IDaySchedule[];
  consultationTypes: IConsultationTypeConfig[];
  blockedDates: IBlockedDate[];
  overrides: IScheduleOverride[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkingWindowSchema = new Schema<IWorkingWindow>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const BreakIntervalSchema = new Schema<IBreakInterval>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String, trim: true, default: 'Scheduled Break' },
  },
  { _id: false }
);

const DayScheduleSchema = new Schema<IDaySchedule>(
  {
    day: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true,
    },
    isEnabled: { type: Boolean, default: true },
    workingWindows: { type: [WorkingWindowSchema], default: [] },
    breaks: { type: [BreakIntervalSchema], default: [] },
    slotDurationMinutes: { type: Number, default: 30, min: 10, max: 120 },
    bufferMinutes: { type: Number, default: 5, min: 0, max: 60 },
    consultationModes: {
      type: [String],
      enum: ['IN_PERSON', 'TELECONSULTATION'],
      default: ['IN_PERSON', 'TELECONSULTATION'],
    },
  },
  { _id: false }
);

const ConsultationTypeConfigSchema = new Schema<IConsultationTypeConfig>(
  {
    type: {
      type: String,
      enum: ['IN_PERSON', 'TELECONSULTATION', 'FOLLOW_UP'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    isEnabled: { type: Boolean, default: true },
    durationMinutes: { type: Number, required: true, default: 30 },
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
    fee: { type: Number, min: 0, default: 500 },
    bufferMinutes: { type: Number, default: 5, min: 0, max: 60 },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const BlockedDateSchema = new Schema<IBlockedDate>(
  {
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    isAllDay: { type: Boolean, default: true },
    startTime: { type: String },
    endTime: { type: String },
    reason: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ScheduleOverrideSchema = new Schema<IScheduleOverride>(
  {
    date: { type: String, required: true },
    isWorkingDay: { type: Boolean, required: true },
    reason: { type: String, required: true, trim: true },
    workingWindows: { type: [WorkingWindowSchema], default: [] },
    breaks: { type: [BreakIntervalSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const DoctorScheduleSchema = new Schema<IDoctorScheduleDocument>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID reference is required for doctor schedule'],
      unique: true,
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      required: true,
      trim: true,
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    bufferMinutes: {
      type: Number,
      default: 5,
      min: 0,
      max: 60,
    },
    weeklySchedule: {
      type: [DayScheduleSchema],
      default: () => [
        {
          day: 'MONDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'TUESDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'WEDNESDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'THURSDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'FRIDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'SATURDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '13:00' }],
          breaks: [],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON'],
        },
        {
          day: 'SUNDAY',
          isEnabled: false,
          workingWindows: [],
          breaks: [],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON'],
        },
      ],
    },
    consultationTypes: {
      type: [ConsultationTypeConfigSchema],
      default: () => [
        {
          type: 'IN_PERSON',
          name: 'In-Person Consultation',
          isEnabled: true,
          durationMinutes: 30,
          fee: 500,
          bufferMinutes: 5,
          description: 'Standard in-clinic physical examination and consultation',
        },
        {
          type: 'TELECONSULTATION',
          name: 'Video Teleconsultation',
          isEnabled: true,
          durationMinutes: 20,
          fee: 400,
          bufferMinutes: 5,
          description: 'Secure remote audio/video consultation via HealthBridge portal',
        },
        {
          type: 'FOLLOW_UP',
          name: 'Quick Follow-Up',
          isEnabled: true,
          durationMinutes: 15,
          fee: 250,
          bufferMinutes: 5,
          description: 'Post-consultation or lab report review within 14 days of initial visit',
        },
      ],
    },
    blockedDates: {
      type: [BlockedDateSchema],
      default: [],
    },
    overrides: {
      type: [ScheduleOverrideSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'doctorSchedules',
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

DoctorScheduleSchema.index({ doctorId: 1, 'blockedDates.startDate': 1, 'blockedDates.endDate': 1 });
DoctorScheduleSchema.index({ doctorId: 1, 'overrides.date': 1 });

export const DoctorScheduleModel: Model<IDoctorScheduleDocument> =
  (mongoose.models.DoctorSchedule as Model<IDoctorScheduleDocument>) ||
  mongoose.model<IDoctorScheduleDocument>('DoctorSchedule', DoctorScheduleSchema);

export default DoctorScheduleModel;

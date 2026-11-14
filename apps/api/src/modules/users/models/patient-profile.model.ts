import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  Gender,
  AbhaLinkageStatus,
  Address,
  EmergencyContact,
  BloodGroup,
  NotificationPreferencesDto,
} from '@healthbridge/shared-types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@healthbridge/config';

export interface IPatientProfileDocument extends Document {
  userId: Types.ObjectId;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
  profileImage?: string;
  address: Address;
  emergencyContact: EmergencyContact;
  abhaLinkageStatus: AbhaLinkageStatus;
  abhaAddress?: string;
  abhaNumber?: string;
  notificationPreferences?: NotificationPreferencesDto;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<Address>(
  {
    line1: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, 'Invalid 6-digit PIN code'],
    },
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema<EmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid 10-digit mobile number'],
    },
  },
  { _id: false }
);

const ChannelPrefSchema = new Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  { _id: false }
);

const NotificationPreferencesSchema = new Schema(
  {
    appointmentUpdates: {
      type: ChannelPrefSchema,
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES.appointmentUpdates }),
    },
    prescriptionUpdates: {
      type: ChannelPrefSchema,
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES.prescriptionUpdates }),
    },
    labReportAlerts: {
      type: ChannelPrefSchema,
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES.labReportAlerts }),
    },
    consentRequests: {
      type: ChannelPrefSchema,
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES.consentRequests }),
    },
    securityAlerts: {
      type: ChannelPrefSchema,
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES.securityAlerts }),
    },
  },
  { _id: false }
);

const PatientProfileSchema = new Schema<IPatientProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for patient profile'],
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER'],
        message: '{VALUE} is not a valid gender value',
      },
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    profileImage: {
      type: String,
      trim: true,
    },
    address: {
      type: AddressSchema,
      required: [true, 'Residential address is required'],
    },
    emergencyContact: {
      type: EmergencyContactSchema,
      required: [true, 'Emergency contact information is required'],
    },
    abhaLinkageStatus: {
      type: String,
      enum: ['NOT_LINKED', 'LINKED', 'PENDING'],
      default: 'NOT_LINKED',
      index: true,
    },
    abhaAddress: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    abhaNumber: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES }),
    },
  },
  {
    timestamps: true,
    collection: 'patientProfiles',
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

// Composite query index
PatientProfileSchema.index({ abhaLinkageStatus: 1, 'address.state': 1 });

export const PatientProfileModel: Model<IPatientProfileDocument> =
  (mongoose.models.PatientProfile as Model<IPatientProfileDocument>) ||
  mongoose.model<IPatientProfileDocument>('PatientProfile', PatientProfileSchema);

export default PatientProfileModel;

import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '@pg-prepaid/types';

export interface IUserOrganization extends Document {
  userId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  roles: UserRole[];
  isActive: boolean;
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserOrganizationSchema = new Schema<IUserOrganization>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
      index: true,
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.VIEWER],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: {
      type: Date,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
UserOrganizationSchema.index({ userId: 1, orgId: 1 }, { unique: true });
UserOrganizationSchema.index({ userId: 1, isActive: 1 });
UserOrganizationSchema.index({ orgId: 1, isActive: 1 });

export const UserOrganization: Model<IUserOrganization> =
  mongoose.models.UserOrganization ||
  mongoose.model<IUserOrganization>('UserOrganization', UserOrganizationSchema);

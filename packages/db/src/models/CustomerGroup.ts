import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerGroup extends Document {
  orgId: string;
  name: string;
  description?: string;
  color?: string; // Hex color for visual identification
  customerCount: number; // Denormalized count for performance
  createdBy: string; // User ID who created the group
  createdAt: Date;
  updatedAt: Date;
}

const CustomerGroupSchema = new Schema<ICustomerGroup>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3b82f6", // Default blue color
    },
    customerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CustomerGroupSchema.index({ orgId: 1, name: 1 }, { unique: true });

export const CustomerGroup: Model<ICustomerGroup> =
  mongoose.models.CustomerGroup ||
  mongoose.model<ICustomerGroup>("CustomerGroup", CustomerGroupSchema);

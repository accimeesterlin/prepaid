import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIntegration extends Document {
  orgId: string;
  provider:
    | 'dingconnect'
    | 'reloadly'
    | 'zeptomail'
    | 'mailgun'
    | 'sendgrid'
    | 'mailchimp'
    | 'zapier';
  status: 'active' | 'inactive' | 'error';
  environment?: 'sandbox' | 'production';
  isPrimaryEmail?: boolean; // Mark this as the primary email provider for transactional emails
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    clientId?: string;
    clientSecret?: string;
    baseUrl?: string;
    domain?: string; // For Mailgun domain
    fromEmail?: string; // Default from email for email providers
    fromName?: string; // Default from name for email providers
  };
  metadata: {
    lastSync?: Date;
    lastTestSuccess?: Date;
    lastTestError?: string;
    accountBalance?: number;
    accountCurrency?: string;
    emailsSent?: number; // For email providers
    zapUrl?: string; // For Zapier webhook URL
  };
  settings: {
    autoSync: boolean;
    syncInterval: number; // minutes
    webhookUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: [
        'dingconnect',
        'reloadly',
        'zeptomail',
        'mailgun',
        'sendgrid',
        'mailchimp',
        'zapier',
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'error'],
      default: 'inactive',
    },
    environment: {
      type: String,
      required: false,
      enum: ['sandbox', 'production'],
    },
    isPrimaryEmail: {
      type: Boolean,
      default: false,
    },
    credentials: {
      apiKey: {
        type: String,
        select: false, // Don't return by default for security
      },
      apiSecret: {
        type: String,
        select: false,
      },
      clientId: {
        type: String,
        select: false,
      },
      clientSecret: {
        type: String,
        select: false,
      },
      baseUrl: {
        type: String,
      },
      domain: {
        type: String,
      },
      fromEmail: {
        type: String,
      },
      fromName: {
        type: String,
      },
    },
    metadata: {
      lastSync: Date,
      lastTestSuccess: Date,
      lastTestError: String,
      accountBalance: Number,
      accountCurrency: String,
      emailsSent: Number,
      zapUrl: String,
    },
    settings: {
      autoSync: {
        type: Boolean,
        default: false,
      },
      syncInterval: {
        type: Number,
        default: 60, // 1 hour in minutes
      },
      webhookUrl: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
IntegrationSchema.index({ orgId: 1, provider: 1 }, { unique: true });
IntegrationSchema.index({ status: 1 });

export const Integration: Model<IIntegration> =
  mongoose.models.Integration || mongoose.model<IIntegration>('Integration', IntegrationSchema);

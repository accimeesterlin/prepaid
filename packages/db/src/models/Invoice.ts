import mongoose, { Schema, Document } from "mongoose";

export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  VOID = "void",
  UNCOLLECTIBLE = "uncollectible",
}

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface IInvoice extends Document {
  organizationId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;

  // Invoice details
  invoiceNumber: string;
  status: InvoiceStatus;

  // Amounts
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;

  // Line items
  lineItems: IInvoiceLineItem[];

  // Billing period
  periodStart: Date;
  periodEnd: Date;

  // Payment
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;

  // Stripe
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    metadata: Schema.Types.Mixed,
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
      required: true,
      default: 0,
    },
    lineItems: [invoiceLineItemSchema],
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: Date,
    paymentMethod: String,
    stripeInvoiceId: {
      type: String,
      index: true,
    },
    stripePaymentIntentId: String,
    notes: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

// Indexes
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ periodStart: 1, periodEnd: 1 });
invoiceSchema.index({ dueDate: 1 });

// Methods
invoiceSchema.methods.isPaid = function (): boolean {
  return this.status === InvoiceStatus.PAID;
};

invoiceSchema.methods.isOverdue = function (): boolean {
  if (this.isPaid()) return false;
  return new Date() > this.dueDate;
};

invoiceSchema.methods.markAsPaid = function (paymentMethod?: string): void {
  this.status = InvoiceStatus.PAID;
  this.paidAt = new Date();
  this.amountPaid = this.totalAmount;
  this.amountDue = 0;
  if (paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
};

// Static methods
invoiceSchema.statics.generateInvoiceNumber =
  async function (): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Find the last invoice for this month
    const lastInvoice = await this.findOne({
      invoiceNumber: new RegExp(`^INV-${year}${month}`),
    })
      .sort({ invoiceNumber: -1 })
      .limit(1);

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(
        lastInvoice.invoiceNumber.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, "0")}`;
  };

// Pre-save middleware
invoiceSchema.pre("save", function (next) {
  // Calculate totals
  this.subtotal = this.lineItems.reduce((sum, item) => sum + item.amount, 0);
  this.totalAmount = this.subtotal + this.taxAmount;

  if (this.status !== InvoiceStatus.PAID) {
    this.amountDue = this.totalAmount - this.amountPaid;
  }

  next();
});

export const Invoice =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);

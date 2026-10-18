import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { IProduct } from './Product.js';
import type { IShippingAddress } from './User.js';

export type OrderType = 'retail' | 'wholesale';
export type OrderStatus = 'received' | 'processing' | 'roasting' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentMethod = 'net_terms' | 'bank_transfer' | 'credit_card' | 'cod';
export type PaymentStatus = 'pending' | 'terms_approved' | 'paid' | 'failed' | 'refund_pending' | 'refunded';
export type CancellationStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'cancelled';

export interface IOrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface IOrderItem {
  product: Types.ObjectId | IProduct;
  productName: string;
  quantity: number;
  size: string; // e.g., '1kg', '5kg', '10kg', '250g', '500g'
  grind: string;
  unitPrice: number; // Server-authoritative unit price in INR
  lineTotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: Types.ObjectId;
  orderType: OrderType;
  items: IOrderItem[];
  totalKg: number;
  subtotal: number;
  discountTier?: string;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: IShippingAddress & {
    businessName?: string;
    contactName: string;
    phone: string;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;

  // Cancellation Workflow
  cancellationStatus: CancellationStatus;
  cancellationReason?: string;
  cancellationRequestedAt?: Date;
  cancellationDecidedAt?: Date;
  cancellationDecisionReason?: string;
  cancellationDecidedBy?: {
    userId?: Types.ObjectId;
    name: string;
    email: string;
  };
  inventoryRestored: boolean;

  // Returns & Refunds
  returnStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'completed';
  returnReason?: string;
  returnRequestedAt?: Date;
  returnDecidedAt?: Date;
  returnDecisionReason?: string;
  returnDecidedBy?: {
    userId?: Types.ObjectId;
    name: string;
    email: string;
  };
  refundAmount?: number;
  refundReason?: string;
  refundTransactionId?: string;
  refundedAt?: Date;
  refundedBy?: {
    userId?: Types.ObjectId;
    name: string;
    email: string;
  };

  // Fulfillment & Tracking
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  statusHistory: IOrderStatusHistoryItem[];

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: true, trim: true },
    grind: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const OrderShippingAddressSchema = new Schema(
  {
    businessName: { type: String, trim: true },
    contactName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderType: {
      type: String,
      required: true,
      enum: ['retail', 'wholesale'],
      default: 'retail',
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, 'Order must contain at least one item'],
    },
    totalKg: { type: Number, required: true, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discountTier: { type: String, trim: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 5, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: OrderShippingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['net_terms', 'bank_transfer', 'credit_card', 'cod'],
      default: 'net_terms',
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'terms_approved', 'paid', 'failed', 'refund_pending', 'refunded'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['received', 'processing', 'roasting', 'packed', 'dispatched', 'delivered', 'cancelled'],
      default: 'received',
      index: true,
    },
    notes: { type: String, trim: true },

    // Cancellation Workflow
    cancellationStatus: {
      type: String,
      required: true,
      enum: ['none', 'requested', 'approved', 'rejected', 'cancelled'],
      default: 'none',
      index: true,
    },
    cancellationReason: { type: String, trim: true },
    cancellationRequestedAt: { type: Date },
    cancellationDecidedAt: { type: Date },
    cancellationDecisionReason: { type: String, trim: true },
    cancellationDecidedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    inventoryRestored: { type: Boolean, default: false },

    // Returns & Refunds
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
      default: 'none',
      index: true,
    },
    returnReason: { type: String, trim: true },
    returnRequestedAt: { type: Date },
    returnDecidedAt: { type: Date },
    returnDecisionReason: { type: String, trim: true },
    returnDecidedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String, trim: true },
    refundTransactionId: { type: String, trim: true },
    refundedAt: { type: Date },
    refundedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    // Fulfillment & Tracking
    trackingNumber: { type: String, trim: true },
    courierName: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    estimatedDeliveryDate: { type: Date },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, trim: true },
        updatedBy: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

OrderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);


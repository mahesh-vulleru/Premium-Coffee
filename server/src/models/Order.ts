import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { IProduct } from './Product.js';
import type { IShippingAddress } from './User.js';

export type OrderType = 'retail' | 'wholesale';
export type OrderStatus = 'received' | 'processing' | 'roasting' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentMethod = 'net_terms' | 'bank_transfer' | 'credit_card' | 'cod';
export type PaymentStatus = 'pending' | 'terms_approved' | 'paid' | 'failed';

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
      enum: ['pending', 'terms_approved', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['received', 'processing', 'roasting', 'dispatched', 'delivered', 'cancelled'],
      default: 'received',
      index: true,
    },
    notes: { type: String, trim: true },
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


import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type InventoryMovementType =
  | 'manual_adjustment'
  | 'retail_order'
  | 'wholesale_order'
  | 'restock'
  | 'reconciliation';

export interface IInventoryLog extends Document {
  productId: Types.ObjectId;
  productName: string;
  previousStock: number;
  newStock: number;
  quantityChange: number;
  type: InventoryMovementType;
  reason: string;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  actor: {
    userId?: Types.ObjectId;
    name: string;
    email: string;
    role: string;
  };
  timestamp: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true, trim: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    quantityChange: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ['manual_adjustment', 'retail_order', 'wholesale_order', 'restock', 'reconciliation'],
      index: true,
    },
    reason: { type: String, required: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: { type: String, trim: true },
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      role: { type: String, required: true, default: 'admin' },
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
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

InventoryLogSchema.index({ productId: 1, timestamp: -1 });

export const InventoryLog: Model<IInventoryLog> = mongoose.model<IInventoryLog>(
  'InventoryLog',
  InventoryLogSchema
);


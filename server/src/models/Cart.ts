import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { IProduct } from './Product.js';

export interface ICartItem {
  product: Types.ObjectId | IProduct;
  quantity: number;
  grind: string;
  size: string;
  frequency?: string;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    grind: {
      type: String,
      required: true,
      enum: ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew', 'Commercial Bulk Grind'],
      default: 'Whole Bean',
    },
    size: {
      type: String,
      required: true,
      enum: ['250g', '500g', '1kg', '5kg', '10kg'],
      default: '250g',
    },
    frequency: {
      type: String,
      enum: ['2_weeks', '3_weeks', '4_weeks'],
    },
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [CartItemSchema],
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

export const Cart: Model<ICart> = mongoose.model<ICart>('Cart', CartSchema);


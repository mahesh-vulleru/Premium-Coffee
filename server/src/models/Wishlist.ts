import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { IProduct } from './Product.js';

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  products: (Types.ObjectId | IProduct)[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
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

export const Wishlist: Model<IWishlist> = mongoose.model<IWishlist>('Wishlist', WishlistSchema);


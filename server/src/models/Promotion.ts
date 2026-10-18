import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';

export interface IPromotion extends Document {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  isArchived: boolean;
  applicableCategories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    applicableCategories: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const transformed = { ...ret, id: ret._id?.toString() };
        delete (transformed as any)._id;
        delete (transformed as any).__v;
        return transformed;
      },
    },
  }
);

PromotionSchema.index({ code: 1, isActive: 1, isArchived: 1 });

export const Promotion: Model<IPromotion> =
  mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);


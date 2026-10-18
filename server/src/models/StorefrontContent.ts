import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ContentType = 'announcement' | 'banner' | 'promo_card' | 'featured_section';

export interface IStorefrontContent extends Document {
  key: string;
  contentType: ContentType;
  title: string;
  subtitle?: string;
  badge?: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  countdownEndDate?: Date;
  displayOrder: number;
  isActive: boolean;
  isPublished: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontContentSchema = new Schema<IStorefrontContent>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['announcement', 'banner', 'promo_card', 'featured_section'],
      default: 'banner',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    badge: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    linkText: {
      type: String,
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    countdownEndDate: {
      type: Date,
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
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

StorefrontContentSchema.index({ key: 1, isActive: 1, isPublished: 1 });
StorefrontContentSchema.index({ contentType: 1, displayOrder: 1 });

export const StorefrontContent: Model<IStorefrontContent> =
  mongoose.models.StorefrontContent ||
  mongoose.model<IStorefrontContent>('StorefrontContent', StorefrontContentSchema);


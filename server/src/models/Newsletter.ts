import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribedAt: Date;
  updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    source: {
      type: String,
      default: 'footer',
      trim: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
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

export const Newsletter: Model<INewsletter> = mongoose.model<INewsletter>('Newsletter', NewsletterSchema);


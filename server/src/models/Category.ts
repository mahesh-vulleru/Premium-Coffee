import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICategory extends Document {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
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
    isArchived: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
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

CategorySchema.index({ slug: 1, isActive: 1, isArchived: 1 });

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);


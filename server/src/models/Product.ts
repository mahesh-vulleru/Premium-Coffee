import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type CoffeeCategory =
  | 'cappuccino'
  | 'espresso'
  | 'moca'
  | 'latte'
  | 'americano'
  | 'cold_brew'
  | (string & {});

export type RoastLevel = 'Light' | 'Medium' | 'Medium-Dark' | 'Dark';
export type ProductTag = 'new_arrivals' | 'best_sellers' | 'top_rates';

export interface IBrewGuide {
  method: string;
  ratio: string;
  temperature: string;
  grindRecommendation: string;
}

export interface IProduct extends Document {
  id: string;
  name: string;
  subtitle?: string;
  category: CoffeeCategory;
  price: number; // Stored in INR
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  isSale?: boolean;
  saleLabel?: string;
  tag: ProductTag;
  roastLevel: RoastLevel;
  tastingNotes: string[];
  origin: string;
  description: string;
  stockAvailable: number;
  slug?: string;
  isPublished: boolean;
  isArchived: boolean;
  lowStockThreshold: number;
  reservedStock: number;
  promotionPrice?: number;
  promotionStartDate?: Date;
  promotionEndDate?: Date;
  availablePackSizes?: string[];
  grindOptions?: string[];
  brewGuide?: IBrewGuide;
  createdAt: Date;
  updatedAt: Date;
}

const BrewGuideSchema = new Schema<IBrewGuide>(
  {
    method: { type: String, required: true },
    ratio: { type: String, required: true },
    temperature: { type: String, required: true },
    grindRecommendation: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    subtitle: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    image: { type: String, required: true },
    isSale: { type: Boolean, default: false },
    saleLabel: { type: String, trim: true },
    tag: {
      type: String,
      required: true,
      enum: ['new_arrivals', 'best_sellers', 'top_rates'],
      default: 'best_sellers',
      index: true,
    },
    roastLevel: {
      type: String,
      required: true,
      enum: ['Light', 'Medium', 'Medium-Dark', 'Dark'],
      index: true,
    },
    tastingNotes: [{ type: String, trim: true }],
    origin: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    stockAvailable: { type: Number, required: true, default: 20, min: 0 },
    lowStockThreshold: { type: Number, required: true, default: 10, min: 0 },
    reservedStock: { type: Number, required: true, default: 0, min: 0 },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    isPublished: { type: Boolean, required: true, default: true, index: true },
    isArchived: { type: Boolean, required: true, default: false, index: true },
    promotionPrice: { type: Number, min: 0 },
    promotionStartDate: { type: Date },
    promotionEndDate: { type: Date },
    availablePackSizes: {
      type: [String],
      default: ['250g', '500g', '1kg'],
    },
    grindOptions: {
      type: [String],
      default: ['Whole Bean', 'French Press', 'Pour Over', 'Espresso', 'Cold Brew'],
    },
    brewGuide: { type: BrewGuideSchema },
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

ProductSchema.index({ name: 'text', origin: 'text', description: 'text', tastingNotes: 'text' });

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);


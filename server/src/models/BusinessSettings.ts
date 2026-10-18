import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IBusinessSettings extends Document {
  businessName: string;
  tagline: string;
  gstin: string;
  contactEmail: string;
  contactPhone: string;
  roasteryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  wholesaleMoqKg: number;
  orderPrefix: string;
  wholesaleOrderPrefix: string;
  taxPercent: number;
  roasteryCapacityKgPerDay: number;
  updatedAt: Date;
}

const BusinessSettingsSchema = new Schema<IBusinessSettings>(
  {
    businessName: { type: String, required: true, default: 'Firedup Specialty Coffee Roasters' },
    tagline: { type: String, default: 'Ethically Sourced Single-Origins & Micro-Lots' },
    gstin: { type: String, required: true, default: '37AABCF1234F1Z8' },
    contactEmail: { type: String, required: true, default: 'orders@firedupcoffee.com' },
    contactPhone: { type: String, required: true, default: '+91 98765 43210' },
    roasteryAddress: {
      street: { type: String, default: '14 Coffee Board Lane, Indiranagar' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560038' },
      country: { type: String, default: 'India' },
    },
    currency: { type: String, default: 'INR' },
    freeShippingThreshold: { type: Number, default: 999 },
    standardShippingFee: { type: Number, default: 99 },
    wholesaleMoqKg: { type: Number, default: 5 },
    orderPrefix: { type: String, default: 'FD' },
    wholesaleOrderPrefix: { type: String, default: 'WS' },
    taxPercent: { type: Number, default: 5 },
    roasteryCapacityKgPerDay: { type: Number, default: 250 },
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

export const BusinessSettings: Model<IBusinessSettings> = mongoose.model<IBusinessSettings>(
  'BusinessSettings',
  BusinessSettingsSchema
);


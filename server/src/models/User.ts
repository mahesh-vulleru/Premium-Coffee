import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'wholesale' | 'admin';
export type WholesaleStatus = 'pending' | 'approved' | 'rejected';

export interface IShippingAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IWholesaleDetails {
  businessName: string;
  taxId: string;
  businessType: 'cafe' | 'restaurant' | 'office' | 'retailer' | 'hotel' | 'other';
  monthlyVolumeKg: string;
  deliveryAddress: IShippingAddress;
  status: WholesaleStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  shippingAddress?: IShippingAddress;
  wholesaleDetails?: IWholesaleDetails;
  adminSecurityBadge?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'USA' },
  },
  { _id: false }
);

const WholesaleDetailsSchema = new Schema<IWholesaleDetails>(
  {
    businessName: { type: String, required: true, trim: true },
    taxId: { type: String, required: true, trim: true },
    businessType: {
      type: String,
      required: true,
      enum: ['cafe', 'restaurant', 'office', 'retailer', 'hotel', 'other'],
    },
    monthlyVolumeKg: { type: String, required: true, trim: true },
    deliveryAddress: { type: ShippingAddressSchema, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['customer', 'wholesale', 'admin'],
      default: 'customer',
      index: true,
    },
    shippingAddress: { type: ShippingAddressSchema },
    wholesaleDetails: { type: WholesaleDetailsSchema },
    adminSecurityBadge: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

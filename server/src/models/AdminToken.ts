import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAdminToken extends Document {
  token: string;
  department: string;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const AdminTokenSchema = new Schema<IAdminToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true, default: 'Operations' },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const AdminToken: Model<IAdminToken> = mongoose.model<IAdminToken>(
  'AdminToken',
  AdminTokenSchema
);


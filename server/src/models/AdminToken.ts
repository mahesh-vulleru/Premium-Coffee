import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAdminToken extends Document {
  token: string;
  department: string;
  role?: string;
  permissions?: string[];
  invitedEmail?: string;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  expiresAt: Date;
  createdBy?: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  createdAt: Date;
}

const AdminTokenSchema = new Schema<IAdminToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true, default: 'Operations' },
    role: { type: String, default: 'roastery_staff' },
    permissions: [{ type: String }],
    invitedEmail: { type: String, lowercase: true, trim: true },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export const AdminToken: Model<IAdminToken> = mongoose.model<IAdminToken>(
  'AdminToken',
  AdminTokenSchema
);


import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor: {
    userId?: Types.ObjectId;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      role: { type: String, required: true, default: 'admin' },
    },
    action: { type: String, required: true, trim: true, index: true },
    resource: { type: String, required: true, trim: true, index: true },
    resourceId: { type: String, trim: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
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

AuditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>(
  'AuditLog',
  AuditLogSchema
);


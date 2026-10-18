import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type ExpenseCategory =
  | 'green_coffee'
  | 'packaging'
  | 'roastery_utilities'
  | 'logistics'
  | 'marketing'
  | 'equipment_maintenance'
  | 'payroll'
  | 'other';

export type ExpensePaymentMethod =
  | 'bank_transfer'
  | 'credit_card'
  | 'upi'
  | 'cash'
  | 'net_terms';

export interface IExpense extends Document {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number; // Stored in INR
  date: Date;
  paymentMethod: ExpensePaymentMethod;
  vendor?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  recordedBy: {
    userId?: Types.ObjectId;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      required: true,
      enum: [
        'green_coffee',
        'packaging',
        'roastery_utilities',
        'logistics',
        'marketing',
        'equipment_maintenance',
        'payroll',
        'other',
      ],
      index: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: [0.01, 'Expense amount must be positive'] },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['bank_transfer', 'credit_card', 'upi', 'cash', 'net_terms'],
      default: 'bank_transfer',
    },
    vendor: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    recordedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
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

ExpenseSchema.index({ date: -1, category: 1 });

export const Expense: Model<IExpense> = mongoose.model<IExpense>('Expense', ExpenseSchema);


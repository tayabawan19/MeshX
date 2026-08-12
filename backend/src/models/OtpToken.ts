import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpToken extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  purpose: 'signup' | 'reset';
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OtpTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ['signup', 'reset'], default: 'signup' },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IOtpToken>('OtpToken', OtpTokenSchema);

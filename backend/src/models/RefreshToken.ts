import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: string;
  createdAt: Date;
}

const RefreshTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    deviceInfo: { type: String, default: 'Mobile Device' },
  },
  { timestamps: true }
);

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

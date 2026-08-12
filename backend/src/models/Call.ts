import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  callerId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: 'voice' | 'video';
  status: 'missed' | 'completed' | 'declined';
  duration: number; // in seconds
  createdAt: Date;
}

const CallSchema: Schema = new Schema(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['voice', 'video'], default: 'voice' },
    status: { type: String, enum: ['missed', 'completed', 'declined'], default: 'completed' },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICall>('Call', CallSchema);

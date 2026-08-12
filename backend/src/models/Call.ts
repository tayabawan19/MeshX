import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  callerId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: 'voice' | 'video';
  status: 'missed' | 'completed' | 'declined' | 'ongoing';
  channelName: string;
  duration: number;
  createdAt: Date;
}

const CallSchema: Schema = new Schema(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['voice', 'video'], required: true },
    status: { type: String, enum: ['missed', 'completed', 'declined', 'ongoing'], default: 'ongoing' },
    channelName: { type: String, required: true },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICall>('Call', CallSchema);

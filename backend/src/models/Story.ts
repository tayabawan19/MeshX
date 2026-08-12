import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  mediaUrl?: string;
  type: 'image' | 'video' | 'text';
  caption?: string;
  backgroundColor?: string;
  viewedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  expiresAt: Date;
}

const StorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaUrl: { type: String, default: '' },
    type: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
    caption: { type: String, default: '' },
    backgroundColor: { type: String, default: '#4f46e5' },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IStoryView {
  userId: mongoose.Types.ObjectId;
  viewedAt: Date;
}

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  mediaUrl?: string;
  type: 'image' | 'video' | 'text';
  caption?: string;
  backgroundColor?: string;
  visibility: 'contacts' | 'except' | 'only';
  excludedUsers: mongoose.Types.ObjectId[];
  includedUsers: mongoose.Types.ObjectId[];
  viewedBy: IStoryView[];
  createdAt: Date;
  expiresAt: Date;
}

const StorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaUrl: { type: String, default: '' },
    type: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
    caption: { type: String, default: '' },
    backgroundColor: { type: String, default: '#7C3AED' },
    visibility: { type: String, enum: ['contacts', 'except', 'only'], default: 'contacts' },
    excludedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    includedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);

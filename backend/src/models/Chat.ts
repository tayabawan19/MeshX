import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'voice' | 'document';
    createdAt: Date;
  };
  bubbleTheme: {
    sentGradient: [string, string];
    receivedColor: string;
  };
  wallpaper?: string;
  createdAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    groupName: { type: String, default: '' },
    groupAvatar: { type: String, default: '' },
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['text', 'image', 'voice', 'document'], default: 'text' },
      createdAt: { type: Date, default: Date.now },
    },
    bubbleTheme: {
      sentGradient: { type: [String], default: ['#6366f1', '#8b5cf6'] },
      receivedColor: { type: String, default: '#1f2937' },
    },
    wallpaper: { type: String, default: 'default' },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', ChatSchema);

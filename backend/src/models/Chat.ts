import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  groupName?: string;
  groupAvatar?: string;
  groupDescription?: string;
  onlyAdminsCanMessage: boolean;
  onlyAdminsCanEditInfo: boolean;
  inviteCode?: string;
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'voice' | 'document' | 'system';
    createdAt: Date;
  };
  unreadCounts?: Map<string, number>;
  bubbleTheme: {
    sentGradient: [string, string];
    receivedColor: string;
  };
  wallpaper?: string;
  mutedBy: mongoose.Types.ObjectId[];
  archivedBy: mongoose.Types.ObjectId[];
  disappearingDuration?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    groupName: { type: String, default: '' },
    groupAvatar: { type: String, default: '' },
    groupDescription: { type: String, default: '' },
    onlyAdminsCanMessage: { type: Boolean, default: false },
    onlyAdminsCanEditInfo: { type: Boolean, default: false },
    inviteCode: { type: String, sparse: true, index: true },
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['text', 'image', 'voice', 'document', 'system'], default: 'text' },
      createdAt: { type: Date, default: Date.now },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    bubbleTheme: {
      sentGradient: { type: [String], default: ['#7C3AED', '#3B82F6'] },
      receivedColor: { type: String, default: '#1E1E2A' },
    },
    wallpaper: { type: String, default: 'default' },
    mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    disappearingDuration: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', ChatSchema);

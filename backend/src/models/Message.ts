import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IReceipt {
  userId: mongoose.Types.ObjectId;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface IStoryReply {
  storyId?: mongoose.Types.ObjectId;
  mediaUrl?: string;
  caption?: string;
  type?: string;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'voice' | 'document' | 'system';
  text?: string;
  mediaUrl?: string;
  duration?: number;
  replyTo?: mongoose.Types.ObjectId;
  storyReply?: IStoryReply;
  reactions: IReaction[];
  status: 'sent' | 'delivered' | 'read';
  deletedFor: mongoose.Types.ObjectId[];
  isDeletedForEveryone: boolean;
  isEdited: boolean;
  editedAt?: Date;
  isForwarded: boolean;
  forwardCount: number;
  deliveredTo: { userId: mongoose.Types.ObjectId; deliveredAt: Date }[];
  readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'voice', 'document', 'system'], default: 'text' },
    text: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    duration: { type: Number },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    storyReply: {
      storyId: { type: Schema.Types.ObjectId, ref: 'Story' },
      mediaUrl: { type: String, default: '' },
      caption: { type: String, default: '' },
      type: { type: String, default: 'image' },
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeletedForEveryone: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isForwarded: { type: Boolean, default: false },
    forwardCount: { type: Number, default: 0 },
    deliveredTo: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: { type: Date, index: { expires: 0, sparse: true } },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);

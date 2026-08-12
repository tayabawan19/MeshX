import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'voice' | 'document';
  text?: string;
  mediaUrl?: string;
  replyTo?: mongoose.Types.ObjectId;
  reactions: IReaction[];
  status: 'sent' | 'delivered' | 'read';
  duration?: number;
  expiresAt?: Date;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'voice', 'document'], default: 'text' },
    text: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    duration: { type: Number },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    expiresAt: { type: Date, index: { expires: 0, sparse: true } },
  },

  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);

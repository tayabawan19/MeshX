import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  fcmToken?: string;
  contacts: mongoose.Types.ObjectId[];
  privacy: {
    lastSeenVisible: boolean;
    readReceiptsEnabled: boolean;
  };
  blockedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: 'Hey there! I am using MeshX.' },

    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    fcmToken: { type: String, default: '' },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    privacy: {
      lastSeenVisible: { type: Boolean, default: true },
      readReceiptsEnabled: { type: Boolean, default: true },
    },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);


UserSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);



export type MessageType = 'text' | 'image' | 'voice' | 'document';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type CallType = 'voice' | 'video';
export type CallStatus = 'calling' | 'incoming' | 'connected' | 'ended' | 'declined' | 'missed';
export type ChatType = 'direct' | 'group';

export interface UserProfile {
  id?: string;
  _id?: string;
  userId?: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  email: string;
  phone?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: string | number;
  fcmToken?: string;
  privacy?: {
    lastSeenVisible: boolean;
    readReceiptsEnabled: boolean;
  };
  createdAt?: string | number;
}

export interface BubbleTheme {
  sentGradient: [string, string];
  receivedColor: string;
  sentTextColor?: string;
  receivedTextColor?: string;
}

export interface Chat {
  id?: string;
  _id?: string;
  chatId: string;
  type: ChatType;
  participants: (string | UserProfile)[];
  participantProfiles?: UserProfile[];
  otherParticipant?: UserProfile;
  groupName?: string;
  groupAvatar?: string;
  groupAvatarUrl?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    type: MessageType;
    createdAt?: string | number;
    timestamp?: number;
  };
  unreadCount?: number;
  unreadCounts?: Record<string, number>;
  bubbleTheme: BubbleTheme;
  wallpaper?: string;
  isMuted?: boolean;
  isArchived?: boolean;
  disappearingTimerMs?: number;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface ReplyPreview {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
}

export interface Message {
  id: string;
  _id?: string;
  chatId: string;
  senderId: string | UserProfile;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: string;
  audioDuration?: number;
  replyTo?: ReplyPreview | Message | any;
  reactions: Array<{ userId: string; emoji: string }> | Record<string, string>;
  status: MessageStatus;
  createdAt: string | number;
  expiresAt?: string | number;
  isStarred?: boolean;
}

export interface UserStatus {
  id: string;
  _id?: string;
  userId: string | UserProfile;
  userName?: string;
  userAvatar?: string;
  mediaUrl?: string;
  type?: 'image' | 'video' | 'text';
  caption?: string;
  backgroundColor?: string;
  createdAt: string | number;
  expiresAt: string | number;
  viewedBy: (string | UserProfile)[];
}

export interface StoryGroup {
  user: UserProfile;
  stories: UserStatus[];
  hasUnviewed: boolean;
}

export interface CallLog {
  id: string;
  _id?: string;
  callerId: string | UserProfile;
  callerName?: string;
  callerAvatar?: string;
  receiverId: string | UserProfile;
  receiverName?: string;
  receiverAvatar?: string;
  type: CallType;
  status: CallStatus;
  duration: number;
  createdAt?: string | number;
  timestamp?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

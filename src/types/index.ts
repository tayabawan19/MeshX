export type MessageType = 'text' | 'image' | 'voice' | 'document' | 'system';
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
  admins?: (string | UserProfile)[];
  participantProfiles?: UserProfile[];
  otherParticipant?: UserProfile;
  groupName?: string;
  groupAvatar?: string;
  groupAvatarUrl?: string;
  groupDescription?: string;
  onlyAdminsCanMessage?: boolean;
  onlyAdminsCanEditInfo?: boolean;
  inviteCode?: string;
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

export interface StoryReplyPreview {
  storyId?: string;
  mediaUrl?: string;
  caption?: string;
  type?: string;
}

export interface MessageReceipt {
  userId: string | UserProfile;
  deliveredAt?: string | number | Date;
  readAt?: string | number | Date;
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
  duration?: number;
  replyTo?: ReplyPreview | Message | any;
  storyReply?: StoryReplyPreview;
  reactions: Array<{ userId: string; emoji: string }> | Record<string, string>;
  status: MessageStatus;
  deletedFor?: string[];
  isDeletedForEveryone?: boolean;
  isEdited?: boolean;
  editedAt?: string | number;
  isForwarded?: boolean;
  forwardCount?: number;
  deliveredTo?: MessageReceipt[];
  readBy?: MessageReceipt[];
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
  visibility?: 'contacts' | 'except' | 'only';
  excludedUsers?: string[];
  includedUsers?: string[];
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

import { create } from 'zustand';
import { Chat, Message, ReplyPreview, StoryReplyPreview, UserStatus, CallLog, MessageType, UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { apiClient, getSocket } from '../config/api';
import { useAuthStore } from './useAuthStore';
import { agoraService } from '../services/agoraService';
import { e2eeService } from '../services/e2eeService';

interface ActiveCallState {
  callId: string;
  channelName?: string;
  peerId?: string;
  peerName: string;
  peerAvatar: string;
  type: 'voice' | 'video';
  isIncoming: boolean;
  isGroupCall?: boolean;
  participants?: Array<{ id: string; name: string; avatarUrl: string; isMuted?: boolean; isVideoOn?: boolean }>;
  status: 'calling' | 'connected' | 'ended' | 'busy';
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  durationSeconds: number;
}

export interface MediaAutoDownloadSettings {
  photos: 'wifi_cellular' | 'wifi' | 'never';
  videos: 'wifi' | 'never';
  documents: 'wifi' | 'never';
}

interface ChatStoreState {
  chats: Chat[];
  archivedChats: Chat[];
  messages: Record<string, Message[]>;
  statuses: UserStatus[];
  calls: CallLog[];
  activeChatId: string | null;
  typingMap: Record<string, boolean>;
  replyPreview: ReplyPreview | null;
  storyReplyPreview: StoryReplyPreview | null;
  searchQuery: string;
  activeCall: ActiveCallState | null;
  activeMediaViewer: { url: string; type: 'image' | 'video'; title?: string } | null;
  contacts: UserProfile[];
  storyGroups: Array<{ user: UserProfile; stories: any[]; hasUnviewed: boolean }>;
  myStories: any[];
  mediaAutoDownload: MediaAutoDownloadSettings;

  fetchChats: () => Promise<void>;
  fetchArchivedChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  fetchContacts: () => Promise<void>;
  fetchStoriesFeed: () => Promise<void>;
  fetchMyStories: () => Promise<void>;
  postStory: (data: {
    type: 'image' | 'video' | 'text';
    mediaUrl?: string;
    caption?: string;
    backgroundColor?: string;
    visibility?: 'contacts' | 'except' | 'only';
    excludedUsers?: string[];
    includedUsers?: string[];
  }) => Promise<any>;
  viewStoryApi: (storyId: string) => Promise<void>;
  deleteStoryApi: (storyId: string) => Promise<void>;

  setActiveChatId: (chatId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setReplyPreview: (reply: ReplyPreview | null) => void;
  setStoryReplyPreview: (storyReply: StoryReplyPreview | null) => void;
  setMediaAutoDownload: (settings: Partial<MediaAutoDownloadSettings>) => void;

  sendMessage: (
    text: string,
    type?: MessageType,
    mediaUrl?: string,
    extra?: Partial<Message>,
    explicitChatId?: string
  ) => Promise<void>;
  toggleReaction: (chatId: string, messageId: string, emoji: string) => void;
  deleteForEveryone: (chatId: string, messageId: string) => Promise<boolean>;
  deleteForMe: (chatId: string, messageId: string) => Promise<void>;
  editMessage: (chatId: string, messageId: string, text: string) => Promise<boolean>;
  forwardMessages: (messageIds: string[], targetChatIds: string[]) => Promise<boolean>;
  getMessageInfo: (chatId: string, messageId: string) => Promise<any>;
  starMessage: (chatId: string, messageId: string) => void;
  sendTypingStatus: (chatId: string, isTyping: boolean) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  updateChatTheme: (chatId: string, sentGradient: [string, string], receivedColor: string, wallpaper?: string) => void;

  createNewChat: (participantUserId: string) => Promise<string>;
  createNewGroup: (groupName: string, participantIds: string[], groupAvatarUrl?: string, groupDescription?: string) => Promise<string>;
  promoteDemoteAdmin: (chatId: string, targetUserId: string, action: 'promote' | 'demote') => Promise<void>;
  addGroupMembers: (chatId: string, memberIds: string[]) => Promise<void>;
  removeGroupMember: (chatId: string, memberId: string) => Promise<void>;
  leaveGroup: (chatId: string) => Promise<void>;
  updateGroupSettings: (chatId: string, settings: { onlyAdminsCanMessage?: boolean; onlyAdminsCanEditInfo?: boolean }) => Promise<void>;
  updateGroupInfo: (chatId: string, info: { groupName?: string; groupAvatar?: string; groupDescription?: string }) => Promise<void>;
  getGroupInviteLink: (chatId: string) => Promise<string>;
  joinGroupByInviteCode: (inviteCode: string) => Promise<string>;

  muteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;

  startCall: (peerId: string, peerName: string, peerAvatar: string, type: 'voice' | 'video') => void;
  startGroupCall: (chatId: string, groupName: string, type: 'voice' | 'video') => void;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  fetchCallHistory: () => Promise<void>;
  toggleMuteCall: () => void;

  toggleVideoCall: () => void;
  toggleSpeakerCall: () => void;
  toggleCameraFlip: () => void;

  openMediaViewer: (url: string, type: 'image' | 'video', title?: string) => void;
  closeMediaViewer: () => void;

  markStatusViewed: (statusId: string) => void;
  addStatus: (mediaUrl: string, caption?: string) => void;
  setupSocketListeners: () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  chats: [],
  archivedChats: [],
  messages: {},
  statuses: [],
  calls: [],
  activeChatId: null,
  typingMap: {},
  replyPreview: null,
  storyReplyPreview: null,
  searchQuery: '',
  activeCall: null,
  activeMediaViewer: null,
  contacts: [],
  storyGroups: [],
  myStories: [],
  mediaAutoDownload: {
    photos: 'wifi_cellular',
    videos: 'wifi',
    documents: 'wifi',
  },

  fetchChats: async () => {
    try {
      const res = await apiClient.get('/chats');
      if (res.data?.chats) {
        set({ chats: res.data.chats });
      }
    } catch (err) {
      console.warn('[FetchChats Error]', err);
    }
  },

  fetchArchivedChats: async () => {
    try {
      const res = await apiClient.get('/chats/archived');
      if (res.data?.chats) {
        set({ archivedChats: res.data.chats });
        return;
      }
    } catch (err) {
      // Graceful fallback to client-side filter
      const localArchived = get().chats.filter((c) => c.isArchived);
      set({ archivedChats: localArchived });
    }
  },

  fetchMessages: async (chatId) => {
    try {
      const res = await apiClient.get(`/chats/${chatId}/messages`);
      if (res.data?.messages) {
        const decryptedMessages = res.data.messages.map((m: any) => ({
          ...m,
          id: m._id || m.id,
          _id: m._id || m.id,
          reactions: m.reactions || {},
          text: e2eeService.decryptMessage(m.text),
        }));
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: decryptedMessages,
          },
        }));
      }
    } catch (err) {
      console.warn('[FetchMessages Error]', err);
    }
  },

  fetchContacts: async () => {
    try {
      const res = await apiClient.get('/users/contacts');
      if (res.data?.contacts) {
        set({ contacts: res.data.contacts });
      }
    } catch (err) {
      console.warn('[FetchContacts Error]', err);
    }
  },

  setActiveChatId: (chatId) => {
    if (chatId) {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('join_chat', chatId);
        socket.emit('mark_chat_read', { chatId });
      }
      try {
        apiClient.post(`/chats/${chatId}/read`).catch(() => {});
      } catch (e) {}

      get().fetchMessages(chatId);

      set((state) => ({
        activeChatId: chatId,
        replyPreview: null,
        storyReplyPreview: null,
        chats: state.chats.map((c) => {
          const cId = c.chatId || (c as any).id || (c as any)._id;
          return cId === chatId ? { ...c, unreadCount: 0 } : c;
        }),
      }));
    } else {
      set({ activeChatId: null, replyPreview: null, storyReplyPreview: null });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setReplyPreview: (replyPreview) => set({ replyPreview }),
  setStoryReplyPreview: (storyReplyPreview) => set({ storyReplyPreview }),
  setMediaAutoDownload: (settings) =>
    set((state) => ({ mediaAutoDownload: { ...state.mediaAutoDownload, ...settings } })),

  sendMessage: async (text, type = 'text', mediaUrl, extra, explicitChatId) => {
    const { activeChatId, replyPreview, storyReplyPreview, messages, chats } = get();
    const targetChatId = explicitChatId || activeChatId;
    if (!targetChatId) return;

    const currentUserId = (useAuthStore.getState().user as any)?.id || (useAuthStore.getState().user as any)?._id || 'me';

    const targetChat = chats.find(
      (c) => c.chatId === targetChatId || (c as any).id === targetChatId || (c as any)._id === targetChatId
    );

    let outboundText = text;
    if (type === 'text' && text.trim()) {
      // E2EE: If 1:1 direct chat, look up peer's public key and encrypt
      const peerUserId =
        targetChat?.otherParticipant?.id ||
        targetChat?.otherParticipant?._id ||
        (targetChat?.participantProfiles?.find((p) => (p.id || p._id) !== currentUserId) as any)?._id;

      if (peerUserId) {
        const peerPubKey = await e2eeService.getRecipientPublicKey(peerUserId);
        if (peerPubKey) {
          outboundText = e2eeService.encryptMessage(text.trim(), peerPubKey);
        }
      }
    }

    const activeStoryReply =
      extra?.storyReply && (extra.storyReply.storyId || extra.storyReply.mediaUrl || extra.storyReply.caption)
        ? extra.storyReply
        : storyReplyPreview && (storyReplyPreview.storyId || storyReplyPreview.mediaUrl || storyReplyPreview.caption)
        ? storyReplyPreview
        : undefined;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId: targetChatId,
      senderId: currentUserId,
      text: text.trim(),
      type,
      mediaUrl,
      replyTo: replyPreview || undefined,
      storyReply: activeStoryReply,
      reactions: {},
      status: 'sent',
      createdAt: Date.now(),
      ...extra,
    };

    triggerHaptic('light');

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', {
        chatId: targetChatId,
        text: outboundText,
        type,
        mediaUrl,
        duration: extra?.audioDuration || extra?.duration,
        replyTo: replyPreview?.id,
        storyReply: activeStoryReply,
      });
    }

    const chatMsgs = messages[targetChatId] || [];
    const updatedMsgs = [...chatMsgs, newMsg];

    const updatedChats = chats.map((c) => {
      const cId = c.chatId || (c as any).id || c._id;
      if (cId === targetChatId) {
        return {
          ...c,
          lastMessage: {
            text: type === 'voice' ? '🎙️ Voice note' : type === 'image' ? '📷 Photo' : type === 'document' ? '📄 Document' : text,
            senderId: currentUserId,
            createdAt: Date.now(),
            timestamp: Date.now(),
            type,
          },
          updatedAt: Date.now(),
        };
      }
      return c;
    });

    set({
      messages: {
        ...messages,
        [targetChatId]: updatedMsgs,
      },
      chats: updatedChats.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)),
      replyPreview: null,
      storyReplyPreview: null,
    });
  },

  toggleReaction: (chatId, messageId, emoji) => {
    if (!chatId || !messageId) return;
    triggerHaptic('selection');
    const socket = getSocket();
    if (socket) {
      socket.emit('reaction_add', { chatId, messageId, emoji });
    }

    const currentUserId = (useAuthStore.getState().user as any)?.id || (useAuthStore.getState().user as any)?._id || 'me';
    const targetId = String(messageId);

    set((state) => {
      const chatMsgs = state.messages[chatId] || [];
      const updatedMsgs = chatMsgs.map((msg) => {
        const msgId = String(msg.id || msg._id || '');
        if (msgId && msgId === targetId) {
          const currentReactions = { ...(msg.reactions as Record<string, string>) };
          if (currentReactions[currentUserId] === emoji) {
            delete currentReactions[currentUserId];
          } else {
            currentReactions[currentUserId] = emoji;
          }
          return { ...msg, reactions: currentReactions };
        }
        return msg;
      });
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMsgs,
        },
      };
    });
  },

  deleteForEveryone: async (chatId, messageId) => {
    triggerHaptic('medium');
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('delete_message_everyone', { messageId, chatId });
      }
      await apiClient.delete(`/chats/${chatId}/messages/${messageId}/everyone`);

      set((state) => {
        const chatMsgs = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMsgs.map((m) =>
              m.id === messageId || m._id === messageId
                ? { ...m, isDeletedForEveryone: true, text: 'This message was deleted', mediaUrl: '', type: 'text' }
                : m
            ),
          },
        };
      });
      return true;
    } catch (e) {
      console.warn('[DeleteForEveryone Error]', e);
      return false;
    }
  },

  deleteForMe: async (chatId, messageId) => {
    triggerHaptic('medium');
    try {
      apiClient.delete(`/chats/${chatId}/messages/${messageId}/me`).catch(() => {});
      set((state) => {
        const chatMsgs = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMsgs.filter((m) => m.id !== messageId && m._id !== messageId),
          },
        };
      });
    } catch (e) {
      console.warn('[DeleteForMe Error]', e);
    }
  },

  editMessage: async (chatId, messageId, text) => {
    triggerHaptic('light');
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('edit_message', { messageId, chatId, text });
      }
      await apiClient.patch(`/chats/${chatId}/messages/${messageId}`, { text });

      set((state) => {
        const chatMsgs = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMsgs.map((m) =>
              m.id === messageId || m._id === messageId
                ? { ...m, text, isEdited: true, editedAt: Date.now() }
                : m
            ),
          },
        };
      });
      return true;
    } catch (e) {
      console.warn('[EditMessage Error]', e);
      return false;
    }
  },

  forwardMessages: async (messageIds, targetChatIds) => {
    triggerHaptic('medium');
    try {
      await apiClient.post('/chats/forward', { messageIds, targetChatIds });
      await get().fetchChats();
      return true;
    } catch (e) {
      console.error('[ForwardMessages Error]', e);
      return false;
    }
  },

  getMessageInfo: async (chatId, messageId) => {
    try {
      const res = await apiClient.get(`/chats/${chatId}/messages/${messageId}/info`);
      return res.data;
    } catch (e) {
      console.warn('[GetMessageInfo Error]', e);
      return null;
    }
  },

  starMessage: (chatId, messageId) => {
    triggerHaptic('light');
    set((state) => {
      const chatMsgs = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMsgs.map((m) =>
            m.id === messageId || m._id === messageId ? { ...m, isStarred: !m.isStarred } : m
          ),
        },
      };
    });
  },

  sendTypingStatus: (chatId, isTyping) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { chatId });
    }
  },

  setTyping: (chatId, isTyping) => {
    get().sendTypingStatus(chatId, isTyping);
  },

  updateChatTheme: (chatId, sentGradient, receivedColor, wallpaper) => {
    set((state) => ({
      chats: state.chats.map((c) => {
        const cId = c.chatId || (c as any).id || c._id;
        if (cId === chatId) {
          return {
            ...c,
            bubbleTheme: { sentGradient, receivedColor },
            wallpaper: wallpaper !== undefined ? wallpaper : c.wallpaper,
          };
        }
        return c;
      }),
    }));
  },

  createNewChat: async (participantUserId) => {
    try {
      const res = await apiClient.post('/chats/direct', { recipientId: participantUserId });
      if (res.data?.chat) {
        const newChat = res.data.chat;
        const newId = newChat._id || newChat.id || newChat.chatId;
        newChat.chatId = newId;
        set((state) => {
          const filtered = state.chats.filter(
            (c) => (c.chatId || (c as any).id || (c as any)._id) !== newId
          );
          return {
            chats: [newChat, ...filtered],
          };
        });
        return newId;
      }
    } catch (err) {
      console.error('[ChatStore] Create chat error:', err);
    }
    return '';
  },

  createNewGroup: async (groupName, participantIds, groupAvatarUrl, groupDescription) => {
    try {
      const res = await apiClient.post('/chats/group', {
        groupName,
        groupAvatar: groupAvatarUrl,
        groupDescription,
        participantIds,
      });
      if (res.data?.chat) {
        const groupChat = res.data.chat;
        const newId = groupChat._id || groupChat.id || groupChat.chatId;
        groupChat.chatId = newId;
        set((state) => ({
          chats: [groupChat, ...state.chats],
        }));
        return newId;
      }
    } catch (err) {
      console.error('[ChatStore] Create group error:', err);
    }
    return '';
  },

  promoteDemoteAdmin: async (chatId, targetUserId, action) => {
    try {
      await apiClient.post(`/chats/${chatId}/group/admins`, { targetUserId, action });
      await get().fetchChats();
    } catch (e) {
      console.error('[PromoteDemoteAdmin Error]', e);
    }
  },

  addGroupMembers: async (chatId, memberIds) => {
    try {
      await apiClient.post(`/chats/${chatId}/group/members`, { memberIds });
      await get().fetchChats();
      await get().fetchMessages(chatId);
    } catch (e) {
      console.error('[AddGroupMembers Error]', e);
    }
  },

  removeGroupMember: async (chatId, memberId) => {
    try {
      await apiClient.delete(`/chats/${chatId}/group/members/${memberId}`);
      await get().fetchChats();
      await get().fetchMessages(chatId);
    } catch (e) {
      console.error('[RemoveGroupMember Error]', e);
    }
  },

  leaveGroup: async (chatId) => {
    try {
      await apiClient.post(`/chats/${chatId}/group/leave`);
      set((state) => ({
        chats: state.chats.filter((c) => c.chatId !== chatId && (c as any).id !== chatId),
      }));
    } catch (e) {
      console.error('[LeaveGroup Error]', e);
    }
  },

  updateGroupSettings: async (chatId, settings) => {
    try {
      await apiClient.patch(`/chats/${chatId}/group/settings`, settings);
      await get().fetchChats();
    } catch (e) {
      console.error('[UpdateGroupSettings Error]', e);
    }
  },

  updateGroupInfo: async (chatId, info) => {
    try {
      await apiClient.patch(`/chats/${chatId}/group/info`, info);
      await get().fetchChats();
    } catch (e) {
      console.error('[UpdateGroupInfo Error]', e);
    }
  },

  getGroupInviteLink: async (chatId) => {
    try {
      const res = await apiClient.post(`/chats/${chatId}/invite-link`);
      return res.data?.inviteCode || '';
    } catch (e) {
      console.error('[GetGroupInviteLink Error]', e);
      return '';
    }
  },

  joinGroupByInviteCode: async (inviteCode) => {
    try {
      const res = await apiClient.post(`/chats/join/${inviteCode}`);
      if (res.data?.chat) {
        const joinedChat = res.data.chat;
        const newId = joinedChat._id || joinedChat.id || joinedChat.chatId;
        joinedChat.chatId = newId;
        set((state) => ({
          chats: [joinedChat, ...state.chats],
        }));
        return newId;
      }
    } catch (e) {
      console.error('[JoinGroupByInviteCode Error]', e);
    }
    return '';
  },

  muteChat: (chatId) => {
    triggerHaptic('selection');
    const target = get().chats.find((c) => c.chatId === chatId || (c as any).id === chatId);
    const newMuted = !target?.isMuted;
    apiClient.patch(`/chats/${chatId}/mute`, { muted: newMuted }).catch(() => {});
    set((state) => ({
      chats: state.chats.map((c) =>
        c.chatId === chatId || (c as any).id === chatId ? { ...c, isMuted: newMuted } : c
      ),
    }));
  },

  archiveChat: (chatId) => {
    triggerHaptic('medium');
    const target = get().chats.find((c) => c.chatId === chatId || (c as any).id === chatId);
    const newArchived = !target?.isArchived;
    apiClient.patch(`/chats/${chatId}/archive`, { archived: newArchived }).catch(() => {});
    set((state) => ({
      chats: state.chats.map((c) =>
        c.chatId === chatId || (c as any).id === chatId ? { ...c, isArchived: newArchived } : c
      ),
    }));
    get().fetchArchivedChats();
  },

  deleteChat: (chatId) => {
    triggerHaptic('heavy');
    set((state) => ({
      chats: state.chats.filter((c) => c.chatId !== chatId && (c as any).id !== chatId),
    }));
  },

  fetchCallHistory: async () => {
    try {
      const res = await apiClient.get('/calls');
      if (res.data?.calls) {
        set({ calls: res.data.calls });
      }
    } catch (err) {
      console.warn('[FetchCallHistory Error]', err);
    }
  },

  startCall: (peerId, peerName, peerAvatar, type) => {
    triggerHaptic('medium');
    const socket = getSocket();
    if (socket) {
      socket.emit('call_initiate', { receiverId: peerId, type });
    }

    set({
      activeCall: {
        callId: `call_${Date.now()}`,
        peerId,
        peerName,
        peerAvatar,
        type,
        isIncoming: false,
        status: 'calling',
        isMuted: false,
        isVideoEnabled: type === 'video',
        isSpeakerOn: true,
        isFrontCamera: true,
        durationSeconds: 0,
      },
    });
  },

  startGroupCall: (chatId, groupName, type) => {
    triggerHaptic('medium');
    const socket = getSocket();
    if (socket) {
      socket.emit('group_call_initiate', { chatId, type });
    }

    set({
      activeCall: {
        callId: `grp_call_${chatId}_${Date.now()}`,
        peerName: groupName,
        peerAvatar: '',
        type,
        isIncoming: false,
        isGroupCall: true,
        status: 'calling',
        isMuted: false,
        isVideoEnabled: type === 'video',
        isSpeakerOn: true,
        isFrontCamera: true,
        durationSeconds: 0,
      },
    });
  },

  acceptCall: async () => {
    const { activeCall } = get();
    if (!activeCall) return;
    triggerHaptic('success');

    const socket = getSocket();
    if (socket) {
      socket.emit('call_accept', { callId: activeCall.callId });
    }

    const channel = activeCall.channelName || activeCall.callId;
    try {
      await agoraService.initializeAndJoin(channel, activeCall.type);
    } catch (e) {
      console.warn('[CallStore] Agora join error:', e);
    }

    set((state) => ({
      activeCall: state.activeCall ? { ...state.activeCall, status: 'connected', isIncoming: false } : null,
    }));
  },

  declineCall: () => {
    const { activeCall } = get();
    if (!activeCall) return;
    triggerHaptic('error');
    const socket = getSocket();
    if (socket) {
      socket.emit('call_decline', { callId: activeCall.callId });
    }
    agoraService.leaveAndCleanup();
    set({ activeCall: null });
  },

  endCall: () => {
    triggerHaptic('heavy');
    const { activeCall } = get();
    if (activeCall) {
      const socket = getSocket();
      if (socket) {
        socket.emit('call_end', { callId: activeCall.callId, duration: activeCall.durationSeconds || 0 });
      }
      if (activeCall.peerId) {
        apiClient.post('/calls', {
          receiverId: activeCall.peerId,
          type: activeCall.type,
          status: 'completed',
          duration: activeCall.durationSeconds || 0,
          channelName: activeCall.channelName || activeCall.callId,
        }).catch(() => {});
      }
    }
    agoraService.leaveAndCleanup();
    set({ activeCall: null });
    get().fetchCallHistory();
  },

  toggleMuteCall: () => {
    const { activeCall } = get();
    if (!activeCall) return;
    const newMuted = !activeCall.isMuted;
    agoraService.muteLocalAudio(newMuted);
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isMuted: newMuted } } : state));
  },
  toggleVideoCall: () => {
    const { activeCall } = get();
    if (!activeCall) return;
    const newVideo = !activeCall.isVideoEnabled;
    agoraService.setVideoEnabled(newVideo);
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isVideoEnabled: newVideo } } : state));
  },
  toggleSpeakerCall: () => {
    const { activeCall } = get();
    if (!activeCall) return;
    const newSpeaker = !activeCall.isSpeakerOn;
    agoraService.setSpeakerphone(newSpeaker);
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isSpeakerOn: newSpeaker } } : state));
  },
  toggleCameraFlip: () => {
    agoraService.switchCamera();
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isFrontCamera: !state.activeCall.isFrontCamera } } : state));
  },

  openMediaViewer: (url, type, title) => set({ activeMediaViewer: { url, type, title } }),
  closeMediaViewer: () => set({ activeMediaViewer: null }),

  fetchStoriesFeed: async () => {
    try {
      const res = await apiClient.get('/stories/feed');
      if (res.data?.storyGroups) {
        set({ storyGroups: res.data.storyGroups });
      }
    } catch (err) {
      console.warn('[FetchStoriesFeed Error]', err);
    }
  },

  fetchMyStories: async () => {
    try {
      const res = await apiClient.get('/stories/mine');
      if (res.data?.stories) {
        set({ myStories: res.data.stories });
      }
    } catch (err) {
      console.warn('[FetchMyStories Error]', err);
    }
  },

  postStory: async (data) => {
    try {
      const res = await apiClient.post('/stories', data);
      await get().fetchStoriesFeed();
      await get().fetchMyStories();
      return res.data?.story;
    } catch (err: any) {
      console.error('[PostStory Error]', err);
      throw err;
    }
  },

  viewStoryApi: async (storyId: string) => {
    try {
      await apiClient.post(`/stories/${storyId}/view`);
    } catch (err) {
      console.warn('[ViewStoryApi Error]', err);
    }
  },

  deleteStoryApi: async (storyId: string) => {
    try {
      await apiClient.delete(`/stories/${storyId}`);
      await get().fetchMyStories();
      await get().fetchStoriesFeed();
    } catch (err) {
      console.error('[DeleteStoryApi Error]', err);
    }
  },

  markStatusViewed: (statusId) => {
    const currentUserId = (useAuthStore.getState().user as any)?.id || (useAuthStore.getState().user as any)?._id || 'me';
    set((state) => ({
      statuses: state.statuses.map((st) =>
        st.id === statusId && !st.viewedBy.includes(currentUserId)
          ? { ...st, viewedBy: [...st.viewedBy, currentUserId] }
          : st
      ),
    }));
  },

  addStatus: (mediaUrl, caption) => {
    const currentUser = useAuthStore.getState().user;
    const currentUserId = (currentUser as any)?.id || (currentUser as any)?._id || 'me';
    const newStatus: UserStatus = {
      id: `st_${Date.now()}`,
      userId: currentUserId,
      userName: currentUser?.name || 'User',
      userAvatar: currentUser?.avatarUrl || '',
      mediaUrl,
      caption,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 3600 * 1000,
      viewedBy: [],
    };
    set((state) => ({
      statuses: [newStatus, ...state.statuses],
    }));
  },

  setupSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('receive_message');
    socket.off('message_deleted_everyone');
    socket.off('message_edited');
    socket.off('typing_start');
    socket.off('typing_stop');
    socket.off('user_typing');
    socket.off('user_stopped_typing');
    socket.off('message_status_update');
    socket.off('status_updated');
    socket.off('reaction_updated');
    socket.off('chat_read');
    socket.off('call_initiated');
    socket.off('incoming_call');
    socket.off('incoming_group_call');
    socket.off('call_busy');
    socket.off('call_accepted');
    socket.off('call_declined');
    socket.off('call_ended');

    socket.on('receive_message', (message: any) => {
      const cId = message.chatId;
      if (!cId) return;

      const normalizedMsg: Message = {
        id: message._id || message.id,
        _id: message._id,
        chatId: cId,
        senderId:
          typeof message.senderId === 'object'
            ? message.senderId._id || message.senderId.id
            : message.senderId,
        text: e2eeService.decryptMessage(message.text || ''),
        type: message.type || 'text',
        mediaUrl: message.mediaUrl,
        audioDuration: message.duration || message.audioDuration,
        replyTo: message.replyTo,
        storyReply: message.storyReply,
        reactions: message.reactions || {},
        isForwarded: message.isForwarded,
        forwardCount: message.forwardCount,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        isDeletedForEveryone: message.isDeletedForEveryone,
        status: message.status || 'delivered',
        createdAt: message.createdAt ? new Date(message.createdAt).getTime() : Date.now(),
      };

      const currentUserId =
        (useAuthStore.getState().user as any)?.id ||
        (useAuthStore.getState().user as any)?._id ||
        (useAuthStore.getState().user as any)?.userId;

      const senderIdStr =
        typeof message.senderId === 'object'
          ? message.senderId._id || message.senderId.id
          : message.senderId;

      const isFromMe = senderIdStr === currentUserId;

      set((state) => {
        const currentMsgs = state.messages[cId] || [];
        let updatedMsgs: Message[];
        const existsIndex = currentMsgs.findIndex(
          (m) => m.id === normalizedMsg.id || (m as any)._id === normalizedMsg.id
        );
        if (existsIndex !== -1) {
          const newArr = [...currentMsgs];
          newArr[existsIndex] = normalizedMsg;
          updatedMsgs = newArr;
        } else {
          const optimisticIndex = currentMsgs.findIndex(
            (m) =>
              m.id.startsWith('msg_') &&
              m.senderId === normalizedMsg.senderId &&
              (m.type === 'voice' || m.type === 'image' || m.type === 'document'
                ? m.type === normalizedMsg.type
                : m.text === normalizedMsg.text)
          );
          if (optimisticIndex !== -1) {
            const newArr = [...currentMsgs];
            newArr[optimisticIndex] = normalizedMsg;
            updatedMsgs = newArr;
          } else {
            updatedMsgs = [...currentMsgs, normalizedMsg];
          }
        }

        const targetChatIndex = state.chats.findIndex(
          (c) => c.chatId === cId || (c as any).id === cId || (c as any)._id === cId
        );

        let updatedChats = [...state.chats];
        const isActiveChat = state.activeChatId === cId;

        if (targetChatIndex !== -1) {
          const existingChat = state.chats[targetChatIndex];
          const newUnreadCount = isActiveChat || isFromMe
            ? 0
            : (existingChat.unreadCount || 0) + 1;

          const updatedChat: Chat = {
            ...existingChat,
            lastMessage: {
              text:
                normalizedMsg.type === 'voice'
                  ? '🎙️ Voice note'
                  : normalizedMsg.type === 'image'
                  ? '📷 Photo'
                  : normalizedMsg.type === 'document'
                  ? '📄 Document'
                  : normalizedMsg.type === 'system'
                  ? normalizedMsg.text
                  : normalizedMsg.text,
              senderId: senderIdStr,
              createdAt: normalizedMsg.createdAt,
              timestamp: Number(normalizedMsg.createdAt),
              type: normalizedMsg.type,
            },
            unreadCount: newUnreadCount,
            updatedAt: normalizedMsg.createdAt,
          };

          updatedChats.splice(targetChatIndex, 1);
          updatedChats.unshift(updatedChat);
        } else {
          get().fetchChats();
        }

        return {
          messages: {
            ...state.messages,
            [cId]: updatedMsgs,
          },
          chats: updatedChats,
        };
      });

      if (get().activeChatId === cId && !isFromMe) {
        socket.emit('message_read', { messageId: normalizedMsg.id, chatId: cId });
      }
    });

    socket.on('message_deleted_everyone', ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      set((state) => {
        const currentMsgs = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: currentMsgs.map((m) =>
              m.id === messageId || m._id === messageId
                ? { ...m, isDeletedForEveryone: true, text: 'This message was deleted', mediaUrl: '', type: 'text' }
                : m
            ),
          },
        };
      });
    });

    socket.on('message_edited', ({ messageId, chatId, text, isEdited, editedAt }: any) => {
      set((state) => {
        const currentMsgs = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: currentMsgs.map((m) =>
              m.id === messageId || m._id === messageId
                ? { ...m, text, isEdited: true, editedAt: editedAt || Date.now() }
                : m
            ),
          },
        };
      });
    });

    socket.on('reaction_updated', ({ messageId, chatId, reactions }: { messageId: string; chatId: string; reactions: any }) => {
      const targetId = String(messageId);
      set((state) => {
        const currentMsgs = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: currentMsgs.map((m) => {
              const mId = String(m.id || m._id || '');
              return mId && mId === targetId ? { ...m, reactions } : m;
            }),
          },
        };
      });
    });

    socket.on('chat_read', ({ chatId, userId }: { chatId: string; userId: string }) => {
      const currentUserId =
        (useAuthStore.getState().user as any)?.id ||
        (useAuthStore.getState().user as any)?._id ||
        (useAuthStore.getState().user as any)?.userId;

      if (userId === currentUserId) {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.chatId === chatId || (c as any).id === chatId || (c as any)._id === chatId
              ? { ...c, unreadCount: 0 }
              : c
          ),
        }));
      }
    });

    const handleTypingStart = ({ chatId, userId }: { chatId: string; userId?: string }) => {
      const currentUserId =
        (useAuthStore.getState().user as any)?.id ||
        (useAuthStore.getState().user as any)?._id ||
        (useAuthStore.getState().user as any)?.userId;
      if (userId && currentUserId && userId === currentUserId) return;
      set((state) => ({
        typingMap: { ...state.typingMap, [chatId]: true },
      }));
    };

    const handleTypingStop = ({ chatId }: { chatId: string }) => {
      set((state) => ({
        typingMap: { ...state.typingMap, [chatId]: false },
      }));
    };

    socket.on('typing_start', handleTypingStart);
    socket.on('user_typing', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('user_stopped_typing', handleTypingStop);

    const handleStatusUpdate = ({ messageId, chatId, status }: { messageId: string; chatId: string; status: 'sent' | 'delivered' | 'read' }) => {
      set((state) => {
        const currentMsgs = state.messages[chatId] || [];
        const updatedMsgs = currentMsgs.map((m) =>
          m.id === messageId || (m as any)._id === messageId ? { ...m, status } : m
        );
        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMsgs,
          },
        };
      });
    };

    socket.on('message_status_update', handleStatusUpdate);
    socket.on('status_updated', handleStatusUpdate);

    socket.on('call_initiated', (payload: { callId: string; channelName: string; type: 'voice' | 'video' }) => {
      set((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, callId: payload.callId, channelName: payload.channelName }
          : state.activeCall,
      }));
    });

    socket.on('incoming_call', (payload: { callId: string; callerId: string; callerName: string; callerAvatar: string; channelName: string; type: 'voice' | 'video' }) => {
      triggerHaptic('heavy');
      set({
        activeCall: {
          callId: payload.callId,
          channelName: payload.channelName,
          peerId: payload.callerId,
          peerName: payload.callerName,
          peerAvatar: payload.callerAvatar,
          type: payload.type,
          isIncoming: true,
          status: 'calling',
          isMuted: false,
          isVideoEnabled: payload.type === 'video',
          isSpeakerOn: true,
          isFrontCamera: true,
          durationSeconds: 0,
        },
      });
    });

    socket.on('incoming_group_call', (payload: any) => {
      triggerHaptic('heavy');
      set({
        activeCall: {
          callId: payload.channelName,
          channelName: payload.channelName,
          peerName: payload.groupName,
          peerAvatar: payload.callerAvatar || '',
          type: payload.type,
          isIncoming: true,
          isGroupCall: true,
          status: 'calling',
          isMuted: false,
          isVideoEnabled: payload.type === 'video',
          isSpeakerOn: true,
          isFrontCamera: true,
          durationSeconds: 0,
        },
      });
    });

    socket.on('call_busy', () => {
      triggerHaptic('error');
      set((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, status: 'busy' }
          : null,
      }));
      setTimeout(() => {
        set({ activeCall: null });
      }, 2500);
    });

    socket.on('call_accepted', async (payload?: { callId?: string; channelName?: string }) => {
      triggerHaptic('success');
      const { activeCall } = get();
      const channel = payload?.channelName || activeCall?.channelName || payload?.callId || activeCall?.callId;

      if (activeCall && channel) {
        try {
          await agoraService.initializeAndJoin(channel, activeCall.type);
        } catch (e) {
          console.warn('[CallStore] Caller agora join error:', e);
        }
      }

      set((state) => ({
        activeCall: state.activeCall
          ? {
              ...state.activeCall,
              callId: payload?.callId || state.activeCall.callId,
              channelName: channel,
              status: 'connected',
              isIncoming: false,
            }
          : null,
      }));
    });

    socket.on('call_declined', () => {
      triggerHaptic('error');
      agoraService.leaveAndCleanup();
      set({ activeCall: null });
    });

    socket.on('call_ended', () => {
      triggerHaptic('light');
      agoraService.leaveAndCleanup();
      set({ activeCall: null });
      get().fetchCallHistory();
    });
  },
}));

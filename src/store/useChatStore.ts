import { create } from 'zustand';
import { Chat, Message, ReplyPreview, UserStatus, CallLog, MessageType, UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { apiClient, getSocket } from '../config/api';
import { useAuthStore } from './useAuthStore';



interface ActiveCallState {
  callId: string;
  peerName: string;
  peerAvatar: string;
  type: 'voice' | 'video';
  isIncoming: boolean;
  status: 'calling' | 'connected' | 'ended';
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  durationSeconds: number;
}

interface ChatStoreState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  statuses: UserStatus[];
  calls: CallLog[];
  activeChatId: string | null;
  typingMap: Record<string, boolean>;
  replyPreview: ReplyPreview | null;
  searchQuery: string;
  activeCall: ActiveCallState | null;
  activeMediaViewer: { url: string; type: 'image' | 'video'; title?: string } | null;
  contacts: UserProfile[];
  storyGroups: Array<{ user: UserProfile; stories: any[]; hasUnviewed: boolean }>;
  myStories: any[];

  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  fetchContacts: () => Promise<void>;
  fetchStoriesFeed: () => Promise<void>;
  fetchMyStories: () => Promise<void>;
  postStory: (data: { type: 'image' | 'video' | 'text'; mediaUrl?: string; caption?: string; backgroundColor?: string }) => Promise<any>;
  viewStoryApi: (storyId: string) => Promise<void>;
  deleteStoryApi: (storyId: string) => Promise<void>;

  setActiveChatId: (chatId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setReplyPreview: (reply: ReplyPreview | null) => void;

  sendMessage: (text: string, type?: MessageType, mediaUrl?: string, extra?: Partial<Message>) => void;
  toggleReaction: (chatId: string, messageId: string, emoji: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  starMessage: (chatId: string, messageId: string) => void;
  sendTypingStatus: (chatId: string, isTyping: boolean) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  updateChatTheme: (chatId: string, sentGradient: [string, string], receivedColor: string, wallpaper?: string) => void;

  createNewChat: (participantUserId: string) => Promise<string>;
  createNewGroup: (groupName: string, participantIds: string[], groupAvatarUrl?: string) => Promise<string>;
  muteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;

  startCall: (peerId: string, peerName: string, peerAvatar: string, type: 'voice' | 'video') => void;
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
  messages: {},
  statuses: [],
  calls: [],
  activeChatId: null,
  typingMap: {},
  replyPreview: null,
  searchQuery: '',
  activeCall: null,
  activeMediaViewer: null,
  contacts: [],
  storyGroups: [],
  myStories: [],

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

  fetchMessages: async (chatId) => {
    try {
      const res = await apiClient.get(`/chats/${chatId}/messages`);
      if (res.data?.messages) {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: res.data.messages,
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
      if (socket) {
        socket.emit('join_chat', chatId);
      }
      get().fetchMessages(chatId);

      set((state) => ({
        activeChatId: chatId,
        replyPreview: null,
        chats: state.chats.map((c) =>
          c.chatId === chatId || (c as any).id === chatId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } else {
      set({ activeChatId: null, replyPreview: null });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setReplyPreview: (replyPreview) => set({ replyPreview }),

  sendMessage: (text, type = 'text', mediaUrl, extra) => {
    const { activeChatId, replyPreview, messages, chats } = get();
    if (!activeChatId) return;

    const currentUserId = (useAuthStore.getState().user as any)?.id || (useAuthStore.getState().user as any)?._id || 'me';

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId: activeChatId,
      senderId: currentUserId,
      text: text.trim(),
      type,
      mediaUrl,
      replyTo: replyPreview || undefined,
      reactions: {},
      status: 'sent',
      createdAt: Date.now(),
      ...extra,
    };

    triggerHaptic('light');

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', {
        chatId: activeChatId,
        text,
        type,
        mediaUrl,
        replyTo: replyPreview?.id,
      });
    }

    const chatMsgs = messages[activeChatId] || [];
    const updatedMsgs = [...chatMsgs, newMsg];

    const updatedChats = chats.map((c) => {
      const cId = c.chatId || (c as any).id || c._id;
      if (cId === activeChatId) {
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
        [activeChatId]: updatedMsgs,
      },
      chats: updatedChats.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)),
      replyPreview: null,
    });
  },

  toggleReaction: (chatId, messageId, emoji) => {
    triggerHaptic('selection');
    const socket = getSocket();
    if (socket) {
      socket.emit('reaction_add', { chatId, messageId, emoji });
    }

    const currentUserId = (useAuthStore.getState().user as any)?.id || (useAuthStore.getState().user as any)?._id || 'me';

    set((state) => {
      const chatMsgs = state.messages[chatId] || [];
      const updatedMsgs = chatMsgs.map((msg) => {
        if (msg.id === messageId || msg._id === messageId) {
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


  deleteMessage: (chatId, messageId) => {

    triggerHaptic('medium');
    set((state) => {
      const chatMsgs = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMsgs.filter((m) => m.id !== messageId && m._id !== messageId),
        },
      };
    });
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
    if (socket) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { chatId });
    }
    set((state) => ({
      typingMap: {
        ...state.typingMap,
        [chatId]: isTyping,
      },
    }));
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
        set((state) => ({
          chats: [newChat, ...state.chats],
        }));
        return newId;
      }
    } catch (err) {
      console.error('[ChatStore] Create chat error:', err);
    }
    return '';
  },

  createNewGroup: async (groupName, participantIds, groupAvatarUrl) => {
    try {
      const res = await apiClient.post('/chats/group', { groupName, groupAvatar: groupAvatarUrl, participantIds });
      if (res.data?.chat) {
        const groupChat = res.data.chat;
        const newId = groupChat._id || groupChat.id;
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

  muteChat: (chatId) => {
    triggerHaptic('selection');
    set((state) => ({
      chats: state.chats.map((c) =>
        c.chatId === chatId || (c as any).id === chatId ? { ...c, isMuted: !c.isMuted } : c
      ),
    }));
  },

  archiveChat: (chatId) => {
    triggerHaptic('medium');
    set((state) => ({
      chats: state.chats.map((c) =>
        c.chatId === chatId || (c as any).id === chatId ? { ...c, isArchived: !c.isArchived } : c
      ),
    }));
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

  acceptCall: async () => {
    const { activeCall } = get();
    if (!activeCall) return;
    triggerHaptic('success');

    const socket = getSocket();
    if (socket) {
      socket.emit('call_accept', { callId: activeCall.callId });
    }

    try {
      await apiClient.post('/calls/token', { channelName: activeCall.callId });
    } catch (e) {}

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
    }
    set({ activeCall: null });
  },


  toggleMuteCall: () =>
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isMuted: !state.activeCall.isMuted } } : state)),
  toggleVideoCall: () =>
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isVideoEnabled: !state.activeCall.isVideoEnabled } } : state)),
  toggleSpeakerCall: () =>
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isSpeakerOn: !state.activeCall.isSpeakerOn } } : state)),
  toggleCameraFlip: () =>
    set((state) => (state.activeCall ? { activeCall: { ...state.activeCall, isFrontCamera: !state.activeCall.isFrontCamera } } : state)),

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

  postStory: async (data: { type: 'image' | 'video' | 'text'; mediaUrl?: string; caption?: string; backgroundColor?: string }) => {

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
    socket.off('typing_start');
    socket.off('typing_stop');
    socket.off('user_typing');
    socket.off('user_stopped_typing');
    socket.off('message_status_update');
    socket.off('status_updated');
    socket.off('reaction_updated');

    socket.on('receive_message', (message: Message) => {
      const chatId = message.chatId;
      set((state) => {
        const currentMsgs = state.messages[chatId] || [];
        const exists = currentMsgs.some((m) => m.id === message.id || (m as any)._id === (message as any)._id);
        const updatedMsgs = exists ? currentMsgs : [...currentMsgs, message];
        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMsgs,
          },
        };
      });
    });

    const handleTypingStart = ({ chatId }: { chatId: string }) => {
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

    socket.off('incoming_call');
    socket.off('call_accepted');
    socket.off('call_declined');
    socket.off('call_ended');

    socket.on('incoming_call', (payload: { callId: string; callerId: string; callerName: string; callerAvatar: string; channelName: string; type: 'voice' | 'video' }) => {
      triggerHaptic('heavy');
      set({
        activeCall: {
          callId: payload.callId,
          peerName: payload.callerName,
          peerAvatar: payload.callerAvatar,
          type: payload.type,
          isIncoming: true,
          status: 'calling',
          isMuted: false,
          isVideoEnabled: payload.type === 'video',
          isSpeakerOn: false,
          isFrontCamera: true,
          durationSeconds: 0,
        },
      });
    });

    socket.on('call_accepted', () => {
      triggerHaptic('success');
      set((state) => ({
        activeCall: state.activeCall ? { ...state.activeCall, status: 'connected', isIncoming: false } : null,
      }));
    });

    socket.on('call_declined', () => {
      triggerHaptic('error');
      set({ activeCall: null });
    });

    socket.on('call_ended', () => {
      triggerHaptic('light');
      set({ activeCall: null });
    });
  },
}));



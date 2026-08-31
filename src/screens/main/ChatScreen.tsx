import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import {
  Phone,
  Video,
  ArrowLeft,
  Trash2,
  Forward,
  Star,
  Copy,
  X,
  MoreVertical,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Avatar } from '../../components/common/Avatar';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInputBar } from '../../components/chat/MessageInputBar';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { ForwardPickerModal } from '../modals/ForwardPickerModal';
import { MessageInfoModal } from '../modals/MessageInfoModal';
import { GroupDetailsModal } from '../modals/GroupDetailsModal';
import { ContactProfileModal } from '../modals/ContactProfileModal';
import { Message } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export const ChatScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    chatId,
    title: initialTitle,
    avatar: initialAvatar,
    isGroup: initialIsGroup,
    userId: initialUserId,
  } = route.params || {};

  const { user } = useAuthStore();
  const { palette } = useThemeStore();
  const {
    chats,
    messages,
    fetchMessages,
    sendMessage,
    typingMap,
    startCall,
    startGroupCall,
    deleteForEveryone,
    deleteForMe,
    starMessage,
  } = useChatStore();

  const currentUserId = user?.id || user?._id || user?.userId || 'usr_me';
  const chat = chats.find(
    (c) => c.chatId === chatId || (c as any).id === chatId || (c as any)._id === chatId
  );

  const isGroup = initialIsGroup !== undefined ? initialIsGroup : chat?.type === 'group';

  const otherParticipant =
    chat?.otherParticipant ||
    (Array.isArray(chat?.participants)
      ? (chat?.participants.find(
          (p: any) =>
            (p?._id ? p._id.toString() : p?.toString()) !== currentUserId.toString()
        ) as any)
      : null);

  const recipientUserId =
    initialUserId ||
    otherParticipant?.id ||
    otherParticipant?._id ||
    (typeof otherParticipant === 'string' ? otherParticipant : null);

  const title =
    initialTitle ||
    (isGroup
      ? chat?.groupName || 'Group'
      : (otherParticipant?.name || 'Contact')) ||
    'Chat';

  const avatar =
    initialAvatar ||
    (isGroup
      ? chat?.groupAvatar || (chat as any)?.groupAvatarUrl
      : otherParticipant?.avatarUrl);

  const isOnline = !isGroup && (otherParticipant?.isOnline ?? true);

  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const isSelectionMode = selectedMessageIds.length > 0;

  const [contextMessage, setContextMessage] = useState<Message | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  // Modals
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [showContactProfileModal, setShowContactProfileModal] = useState(false);

  const chatMessages = messages[chatId] || [];
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

  const handleSendMessage = (
    text: string,
    type: 'text' | 'image' | 'voice' | 'document' | 'system' = 'text',
    mediaUrl?: string
  ) => {
    if (!text.trim() && !mediaUrl) return;

    sendMessage(
      text,
      type,
      mediaUrl,
      {
        replyTo: replyingMessage
          ? {
              id: replyingMessage.id || replyingMessage._id || '',
              text: replyingMessage.text,
              senderId: typeof replyingMessage.senderId === 'string' ? replyingMessage.senderId : (replyingMessage.senderId as any)?._id || 'user',
              senderName: (replyingMessage as any).senderName || 'User',
            }
          : undefined,
      },
      chatId
    );

    setReplyingMessage(null);
    triggerHaptic('light');
  };

  const handleLongPressMessage = (msg: Message) => {
    triggerHaptic('medium');
    setContextMessage(msg);
  };

  const handleToggleSelectMessage = (msgId: string) => {
    triggerHaptic('selection');
    if (selectedMessageIds.includes(msgId)) {
      setSelectedMessageIds(selectedMessageIds.filter((id) => id !== msgId));
    } else {
      setSelectedMessageIds([...selectedMessageIds, msgId]);
    }
  };

  const handleCopyMessage = async (text?: string) => {
    if (text) {
      try {
        await Clipboard.setStringAsync(text);
        triggerHaptic('success');
      } catch (e) {}
    }
    setContextMessage(null);
  };

  const handleDeleteSelected = () => {
    Alert.alert('Delete Messages', `Delete ${selectedMessageIds.length} message(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete for Everyone',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('heavy');
          selectedMessageIds.forEach((id) => deleteForEveryone(chatId, id));
          setSelectedMessageIds([]);
        },
      },
    ]);
  };

  const handleStartCall = (callType: 'voice' | 'video') => {
    triggerHaptic('selection');
    if (isGroup) {
      startGroupCall(chatId, title, callType);
    } else {
      const peerId = recipientUserId || chat?.otherParticipant?.id || chat?.otherParticipant?._id || 'peer_id';
      startCall(peerId, title, avatar || '', callType);
    }
    navigation.navigate('CallModal');
  };

  const handleHeaderPress = () => {
    triggerHaptic('light');
    if (isGroup) {
      setShowGroupDetailsModal(true);
    } else {
      setShowContactProfileModal(true);
    }
  };

  const isOtherTyping = !!typingMap[chatId];

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
      {/* Top Velvet Crimson Gradient Header */}
      <LinearGradient
        colors={['#8E0E2C', '#540F27', '#251025']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top, 12) }]}
      >
        {isSelectionMode ? (
          <View style={styles.selectionBar}>
            <TouchableOpacity onPress={() => setSelectedMessageIds([])} style={styles.headerBtn}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.selectionCount}>{selectedMessageIds.length} selected</Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={() => setShowForwardModal(true)} style={styles.headerBtn}>
                <Forward size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteSelected} style={styles.headerBtn}>
                <Trash2 size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={handleHeaderPress} style={styles.headerTitleArea}>
              <Avatar url={avatar} name={title} size="md" isOnline={isOnline} />
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {isOtherTyping ? 'Typing...' : isGroup ? `${chat?.participants?.length || 2} members` : isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={() => handleStartCall('voice')} style={styles.callIconBtn}>
                <Phone size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleStartCall('video')} style={styles.callIconBtn}>
                <Video size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Messages List Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.chatArea}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id || item._id || String(item.createdAt)}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={15}
          initialNumToRender={20}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => {
            const isMe = (typeof item.senderId === 'string' ? item.senderId : item.senderId?._id) === currentUserId;
            const isSelected = selectedMessageIds.includes(item.id || item._id || '');

            return (
              <MessageBubble
                message={item}
                isMe={isMe}
                isSelected={isSelected}
                onLongPress={() => handleLongPressMessage(item)}
                onPress={() => {
                  if (isSelectionMode) handleToggleSelectMessage(item.id || item._id || '');
                }}
              />
            );
          }}
          ListFooterComponent={isOtherTyping ? <TypingIndicator /> : null}
        />

        {/* Input Bar */}
        <MessageInputBar
          onSendMessage={handleSendMessage}
          replyingMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
        />
      </KeyboardAvoidingView>

      {/* Context Action Sheet Modal */}
      <Modal visible={!!contextMessage} transparent animationType="fade" onRequestClose={() => setContextMessage(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setContextMessage(null)} style={styles.contextModalOverlay}>
          <View style={styles.contextCard}>
            {contextMessage?.text ? (
              <TouchableOpacity
                onPress={() => handleCopyMessage(contextMessage.text)}
                style={styles.contextOption}
              >
                <Copy size={18} color="#1A1A1A" style={{ marginRight: 12 }} />
                <Text style={styles.contextText}>Copy Text</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => {
                if (contextMessage) {
                  starMessage(chatId, contextMessage.id || contextMessage._id || '');
                  triggerHaptic('success');
                }
                setContextMessage(null);
              }}
              style={styles.contextOption}
            >
              <Star size={18} color="#1A1A1A" style={{ marginRight: 12 }} />
              <Text style={styles.contextText}>{contextMessage?.isStarred ? 'Unstar Message' : 'Star Message'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (contextMessage) {
                  setSelectedMessageIds([contextMessage.id || contextMessage._id || '']);
                  setShowForwardModal(true);
                }
                setContextMessage(null);
              }}
              style={styles.contextOption}
            >
              <Forward size={18} color="#1A1A1A" style={{ marginRight: 12 }} />
              <Text style={styles.contextText}>Forward</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowInfoModal(true);
              }}
              style={styles.contextOption}
            >
              <MoreVertical size={18} color="#1A1A1A" style={{ marginRight: 12 }} />
              <Text style={styles.contextText}>Message Details</Text>
            </TouchableOpacity>

            {(contextMessage?.senderId === currentUserId || (contextMessage?.senderId as any)?._id === currentUserId) && (
              <TouchableOpacity
                onPress={() => {
                  if (contextMessage) {
                    deleteForEveryone(chatId, contextMessage.id || contextMessage._id || '');
                    triggerHaptic('heavy');
                  }
                  setContextMessage(null);
                }}
                style={[styles.contextOption, { borderBottomWidth: 0 }]}
              >
                <Trash2 size={18} color="#C62828" style={{ marginRight: 12 }} />
                <Text style={[styles.contextText, { color: '#C62828' }]}>Delete Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modals */}
      <ForwardPickerModal
        visible={showForwardModal}
        messageIds={selectedMessageIds}
        onClose={() => {
          setShowForwardModal(false);
          setSelectedMessageIds([]);
        }}
      />

      <MessageInfoModal
        visible={showInfoModal}
        message={contextMessage}
        chatId={chatId}
        onClose={() => {
          setShowInfoModal(false);
          setContextMessage(null);
        }}
      />

      <GroupDetailsModal
        chat={chat || null}
        onClose={() => setShowGroupDetailsModal(false)}
      />

      <ContactProfileModal
        userId={recipientUserId || null}
        chatId={chatId}
        onClose={() => setShowContactProfileModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  headerBtn: {
    padding: 8,
  },
  selectionCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  contextModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  contextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  contextOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contextText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});

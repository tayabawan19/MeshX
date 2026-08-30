import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Clipboard,
  Alert,
  TextInput,
} from 'react-native';
import {
  ChevronLeft,
  Phone,
  Video,
  ChevronDown,
  CornerUpLeft,
  Copy,
  Star,
  Trash2,
  Clock,
  CornerUpRight,
  Info,
  Edit3,
  CheckSquare,
  X,
} from 'lucide-react-native';
import { Avatar } from '../../components/common/Avatar';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInputBar } from '../../components/chat/MessageInputBar';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { DateDivider } from '../../components/chat/DateDivider';
import { ReactionPicker } from '../../components/chat/ReactionPicker';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Message } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { getSocket } from '../../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageInfoModal } from '../modals/MessageInfoModal';
import { ForwardPickerModal } from '../modals/ForwardPickerModal';
import { GroupDetailsModal } from '../modals/GroupDetailsModal';

interface ChatScreenProps {
  chatId?: string;
  onBack?: () => void;
  onOpenContactProfile?: (userId: string) => void;
  navigation?: any;
  route?: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  chatId: propChatId,
  onBack: propOnBack,
  onOpenContactProfile: propOnOpenContactProfile,
  navigation,
  route,
}) => {
  const chatId = propChatId || route?.params?.chatId;
  const onBack = propOnBack || (() => navigation?.goBack());
  const onOpenContactProfile =
    propOnOpenContactProfile ||
    ((uId: string) => navigation?.navigate('UserProfileModal', { userId: uId }));

  const { palette } = useThemeStore();
  const { user } = useAuthStore();
  const {
    chats,
    messages,
    typingMap,
    sendMessage,
    setTyping,
    setActiveChatId,
    setReplyPreview,
    toggleReaction,
    deleteForEveryone,
    deleteForMe,
    editMessage,
    starMessage,
    startCall,
    startGroupCall,
  } = useChatStore();

  const flatListRef = useRef<FlatList>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [disappearingEnabled] = useState(false);

  // Multi-Select Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  // Modals
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState('');

  const seenMessageIds = useRef<Set<string>>(new Set());
  const initialRenderDone = useRef(false);

  useEffect(() => {
    if (chatId) {
      setActiveChatId(chatId);
    }
    return () => {
      setActiveChatId(null);
    };
  }, [chatId]);

  const currentChat = chats.find(
    (c) => c.chatId === chatId || (c as any).id === chatId || (c as any)._id === chatId
  );
  const chatMessages = messages[chatId] || [];

  const reversedMessages = React.useMemo(() => {
    return [...chatMessages].reverse();
  }, [chatMessages]);

  useEffect(() => {
    if (chatMessages.length > 0 && !initialRenderDone.current) {
      chatMessages.forEach((m) => {
        const id = m.id || m._id;
        if (id) seenMessageIds.current.add(id);
      });
      initialRenderDone.current = true;
    }
  }, [chatMessages]);

  const currentUserId = user?.id || user?._id || user?.userId;
  const isGroup = currentChat?.type === 'group';

  const recipient =
    currentChat?.otherParticipant ||
    (currentChat?.participantProfiles && currentChat.participantProfiles.length > 0
      ? currentChat.participantProfiles.find((p) => (p.id || p._id || p.userId) !== currentUserId) ||
        currentChat.participantProfiles[0]
      : Array.isArray(currentChat?.participants)
      ? (currentChat.participants.find(
          (p: any) => typeof p === 'object' && (p._id || p.id || p.userId) !== currentUserId
        ) as any)
      : null);

  const headerName = isGroup ? (currentChat?.groupName || 'Group') : (recipient?.name || 'MeshX Chat');
  const headerAvatar = isGroup ? (currentChat?.groupAvatar || currentChat?.groupAvatarUrl) : recipient?.avatarUrl;
  const isOnline = !isGroup && !!recipient?.isOnline;
  const recUserId = recipient?.id || recipient?._id || recipient?.userId || 'usr_peer';

  const isTyping = typingMap[chatId] || false;

  const handleSendTextMessage = (text: string) => {
    triggerHaptic('light');
    sendMessage(text, 'text', undefined, undefined, chatId);
    scrollToBottom();
  };

  const handleSendMediaMessage = (type: 'image' | 'voice' | 'document', mediaUrl: string, extra?: any) => {
    triggerHaptic('medium');
    sendMessage('', type, mediaUrl, extra, chatId);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowJumpToBottom(offsetY > 300);
  };

  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowActionSheet(true);
  };

  const toggleSelectMessage = (message: Message) => {
    triggerHaptic('selection');
    const msgId = message.id || (message as any)._id || '';
    if (selectedMessageIds.includes(msgId)) {
      const next = selectedMessageIds.filter((id) => id !== msgId);
      setSelectedMessageIds(next);
      if (next.length === 0) {
        setIsSelectionMode(false);
      }
    } else {
      setSelectedMessageIds([...selectedMessageIds, msgId]);
    }
  };

  const handleAddReaction = (emoji: string) => {
    if (selectedMessage) {
      const mId = selectedMessage._id || selectedMessage.id;
      if (mId) {
        toggleReaction(chatId, mId, emoji);
      }
    }
    setShowActionSheet(false);
  };

  const handleReplyMessage = () => {
    if (selectedMessage) {
      const sName =
        selectedMessage.senderId === currentUserId
          ? 'You'
          : (selectedMessage.senderId as any)?.name || recipient?.name || 'User';
      const sId = typeof selectedMessage.senderId === 'string' ? selectedMessage.senderId : (selectedMessage.senderId as any)?._id || 'unknown';
      setReplyPreview({
        id: selectedMessage.id,
        text: selectedMessage.text || `[${selectedMessage.type}]`,
        senderName: sName,
        senderId: sId,
      });
    }
    setShowActionSheet(false);
  };

  const handleCopyMessage = () => {
    if (selectedMessage && selectedMessage.text) {
      Clipboard.setString(selectedMessage.text);
      triggerHaptic('light');
    }
    setShowActionSheet(false);
  };

  const handleOpenEdit = () => {
    if (selectedMessage && selectedMessage.text) {
      setEditText(selectedMessage.text);
      setShowActionSheet(false);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedMessage && editText.trim()) {
      editMessage(chatId, selectedMessage.id, editText.trim());
      triggerHaptic('success');
      setShowEditModal(false);
    }
  };

  const handleOpenForwardSingle = () => {
    setShowActionSheet(false);
    setShowForwardPicker(true);
  };

  const handleOpenMessageInfo = () => {
    setShowActionSheet(false);
    setShowMessageInfo(true);
  };

  const handleDeletePrompt = () => {
    if (!selectedMessage) return;
    const msgId = selectedMessage.id;
    const isMe =
      selectedMessage.senderId === currentUserId ||
      (selectedMessage.senderId as any)?._id === currentUserId;

    const oneHourMs = 60 * 60 * 1000;
    const isWithin1Hour = Date.now() - Number(selectedMessage.createdAt) <= oneHourMs;

    const buttons: any[] = [
      {
        text: 'Delete for me',
        onPress: () => {
          deleteForMe(chatId, msgId);
          setShowActionSheet(false);
        },
      },
    ];

    if (isMe && isWithin1Hour) {
      buttons.push({
        text: 'Delete for everyone',
        style: 'destructive',
        onPress: () => {
          deleteForEveryone(chatId, msgId);
          setShowActionSheet(false);
        },
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Delete Message', 'Choose deletion option:', buttons);
  };

  const handleStarMsg = () => {
    if (selectedMessage) {
      starMessage(chatId, selectedMessage.id);
    }
    setShowActionSheet(false);
  };

  const handleStartSelection = () => {
    if (selectedMessage) {
      const msgId = selectedMessage.id || (selectedMessage as any)._id || '';
      setSelectedMessageIds([msgId]);
      setIsSelectionMode(true);
    }
    setShowActionSheet(false);
  };

  const handleBulkDelete = () => {
    Alert.alert('Delete Messages', `Delete ${selectedMessageIds.length} selected messages?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete for me',
        onPress: () => {
          selectedMessageIds.forEach((id) => deleteForMe(chatId, id));
          setIsSelectionMode(false);
          setSelectedMessageIds([]);
        },
      },
    ]);
  };

  const handleBulkStar = () => {
    selectedMessageIds.forEach((id) => starMessage(chatId, id));
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const handleBulkForward = () => {
    setShowForwardPicker(true);
  };

  const handleHeaderPress = () => {
    if (isGroup) {
      setShowGroupDetails(true);
    } else {
      onOpenContactProfile(recUserId);
    }
  };

  const handleVoiceCall = () => {
    if (isGroup) {
      startGroupCall(chatId, headerName, 'voice');
    } else {
      startCall(recUserId, headerName, headerAvatar || '', 'voice');
    }
    if (navigation) navigation.navigate('CallModal');
  };

  const handleVideoCall = () => {
    if (isGroup) {
      startGroupCall(chatId, headerName, 'video');
    } else {
      startCall(recUserId, headerName, headerAvatar || '', 'video');
    }
    if (navigation) navigation.navigate('CallModal');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const socket = getSocket();
    if (!socket) return;
    const currentId = user?.id || user?._id || user?.userId || 'usr_me';

    viewableItems.forEach(({ item }) => {
      if (item) {
        const sId = typeof item.senderId === 'string' ? item.senderId : (item.senderId as any)?._id;
        if (sId && sId !== currentId && item.status !== 'read') {
          const msgId = item.id || item._id;
          socket.emit('message_read', { messageId: msgId, chatId });
        }
      }
    });
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const insets = useSafeAreaInsets();

  const selectedMsgSenderId = selectedMessage
    ? typeof selectedMessage.senderId === 'string'
      ? selectedMessage.senderId
      : (selectedMessage.senderId as any)?._id
    : null;
  const isSelectedMsgMine = selectedMsgSenderId === currentUserId;
  const isSelectedMsgEditable =
    isSelectedMsgMine &&
    selectedMessage?.type === 'text' &&
    !selectedMessage?.isDeletedForEveryone &&
    Date.now() - Number(selectedMessage?.createdAt || 0) <= 15 * 60 * 1000;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Top Header / Multi-Select Action Bar */}
      {isSelectionMode ? (
        <View
          style={[
            styles.selectionHeader,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: palette.surfaceElevated,
              borderBottomColor: palette.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedMessageIds([]);
            }}
            style={styles.backBtn}
          >
            <X size={20} color={palette.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.selectionCount, { color: palette.textPrimary }]}>
            {selectedMessageIds.length} Selected
          </Text>

          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={handleBulkStar} style={styles.actionIconPill}>
              <Star size={16} color={palette.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBulkForward} style={styles.actionIconPill}>
              <CornerUpRight size={16} color={palette.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBulkDelete} style={[styles.actionIconPill, { backgroundColor: palette.error }]}>
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: palette.surfaceElevated,
              borderBottomColor: palette.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: palette.surfaceLight }]}>
            <ChevronLeft size={20} color={palette.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleHeaderPress} style={styles.headerInfo}>
            <Avatar url={headerAvatar} name={headerName} size="sm" isOnline={!!isOnline} />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerName, { color: palette.textPrimary }]} numberOfLines={1}>
                {headerName}
              </Text>
              <Text
                style={[
                  styles.headerStatus,
                  { color: isOnline ? palette.onlineGreen : palette.textMuted },
                ]}
              >
                {isGroup ? `${currentChat?.participants?.length || 2} members` : isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleVoiceCall} style={[styles.actionBtn, { backgroundColor: palette.surfaceLight }]}>
              <Phone size={16} color={palette.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleVideoCall} style={[styles.actionBtn, { backgroundColor: palette.surfaceLight }]}>
              <Video size={16} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Disappearing Messages Notice */}
      {disappearingEnabled && (
        <View style={[styles.disappearingNotice, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Clock size={13} color={palette.textMuted} />
          <Text style={[styles.disappearingText, { color: palette.textSecondary }]}>
            Disappearing messages ON (24 hours).
          </Text>
        </View>
      )}

      {/* Messages List - Inverted FlatList */}
      <FlatList
        ref={flatListRef}
        inverted
        data={reversedMessages}
        keyExtractor={(item) => item.id || item._id || `${item.createdAt}`}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={
          isTyping ? <TypingIndicator senderName={recipient?.name || 'Someone'} /> : null
        }
        renderItem={({ item, index }) => {
          const sId = typeof item.senderId === 'string' ? item.senderId : (item.senderId as any)?._id;
          const isMe = sId === currentUserId || sId === 'usr_me';

          const prevChronologicalMsg = reversedMessages[index + 1];
          const nextChronologicalMsg = reversedMessages[index - 1];

          const isFirstInGroup = !prevChronologicalMsg || prevChronologicalMsg.senderId !== item.senderId;
          const isLastInGroup = !nextChronologicalMsg || nextChronologicalMsg.senderId !== item.senderId;

          const msgTime = Number(item.createdAt) || Date.now();
          const prevMsgTime = prevChronologicalMsg ? Number(prevChronologicalMsg.createdAt) || Date.now() : 0;

          const showDateDivider =
            !prevChronologicalMsg ||
            new Date(msgTime).toDateString() !== new Date(prevMsgTime).toDateString();

          const msgId = item.id || item._id || `${item.createdAt}`;
          const isNew = !seenMessageIds.current.has(msgId) && initialRenderDone.current;
          if (!seenMessageIds.current.has(msgId)) {
            seenMessageIds.current.add(msgId);
          }

          const senderNameDisplay =
            typeof item.senderId === 'object' ? (item.senderId as any).name : undefined;

          return (
            <View>
              {showDateDivider && <DateDivider timestamp={msgTime} />}
              <MessageBubble
                message={item}
                isMe={isMe}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                animateEntrance={isNew}
                senderName={!isMe && isGroup ? senderNameDisplay || recipient?.name : undefined}
                isSelectionMode={isSelectionMode}
                isSelected={selectedMessageIds.includes(msgId)}
                onToggleSelect={toggleSelectMessage}
                onLongPress={handleLongPressMessage}
              />
            </View>
          );
        }}
      />

      {/* Jump to Bottom Button */}
      {showJumpToBottom && (
        <View style={styles.jumpBtnWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={scrollToBottom}
            style={[styles.jumpBtn, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}
          >
            <ChevronDown size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Message Input Bar */}
      <MessageInputBar
        onSendMessage={handleSendTextMessage}
        onSendMedia={handleSendMediaMessage}
        onTyping={(typing) => setTyping(chatId, typing)}
        replyPreview={null}
        setReplyPreview={setReplyPreview}
      />

      {/* Message Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.actionSheetContainer,
              {
                backgroundColor: palette.surfaceElevated,
                borderColor: palette.border,
              },
            ]}
          >
            <ReactionPicker onSelectEmoji={handleAddReaction} />

            <View style={styles.actionGrid}>
              <TouchableOpacity onPress={handleReplyMessage} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <CornerUpLeft size={16} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopyMessage} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <Copy size={16} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Copy</Text>
              </TouchableOpacity>

              {isSelectedMsgEditable && (
                <TouchableOpacity onPress={handleOpenEdit} style={styles.actionItem}>
                  <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                    <Edit3 size={16} color={palette.textPrimary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Edit</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleOpenForwardSingle} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <CornerUpRight size={16} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Forward</Text>
              </TouchableOpacity>

              {isSelectedMsgMine && (
                <TouchableOpacity onPress={handleOpenMessageInfo} style={styles.actionItem}>
                  <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                    <Info size={16} color={palette.textPrimary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Info</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleStarMsg} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <Star size={16} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Star</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleStartSelection} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <CheckSquare size={16} color={palette.textPrimary} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Select</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeletePrompt} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceLight }]}>
                  <Trash2 size={16} color={palette.error} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Inline Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
            <Text style={[styles.editModalTitle, { color: palette.textPrimary }]}>Edit Message</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={[styles.editModalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.inputBackground }]}
              multiline
              autoFocus
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.editModalCancel}>
                <Text style={{ color: palette.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={[styles.editModalSave, { backgroundColor: palette.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Message Info Modal */}
      <MessageInfoModal
        visible={showMessageInfo}
        message={selectedMessage}
        chatId={chatId}
        onClose={() => setShowMessageInfo(false)}
      />

      {/* Forward Picker Modal */}
      <ForwardPickerModal
        visible={showForwardPicker}
        messageIds={
          isSelectionMode && selectedMessageIds.length > 0
            ? selectedMessageIds
            : selectedMessage
            ? [selectedMessage.id || (selectedMessage as any)._id]
            : []
        }
        onClose={() => {
          setShowForwardPicker(false);
          setIsSelectionMode(false);
          setSelectedMessageIds([]);
        }}
      />

      {/* Group Details Modal */}
      <GroupDetailsModal
        visible={showGroupDetails}
        chat={currentChat || null}
        onClose={() => setShowGroupDetails(false)}
        onLeaveGroupSuccess={() => onBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHeader: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  selectionCount: { fontSize: 16, fontWeight: '700' },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIconPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#35373C',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  headerTextContainer: { marginLeft: 8, flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  headerStatus: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disappearingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 6,
  },
  disappearingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesList: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  jumpBtnWrapper: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    zIndex: 10,
  },
  jumpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionItem: {
    alignItems: 'center',
    width: 62,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editModalContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  editModalInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editModalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editModalSave: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

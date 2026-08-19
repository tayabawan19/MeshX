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
  Users,
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
  const [disappearingEnabled, setDisappearingEnabled] = useState(false);

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
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowJumpToBottom(offsetY > 300);
  };

  const handleLongPressMessage = (msg: Message) => {
    if (isSelectionMode) {
      toggleSelectMessage(msg);
    } else {
      setSelectedMessage(msg);
      setShowActionSheet(true);
    }
  };

  const toggleSelectMessage = (msg: Message) => {
    triggerHaptic('selection');
    const msgId = msg.id || msg._id || '';
    if (selectedMessageIds.includes(msgId)) {
      const next = selectedMessageIds.filter((id) => id !== msgId);
      setSelectedMessageIds(next);
      if (next.length === 0) setIsSelectionMode(false);
    } else {
      setSelectedMessageIds([...selectedMessageIds, msgId]);
    }
  };

  const handleAddReaction = (emoji: string) => {
    if (selectedMessage) {
      toggleReaction(chatId, selectedMessage.id, emoji);
      setShowActionSheet(false);
      setSelectedMessage(null);
    }
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
      triggerHaptic('success');
    }
    setShowActionSheet(false);
  };

  const handleReplyMessage = () => {
    if (selectedMessage) {
      triggerHaptic('light');
      const senderIdStr =
        typeof selectedMessage.senderId === 'string'
          ? selectedMessage.senderId
          : (selectedMessage.senderId as any)?._id || '';
      setReplyPreview({
        id: selectedMessage.id,
        text: selectedMessage.text || 'Media message',
        senderId: senderIdStr,
        senderName: senderIdStr === currentUserId ? 'You' : recipient?.name,
      });
    }
    setShowActionSheet(false);
  };

  const handleOpenEdit = () => {
    if (selectedMessage) {
      setEditText(selectedMessage.text || '');
      setShowActionSheet(false);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedMessage && editText.trim()) {
      await editMessage(chatId, selectedMessage.id || (selectedMessage as any)._id, editText.trim());
      setShowEditModal(false);
      setSelectedMessage(null);
    }
  };

  const handleOpenForwardSingle = () => {
    if (selectedMessage) {
      setShowActionSheet(false);
      setShowForwardPicker(true);
    }
  };

  const handleOpenMessageInfo = () => {
    if (selectedMessage) {
      setShowActionSheet(false);
      setShowMessageInfo(true);
    }
  };

  const handleDeletePrompt = () => {
    if (!selectedMessage) return;
    const sId =
      typeof selectedMessage.senderId === 'string'
        ? selectedMessage.senderId
        : (selectedMessage.senderId as any)?._id;
    const isMe = sId === currentUserId;
    const msgId = selectedMessage.id || (selectedMessage as any)._id;

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
            <X size={24} color={palette.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.selectionCount, { color: palette.textPrimary }]}>
            {selectedMessageIds.length} selected
          </Text>

          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={handleBulkStar} style={styles.actionIcon}>
              <Star size={20} color="#E6A868" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBulkForward} style={styles.actionIcon}>
              <CornerUpRight size={20} color={palette.primaryLight} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBulkDelete} style={styles.actionIcon}>
              <Trash2 size={20} color={palette.error} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: palette.surface,
              borderBottomColor: palette.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ChevronLeft size={26} color={palette.textPrimary} />
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
                {isGroup ? `${currentChat?.participants?.length || 2} members • Tap for info` : isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleVoiceCall} style={styles.actionIcon}>
              <Phone size={20} color={palette.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleVideoCall} style={styles.actionIcon}>
              <Video size={22} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Disappearing Messages Notice */}
      {disappearingEnabled && (
        <View style={[styles.disappearingNotice, { backgroundColor: palette.surfaceElevated }]}>
          <Clock size={14} color={palette.primaryLight} />
          <Text style={[styles.disappearingText, { color: palette.textSecondary }]}>
            Disappearing messages are ON (24 hours expiration).
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

      {/* Jump to Bottom Raised Clay Button */}
      {showJumpToBottom && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={scrollToBottom}
          style={[
            styles.jumpBtn,
            {
              backgroundColor: palette.surfaceElevated,
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0,0,0,0.4)',
              borderRightColor: 'rgba(0,0,0,0.25)',
            },
          ]}
        >
          <ChevronDown size={22} color={palette.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Message Input Bar */}
      <MessageInputBar
        onSendMessage={handleSendTextMessage}
        onSendMedia={handleSendMediaMessage}
        onTyping={(typing) => setTyping(chatId, typing)}
      />

      {/* Message Contextual Action Sheet & Emoji Picker Modal */}
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
                borderTopColor: palette.clayHighlight,
                borderLeftColor: palette.clayHighlight,
                borderBottomColor: 'rgba(0,0,0,0.4)',
                borderRightColor: 'rgba(0,0,0,0.25)',
              },
            ]}
          >
            <ReactionPicker onSelectEmoji={handleAddReaction} />

            <View style={styles.actionGrid}>
              <TouchableOpacity onPress={handleReplyMessage} style={styles.actionItem}>
                <CornerUpLeft size={20} color={palette.primaryLight} />
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopyMessage} style={styles.actionItem}>
                <Copy size={20} color={palette.textPrimary} />
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Copy</Text>
              </TouchableOpacity>

              {isSelectedMsgEditable && (
                <TouchableOpacity onPress={handleOpenEdit} style={styles.actionItem}>
                  <Edit3 size={20} color={palette.primaryLight} />
                  <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Edit</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleOpenForwardSingle} style={styles.actionItem}>
                <CornerUpRight size={20} color={palette.primaryLight} />
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Forward</Text>
              </TouchableOpacity>

              {isSelectedMsgMine && (
                <TouchableOpacity onPress={handleOpenMessageInfo} style={styles.actionItem}>
                  <Info size={20} color={palette.textPrimary} />
                  <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Info</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleStarMsg} style={styles.actionItem}>
                <Star size={20} color="#E6A868" />
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Star</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleStartSelection} style={styles.actionItem}>
                <CheckSquare size={20} color={palette.textPrimary} />
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Select</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeletePrompt} style={styles.actionItem}>
                <Trash2 size={20} color={palette.error} />
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
              style={[styles.editModalInput, { color: palette.textPrimary, borderColor: palette.border }]}
              multiline
              autoFocus
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.editModalCancel}>
                <Text style={{ color: palette.textMuted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={[styles.editModalSave, { backgroundColor: palette.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save</Text>
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
  selectionHeader: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  selectionCount: { fontSize: 16, fontWeight: '800' },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtn: { padding: 6 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  headerTextContainer: { marginLeft: 10, flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 11, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { padding: 8, marginLeft: 4 },
  disappearingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  disappearingText: { fontSize: 12, fontWeight: '500' },
  messagesList: { paddingVertical: 12 },
  jumpBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  actionSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  actionItem: { alignItems: 'center', width: '25%', paddingVertical: 10 },
  actionLabel: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContainer: { width: '100%', borderRadius: 24, borderWidth: 1.5, padding: 20 },
  editModalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  editModalInput: { borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  editModalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 },
  editModalCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  editModalSave: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
});

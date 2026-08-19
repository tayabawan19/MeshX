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
import { getContactAccent } from '../../theme/colors';

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
  const assignedAccent = getContactAccent(headerName);

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
      toggleReaction(chatId, selectedMessage.id, emoji);
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
              paddingTop: Math.max(insets.top, 14),
              backgroundColor: palette.secondary, // Electric Lime #C6FF3D
              borderBottomColor: '#000000',
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
            <X size={24} color="#100F17" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={[styles.selectionCount, { color: '#100F17' }]}>
            {selectedMessageIds.length} Selected
          </Text>

          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={handleBulkStar} style={styles.actionIconPill}>
              <Star size={18} color="#100F17" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBulkForward} style={styles.actionIconPill}>
              <CornerUpRight size={18} color="#100F17" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBulkDelete} style={[styles.actionIconPill, { backgroundColor: palette.error }]}>
              <Trash2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 14),
              backgroundColor: palette.background,
              borderBottomColor: '#000000',
            },
          ]}
        >
          <View style={styles.headerBackWrapper}>
            <View style={styles.headerBackShadow} />
            <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
              <ChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleHeaderPress} style={styles.headerInfo}>
            <Avatar url={headerAvatar} name={headerName} size="sm" isOnline={!!isOnline} accentColor={assignedAccent} />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerName, { color: palette.textPrimary }]} numberOfLines={1}>
                {headerName}
              </Text>
              <Text
                style={[
                  styles.headerStatus,
                  { color: isOnline ? palette.secondary : palette.textMuted },
                ]}
              >
                {isGroup ? `${currentChat?.participants?.length || 2} members` : isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <View style={styles.headerActionBtnWrapper}>
              <View style={styles.headerActionBtnShadow} />
              <TouchableOpacity onPress={handleVoiceCall} style={[styles.actionBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
                <Phone size={18} color={palette.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.headerActionBtnWrapper}>
              <View style={styles.headerActionBtnShadow} />
              <TouchableOpacity onPress={handleVideoCall} style={[styles.actionBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
                <Video size={19} color={palette.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Disappearing Messages Notice */}
      {disappearingEnabled && (
        <View style={[styles.disappearingNotice, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
          <Clock size={14} color={palette.secondary} />
          <Text style={[styles.disappearingText, { color: palette.textPrimary }]}>
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

      {/* Jump to Bottom Button with Hard Shadow */}
      {showJumpToBottom && (
        <View style={styles.jumpBtnWrapper}>
          <View style={styles.jumpBtnShadow} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={scrollToBottom}
            style={[styles.jumpBtn, { backgroundColor: palette.secondary, borderColor: '#000000' }]}
          >
            <ChevronDown size={22} color="#100F17" strokeWidth={2.5} />
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
                backgroundColor: palette.surface,
                borderColor: '#000000',
              },
            ]}
          >
            <ReactionPicker onSelectEmoji={handleAddReaction} />

            <View style={styles.actionGrid}>
              <TouchableOpacity onPress={handleReplyMessage} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#2E4BFF', borderColor: '#000000' }]}>
                  <CornerUpLeft size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopyMessage} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
                  <Copy size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Copy</Text>
              </TouchableOpacity>

              {isSelectedMsgEditable && (
                <TouchableOpacity onPress={handleOpenEdit} style={styles.actionItem}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#00F0FF', borderColor: '#000000' }]}>
                    <Edit3 size={18} color="#100F17" />
                  </View>
                  <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Edit</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleOpenForwardSingle} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#C6FF3D', borderColor: '#000000' }]}>
                  <CornerUpRight size={18} color="#100F17" />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Forward</Text>
              </TouchableOpacity>

              {isSelectedMsgMine && (
                <TouchableOpacity onPress={handleOpenMessageInfo} style={styles.actionItem}>
                  <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
                    <Info size={18} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Info</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleStarMsg} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#FFD23F', borderColor: '#000000' }]}>
                  <Star size={18} color="#100F17" />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Star</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleStartSelection} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
                  <CheckSquare size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Select</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeletePrompt} style={styles.actionItem}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#FF4D5E', borderColor: '#000000' }]}>
                  <Trash2 size={18} color="#FFFFFF" />
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
          <View style={[styles.editModalContainer, { backgroundColor: palette.surface, borderColor: '#000000' }]}>
            <Text style={[styles.editModalTitle, { color: palette.textPrimary }]}>Edit Message</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={[styles.editModalInput, { color: palette.textPrimary, borderColor: '#000000', backgroundColor: palette.inputBackground }]}
              multiline
              autoFocus
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.editModalCancel}>
                <Text style={{ color: palette.textMuted, fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={[styles.editModalSave, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Save Changes</Text>
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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 2,
  },
  headerBackWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  headerBackShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectionHeader: {
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 2,
  },
  selectionCount: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIconPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  headerTextContainer: { marginLeft: 10, flex: 1 },
  headerName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  headerStatus: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionBtnWrapper: {
    position: 'relative',
  },
  headerActionBtnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  disappearingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    borderBottomWidth: 1,
  },
  disappearingText: { fontSize: 12, fontWeight: '700' },
  messagesList: { paddingVertical: 12 },
  jumpBtnWrapper: {
    position: 'absolute',
    bottom: 84,
    right: 20,
  },
  jumpBtnShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
  },
  jumpBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  actionSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    padding: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  actionItem: { alignItems: 'center', width: '25%', paddingVertical: 10 },
  actionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: '800' },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContainer: { width: '100%', borderRadius: 24, borderWidth: 2, padding: 20 },
  editModalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, letterSpacing: -0.3 },
  editModalInput: { borderWidth: 2, borderRadius: 16, padding: 14, fontSize: 15, fontWeight: '600', minHeight: 88, textAlignVertical: 'top' },
  editModalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 },
  editModalCancel: { paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  editModalSave: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, borderWidth: 2 },
});

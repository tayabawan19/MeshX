import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Clipboard,
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
  const onOpenContactProfile = propOnOpenContactProfile || ((uId: string) => navigation?.navigate('UserProfileModal', { userId: uId }));

  const { palette } = useThemeStore();
  const { user } = useAuthStore();
  const {
    chats,
    messages,
    typingMap,
    sendMessage,
    setTyping,
    setReplyPreview,
    toggleReaction,
    deleteMessage,
    starMessage,
    startCall,
  } = useChatStore();

  const flatListRef = useRef<FlatList>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [disappearingEnabled, setDisappearingEnabled] = useState(false);

  const currentChat = chats.find((c) => c.chatId === chatId || (c as any).id === chatId);
  const chatMessages = messages[chatId] || [];

  const recipient = currentChat?.participantProfiles && currentChat.participantProfiles.length > 0
    ? currentChat.participantProfiles[0]
    : null;

  const isGroup = currentChat?.type === 'group';
  const headerName = isGroup ? currentChat.groupName : recipient?.name || route?.params?.title || 'Chat';
  const headerAvatar = isGroup ? currentChat.groupAvatarUrl : recipient?.avatarUrl || route?.params?.avatar;
  const isOnline = !isGroup && recipient?.isOnline;
  const isTyping = typingMap[chatId];

  const recUserId = recipient?.id || recipient?._id || recipient?.userId || 'peer';

  const handleSendTextMessage = (text: string) => {
    sendMessage(text, 'text');
    scrollToBottom();
  };

  const handleSendMediaMessage = (type: 'image' | 'voice' | 'document', url: string, extra?: any) => {
    sendMessage(type === 'image' ? 'Photo' : type === 'voice' ? 'Voice note' : 'Document', type, url, extra);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    setShowJumpToBottom(contentHeight - offsetY - layoutHeight > 300);
  };

  const handleLongPressMessage = (msg: Message) => {
    setSelectedMessage(msg);
    setShowActionSheet(true);
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
      const senderIdStr = typeof selectedMessage.senderId === 'string' ? selectedMessage.senderId : (selectedMessage.senderId as any)?._id || '';
      setReplyPreview({
        id: selectedMessage.id,
        text: selectedMessage.text || 'Media message',
        senderId: senderIdStr,
        senderName: senderIdStr === (user?.id || user?._id || user?.userId) ? 'You' : recipient?.name,
      });
    }
    setShowActionSheet(false);
  };

  const handleDeleteMsg = () => {
    if (selectedMessage) {
      deleteMessage(chatId, selectedMessage.id);
    }
    setShowActionSheet(false);
  };

  const handleStarMsg = () => {
    if (selectedMessage) {
      starMessage(chatId, selectedMessage.id);
    }
    setShowActionSheet(false);
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

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={26} color={palette.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOpenContactProfile(recUserId)}
          style={styles.headerInfo}
        >
          <Avatar url={headerAvatar} name={headerName} size="sm" isOnline={!!isOnline} />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerName, { color: palette.textPrimary }]} numberOfLines={1}>
              {headerName}
            </Text>
            <Text style={[styles.headerStatus, { color: isOnline ? palette.onlineGreen : palette.textMuted }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              startCall(recUserId, headerName || 'Call', headerAvatar || '', 'voice');
              if (navigation) navigation.navigate('CallModal');
            }}
            style={styles.actionIcon}
          >
            <Phone size={20} color={palette.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              startCall(recUserId, headerName || 'Call', headerAvatar || '', 'video');
              if (navigation) navigation.navigate('CallModal');
            }}
            style={styles.actionIcon}
          >
            <Video size={22} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Disappearing Messages Notice */}
      {disappearingEnabled && (
        <View style={[styles.disappearingNotice, { backgroundColor: palette.surfaceElevated }]}>
          <Clock size={14} color={palette.primaryLight} />
          <Text style={[styles.disappearingText, { color: palette.textSecondary }]}>
            Disappearing messages are ON (24 hours expiration).
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item, index) => item.id || item._id || `msg_${index}`}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item, index }) => {
          const sId = typeof item.senderId === 'string' ? item.senderId : (item.senderId as any)?._id;
          const currentId = user?.id || user?._id || user?.userId || 'usr_me';
          const isMe = sId === currentId || sId === 'usr_me';

          const prevMsg = chatMessages[index - 1];
          const nextMsg = chatMessages[index + 1];

          const isFirstInGroup = !prevMsg || prevMsg.senderId !== item.senderId;
          const isLastInGroup = !nextMsg || nextMsg.senderId !== item.senderId;

          const msgTime = Number(item.createdAt) || Date.now();
          const prevMsgTime = prevMsg ? Number(prevMsg.createdAt) || Date.now() : 0;

          const showDateDivider =
            index === 0 ||
            new Date(msgTime).toDateString() !== new Date(prevMsgTime).toDateString();

          return (
            <View>
              {showDateDivider && <DateDivider timestamp={msgTime} />}
              <MessageBubble
                message={item}
                isMe={isMe}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                senderName={!isMe && isGroup ? recipient?.name : undefined}
                onLongPress={handleLongPressMessage}
              />
            </View>
          );
        }}
        ListFooterComponent={
          isTyping ? <TypingIndicator senderName={recipient?.name || 'Someone'} /> : null
        }
      />


      {/* Jump to Bottom Floating Action Button */}
      {showJumpToBottom && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={scrollToBottom}
          style={[styles.jumpBtn, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}
        >
          <ChevronDown size={20} color={palette.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Message Input Bar */}
      <MessageInputBar
        onSendMessage={handleSendTextMessage}
        onSendMedia={handleSendMediaMessage}
        onTyping={(typing) => setTyping(chatId, typing)}
      />

      {/* Message Contextual Action Sheet & Emoji Picker Modal */}
      <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={() => setShowActionSheet(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowActionSheet(false)} style={styles.modalOverlay}>
          <View style={[styles.actionSheetContainer, { backgroundColor: palette.surfaceElevated }]}>
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

              <TouchableOpacity onPress={handleStarMsg} style={styles.actionItem}>
                <Star size={20} color="#F59E0B" />
                <Text style={[styles.actionLabel, { color: palette.textPrimary }]}>Star</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDeleteMsg} style={styles.actionItem}>
                <Trash2 size={20} color={palette.error} />
                <Text style={[styles.actionLabel, { color: palette.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  headerTextContainer: { marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { padding: 8, marginLeft: 4 },
  disappearingNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 12, gap: 6 },
  disappearingText: { fontSize: 12, fontWeight: '500' },
  messagesList: { paddingVertical: 12 },
  jumpBtn: { position: 'absolute', bottom: 80, right: 20, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  actionSheetContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 },
  actionItem: { alignItems: 'center', padding: 10 },
  actionLabel: { fontSize: 12, fontWeight: '600', marginTop: 6 },
});

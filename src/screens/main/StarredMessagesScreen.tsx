import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, Star, CornerDownRight } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatMessageTime } from '../../utils/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

export const StarredMessagesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { palette } = useThemeStore();
  const { user } = useAuthStore();
  const { chats, messages, setActiveChatId } = useChatStore();
  const insets = useSafeAreaInsets();

  const currentUserId = user?.id || user?._id || user?.userId || 'usr_me';

  const starredMessagesList = React.useMemo(() => {
    const list: Array<{ message: any; chat: any }> = [];
    Object.entries(messages).forEach(([chatId, msgs]) => {
      const chat = chats.find((c) => c.chatId === chatId || (c as any).id === chatId || (c as any)._id === chatId);
      msgs.forEach((m) => {
        if (m.isStarred) {
          list.push({ message: m, chat });
        }
      });
    });
    return list.sort((a, b) => (Number(b.message.createdAt) || 0) - (Number(a.message.createdAt) || 0));
  }, [messages, chats]);

  const handleJumpToChat = (chatId: string) => {
    triggerHaptic('light');
    setActiveChatId(chatId);
    navigation.navigate('Chat', { chatId });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: palette.surfaceLight }]}
        >
          <ChevronLeft size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Starred Messages</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={starredMessagesList}
        keyExtractor={(item) => item.message.id || item.message._id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const { message, chat } = item;
          const sId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
          const isMe = sId === currentUserId;
          const senderName = isMe ? 'You' : (typeof message.senderId === 'object' ? message.senderId?.name : chat?.otherParticipant?.name || 'Sender');
          const chatTitle = chat?.type === 'group' ? (chat.groupName || 'Group') : (chat?.otherParticipant?.name || 'Chat');

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleJumpToChat(chat?.chatId || message.chatId)}
              style={[
                styles.messageCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.senderName, { color: palette.primary }]}>{senderName}</Text>
                <Text style={[styles.chatTitleBadge, { color: palette.textMuted }]}>in {chatTitle}</Text>
                <Text style={[styles.timestamp, { color: palette.textMuted }]}>
                  {formatMessageTime(Number(message.createdAt) || Date.now())}
                </Text>
              </View>

              <Text style={[styles.messageText, { color: palette.textPrimary }]}>
                {message.text || `[${message.type}]`}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.starredIndicator}>
                  <Star size={13} color={palette.warning} fill={palette.warning} style={{ marginRight: 4 }} />
                  <Text style={[styles.starredText, { color: palette.warning }]}>Starred</Text>
                </View>
                <View style={styles.jumpRow}>
                  <Text style={[styles.jumpText, { color: palette.primary }]}>Go to chat</Text>
                  <CornerDownRight size={13} color={palette.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Star size={40} color={palette.textMuted} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No starred messages</Text>
            <Text style={[styles.emptySub, { color: palette.textMuted }]}>
              Long press on any message in a chat and tap Star to keep it easily accessible here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '700' },
  messageCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  senderName: { fontSize: 13, fontWeight: '600', marginRight: 6 },
  chatTitleBadge: { fontSize: 11, flex: 1 },
  timestamp: { fontSize: 11 },
  messageText: { fontSize: 14, lineHeight: 19, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starredIndicator: { flexDirection: 'row', alignItems: 'center' },
  starredText: { fontSize: 11, fontWeight: '600' },
  jumpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jumpText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: 'center' },
});

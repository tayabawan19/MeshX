import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, Star, CornerDownRight } from 'lucide-react-native';
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

  // Gather all starred messages across all chats
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
            backgroundColor: palette.surface,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Starred Messages</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={starredMessagesList}
        keyExtractor={(item) => item.message.id || item.message._id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const { message, chat } = item;
          const sId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
          const isMe = sId === currentUserId;
          const senderName = isMe ? 'You' : (typeof message.senderId === 'object' ? message.senderId?.name : chat?.otherParticipant?.name || 'Sender');
          const chatTitle = chat?.type === 'group' ? (chat.groupName || 'Group') : (chat?.otherParticipant?.name || 'Chat');

          return (
            <TouchableOpacity
              onPress={() => handleJumpToChat(chat?.chatId || message.chatId)}
              style={[
                styles.messageCard,
                {
                  backgroundColor: palette.surfaceElevated,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.senderName, { color: palette.primaryLight }]}>{senderName}</Text>
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
                  <Star size={14} color="#E6A868" fill="#E6A868" style={{ marginRight: 4 }} />
                  <Text style={[styles.starredText, { color: '#E6A868' }]}>Starred</Text>
                </View>
                <View style={styles.jumpRow}>
                  <Text style={[styles.jumpText, { color: palette.primaryLight }]}>Go to chat</Text>
                  <CornerDownRight size={14} color={palette.primaryLight} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Star size={48} color={palette.textMuted} style={{ marginBottom: 12 }} />
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
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '800' },
  messageCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  senderName: { fontSize: 13, fontWeight: '700', marginRight: 6 },
  chatTitleBadge: { fontSize: 12, flex: 1 },
  timestamp: { fontSize: 11 },
  messageText: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starredIndicator: { flexDirection: 'row', alignItems: 'center' },
  starredText: { fontSize: 11, fontWeight: '700' },
  jumpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jumpText: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center' },
});

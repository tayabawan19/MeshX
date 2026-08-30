import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Header } from '../../components/common/Header';
import { useChatStore } from '../../store/useChatStore';
import { Star, ArrowRight } from 'lucide-react-native';
import { formatMessageTime } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';
import { Message } from '../../types';

export const StarredMessagesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { messages, setActiveChatId } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  // Flatten all messages across all chats that have isStarred === true
  const starredMessagesList: Message[] = [];
  Object.keys(messages).forEach((cId) => {
    (messages[cId] || []).forEach((m) => {
      if (m.isStarred) {
        starredMessagesList.push(m);
      }
    });
  });

  const handleJumpToChat = (chatId: string) => {
    triggerHaptic('light');
    setActiveChatId(chatId);
    navigation.navigate('Chat', { chatId });
  };

  return (
    <View style={styles.container}>
      <Header title="Starred Messages" showBack onBackPress={() => navigation.goBack()} />

      <FlatList
        data={starredMessagesList}
        keyExtractor={(item) => item.id || item._id || ''}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleJumpToChat(item.chatId)}
            style={styles.messageCard}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.senderName}>{(item as any).senderName || 'Contact'}</Text>
              <Text style={styles.timeText}>
                {formatMessageTime(Number(item.createdAt) || Date.now())}
              </Text>
            </View>

            <Text style={styles.messageText}>{item.text || `[${item.type}]`}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.starBadge}>
                <Star size={11} color="#FFD54F" fill="#FFD54F" style={{ marginRight: 4 }} />
                <Text style={styles.starText}>Starred</Text>
              </View>
              <View style={styles.jumpRow}>
                <Text style={styles.jumpText}>Jump to message</Text>
                <ArrowRight size={13} color="#8E0E2C" />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Star size={36} color="#8E0E2C" />
            </View>
            <Text style={styles.emptyTitle}>No starred messages</Text>
            <Text style={styles.emptySubtitle}>
              Tap and hold any message in a conversation to star it and find it quickly here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  listContent: { padding: 14 },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderName: { fontSize: 13, fontWeight: '700', color: '#8E0E2C' },
  timeText: { fontSize: 11, color: '#9E9E9E' },
  messageText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 213, 79, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  starText: { fontSize: 11, fontWeight: '700', color: '#F57F17' },
  jumpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jumpText: { fontSize: 12, fontWeight: '600', color: '#8E0E2C' },
  emptyContainer: { paddingTop: 60, paddingHorizontal: 36, alignItems: 'center' },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#757575', textAlign: 'center', lineHeight: 19 },
});

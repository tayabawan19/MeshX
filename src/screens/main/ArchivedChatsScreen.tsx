import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { ChevronLeft, Archive } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ChatListItem } from '../../components/chats/ChatListItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

export const ArchivedChatsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { palette } = useThemeStore();
  const { user } = useAuthStore();
  const { archivedChats, fetchArchivedChats, archiveChat, deleteChat, setActiveChatId } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchArchivedChats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchArchivedChats();
    setRefreshing(false);
  };

  const handleChatPress = (chatId: string) => {
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
        <Text style={[styles.title, { color: palette.textPrimary }]}>Archived Chats</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Info notice */}
      <View style={[styles.infoBanner, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Archive size={15} color={palette.textMuted} style={{ marginRight: 8 }} />
        <Text style={[styles.infoText, { color: palette.textSecondary }]}>
          These chats stay archived when new messages are received.
        </Text>
      </View>

      {/* Archived Chats List */}
      <FlatList
        data={archivedChats}
        keyExtractor={(item) => item.chatId || (item as any).id || (item as any)._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const cId = item.chatId || (item as any).id || (item as any)._id;
          return (
            <ChatListItem
              chat={item}
              currentUserId={user?.id || user?._id || user?.userId || 'usr_me'}
              onPress={() => handleChatPress(cId)}
              onMute={() => {}}
              onArchive={() => {
                archiveChat(cId);
                fetchArchivedChats();
              }}
              onDelete={() => deleteChat(cId)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Archive size={40} color={palette.textMuted} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No archived chats</Text>
            <Text style={[styles.emptySub, { color: palette.textMuted }]}>
              Swipe left on any conversation in your chats list to archive it.
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: { fontSize: 12, flex: 1 },
  emptyContainer: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: 'center' },
});

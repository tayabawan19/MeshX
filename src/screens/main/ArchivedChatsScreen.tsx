import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, ArchiveRestore, Archive } from 'lucide-react-native';
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
            backgroundColor: palette.surface,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Archived Chats</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Info notice */}
      <View style={[styles.infoBanner, { backgroundColor: palette.surfaceElevated }]}>
        <Archive size={16} color={palette.primaryLight} style={{ marginRight: 8 }} />
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
            <Archive size={48} color={palette.textMuted} style={{ marginBottom: 12 }} />
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
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '800' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, margin: 12, borderRadius: 14 },
  infoText: { fontSize: 12, flex: 1 },
  emptyContainer: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center' },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Header } from '../../components/common/Header';
import { ChatListItem } from '../../components/chats/ChatListItem';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Archive } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

export const ArchivedChatsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { archivedChats, fetchArchivedChats, archiveChat, deleteChat, muteChat, setActiveChatId } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchArchivedChats();
  }, []);

  const handleChatPress = (chatId: string) => {
    triggerHaptic('light');
    setActiveChatId(chatId);
    navigation.navigate('Chat', { chatId });
  };

  return (
    <View style={styles.container}>
      <Header title="Archived Chats" showBack onBackPress={() => navigation.goBack()} />

      <FlatList
        data={archivedChats}
        keyExtractor={(item) => item.chatId || (item as any).id || (item as any)._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const cId = item.chatId || (item as any).id || (item as any)._id;
          return (
            <ChatListItem
              chat={item}
              currentUserId={user?.id || user?._id || 'usr_me'}
              onPress={() => handleChatPress(cId)}
              onMute={() => muteChat(cId)}
              onArchive={() => archiveChat(cId)}
              onDelete={() => deleteChat(cId)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Archive size={36} color="#8E0E2C" />
            </View>
            <Text style={styles.emptyTitle}>No archived chats</Text>
            <Text style={styles.emptySubtitle}>
              Chats you archive will be kept here safely without cluttering your main inbox.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { paddingVertical: 8 },
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Search, Plus, MessageSquare, Archive, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ChatListItem } from '../../components/chats/ChatListItem';
import { StoryAvatarRow } from '../../components/chats/StoryAvatarRow';
import { CreateStoryModal } from '../../screens/modals/CreateStoryModal';
import { StoryViewerModal } from '../../screens/modals/StoryViewerModal';
import { triggerHaptic } from '../../utils/haptics';

export const ChatsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { palette } = useThemeStore();
  const { user } = useAuthStore();
  const {
    chats,
    fetchChats,
    archiveChat,
    deleteChat,
    muteChat,
    setActiveChatId,
    storyGroups,
    myStories,
    fetchStoriesFeed,
    fetchMyStories,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [createStoryModalVisible, setCreateStoryModalVisible] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<any | null>(null);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  useEffect(() => {
    fetchChats();
    fetchStoriesFeed();
    fetchMyStories();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchChats(), fetchStoriesFeed(), fetchMyStories()]);
    setRefreshing(false);
  };

  const handleChatPress = (chatId: string) => {
    triggerHaptic('light');
    setActiveChatId(chatId);
    const selectedChat = chats.find(
      (c) => c.chatId === chatId || (c as any).id === chatId || (c as any)._id === chatId
    );
    navigation.navigate('Chat', {
      chatId,
      isGroup: selectedChat?.type === 'group',
      title:
        selectedChat?.type === 'group'
          ? selectedChat.groupName
          : selectedChat?.otherParticipant?.name,
      avatar:
        selectedChat?.type === 'group'
          ? selectedChat.groupAvatar || (selectedChat as any).groupAvatarUrl
          : selectedChat?.otherParticipant?.avatarUrl,
      userId: selectedChat?.otherParticipant?.id || selectedChat?.otherParticipant?._id,
    });
  };

  const handleCreateChat = () => {
    triggerHaptic('selection');
    navigation.navigate('NewChat');
  };

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (c.type === 'group') {
      return c.groupName?.toLowerCase().includes(query);
    }
    return c.otherParticipant?.name?.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      {/* Top Gradient Header Area */}
      <LinearGradient
        colors={['#8E0E2C', '#540F27', '#251025']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.topGradientArea, { paddingTop: Math.max(insets.top + 8, 20) }]}
      >
        {/* Top App Bar */}
        <View style={styles.topAppBar}>
          <View>
            <Text style={styles.appTitle}>MESHX</Text>
            <Text style={styles.appSubtitle}>Messages</Text>
          </View>

          <TouchableOpacity
            style={styles.archiveNavBtn}
            onPress={() => navigation.navigate('ArchivedChatsScreen')}
          >
            <Archive color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Search size={18} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status / Story Avatars Row */}
        <View style={styles.storyRowWrapper}>
          <StoryAvatarRow
            storyGroups={storyGroups}
            myStories={myStories}
            onCreateStory={() => setCreateStoryModalVisible(true)}
            onOpenStoryGroup={(storyUser, stories, isMine, idx) => {
              setSelectedStoryGroup({ user: storyUser, stories, isMine });
              setInitialStoryIndex(idx || 0);
            }}
          />
        </View>
      </LinearGradient>

      {/* White Curved Container for Chats List */}
      <View style={styles.whiteCardContainer}>
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.chatId || (item as any).id || (item as any)._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8E0E2C"
              colors={['#8E0E2C']}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cId = item.chatId || (item as any).id || (item as any)._id;
            return (
              <ChatListItem
                chat={item}
                currentUserId={user?.id || user?._id || user?.userId || 'usr_me'}
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
                <MessageSquare size={36} color="#8E0E2C" />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button below to start a new direct message or create a group!
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCreateChat}
        style={[
          styles.fabWrapper,
          { bottom: 20 },
        ]}
      >
        <LinearGradient
          colors={['#8E0E2C', '#540F27', '#251025']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Story Modal */}
      <CreateStoryModal
        visible={createStoryModalVisible}
        onClose={() => setCreateStoryModalVisible(false)}
      />

      {/* Story Viewer Modal */}
      <StoryViewerModal
        visible={!!selectedStoryGroup}
        storyGroup={selectedStoryGroup}
        initialIndex={initialStoryIndex}
        onClose={() => setSelectedStoryGroup(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8E0E2C',
  },
  topGradientArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  archiveNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 21,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  storyRowWrapper: {
    marginTop: 2,
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 90,
  },
  emptyContainer: {
    paddingTop: 60,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(142, 14, 44, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 19,
  },
  fabWrapper: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8E0E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

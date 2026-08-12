import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Search, Users, MessageSquarePlus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ChatListItem } from '../../components/chats/ChatListItem';
import { StoryAvatarRow } from '../../components/chats/StoryAvatarRow';
import { ChatListItemSkeleton } from '../../components/common/SkeletonLoader';
import { triggerHaptic } from '../../utils/haptics';
import { CreateStoryModal } from '../modals/CreateStoryModal';
import { StoryViewerModal } from '../modals/StoryViewerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export const ChatsListScreen: React.FC<{
  navigation?: any;
  onSelectChat?: (chatId: string) => void;
  onOpenNewGroup?: () => void;
  onOpenStatusViewer?: (statusId: string) => void;
}> = ({ navigation, onSelectChat, onOpenNewGroup, onOpenStatusViewer }) => {
  const palette = useThemeStore((state) => state.palette);
  const { user } = useAuthStore();
  const {
    chats,
    storyGroups,
    myStories,
    muteChat,
    archiveChat,
    deleteChat,
    fetchChats,
    fetchStoriesFeed,
    fetchMyStories,
    setActiveChatId,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState<{ user: any; stories: any[]; isMine?: boolean } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchChats(), fetchStoriesFeed(), fetchMyStories()]);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    triggerHaptic('light');

    await Promise.all([fetchChats(), fetchStoriesFeed(), fetchMyStories()]);
    setRefreshing(false);
  };

  const handleChatPress = (cId: string) => {
    triggerHaptic('light');
    setActiveChatId(cId);
    if (onSelectChat) {
      onSelectChat(cId);
    } else if (navigation) {
      const found = chats.find((c) => c.chatId === cId || (c as any).id === cId || c._id === cId);
      navigation.navigate('Chat', { chatId: cId, title: found?.groupName || 'Chat' });
    }
  };

  const handleOpenNewChat = () => {
    triggerHaptic('medium');
    if (navigation) {
      navigation.navigate('NewChat');
    }
  };

  const handleOpenGroup = () => {
    triggerHaptic('light');
    if (onOpenNewGroup) {
      onOpenNewGroup();
    } else if (navigation) {
      navigation.navigate('NewGroupModal');
    }
  };

  const handleDeleteChatConfirm = (cId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to remove this chat conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteChat(cId);
          },
        },
      ]
    );
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return !chat.isArchived;
    const q = searchQuery.toLowerCase();
    const isGroupMatch = chat.groupName?.toLowerCase().includes(q);
    const isParticipantMatch = chat.participantProfiles?.some((p) =>
      p.name.toLowerCase().includes(q)
    );
    const isLastMsgMatch = chat.lastMessage?.text.toLowerCase().includes(q);
    return isGroupMatch || isParticipantMatch || isLastMsgMatch;
  });

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header Bar */}
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

        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>MeshX</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleOpenGroup}
            style={[styles.headerIconBtn, { backgroundColor: palette.surfaceElevated }]}
          >
            <Users size={20} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: palette.inputBackground, borderColor: palette.border },
          ]}
        >
          <Search size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={palette.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Stories Row */}
      <StoryAvatarRow
        storyGroups={storyGroups}
        myStories={myStories}
        onOpenStoryGroup={(u, st, isMine) => setActiveStoryGroup({ user: u, stories: st, isMine })}
        onCreateStory={() => setIsCreateStoryOpen(true)}
      />

      {/* Chats List */}
      {isLoading ? (
        <View>
          <ChatListItemSkeleton />
          <ChatListItemSkeleton />
          <ChatListItemSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.chatId || (item as any).id || (item as any)._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={palette.primary}
            />
          }
          renderItem={({ item }) => {
            const cId = item.chatId || (item as any).id || (item as any)._id;
            return (
              <ChatListItem
                chat={item}
                currentUserId={user?.id || user?._id || user?.userId || 'usr_me'}
                onPress={() => handleChatPress(cId)}
                onMute={() => muteChat(cId)}
                onArchive={() => archiveChat(cId)}
                onDelete={() => handleDeleteChatConfirm(cId)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
              <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                No chats yet
              </Text>
              <Text style={[styles.emptySub, { color: palette.textMuted }]}>
                {searchQuery
                  ? 'No conversations match your search.'
                  : 'Add someone to start chatting on MeshX!'}
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: palette.primary }]}
                onPress={handleOpenNewChat}
              >
                <Text style={styles.emptyBtnText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity activeOpacity={0.8} onPress={handleOpenNewChat} style={styles.fabTouchable}>
        <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.fabGradient}>
          <MessageSquarePlus size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Story Modal */}
      <CreateStoryModal visible={isCreateStoryOpen} onClose={() => setIsCreateStoryOpen(false)} />

      {/* Story Viewer Modal */}
      <StoryViewerModal
        visible={!!activeStoryGroup}
        storyGroup={activeStoryGroup}
        onClose={() => setActiveStoryGroup(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14 },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 20 },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  fabTouchable: { position: 'absolute', bottom: 24, right: 20, borderRadius: 28, elevation: 8 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});

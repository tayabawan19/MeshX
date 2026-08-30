import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Search, Users, MessageSquarePlus, X, Archive, Star, Radio } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ChatListItem } from '../../components/chats/ChatListItem';
import { StoryAvatarRow } from '../../components/chats/StoryAvatarRow';
import { ChatListItemSkeleton } from '../../components/common/SkeletonLoader';
import { BoldButton } from '../../components/common/BoldButton';
import { triggerHaptic } from '../../utils/haptics';
import { CreateStoryModal } from '../modals/CreateStoryModal';
import { StoryViewerModal } from '../modals/StoryViewerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ChatsListScreen: React.FC<{
  navigation?: any;
  onSelectChat?: (chatId: string) => void;
  onOpenNewGroup?: () => void;
  onOpenStatusViewer?: (statusId: string) => void;
}> = ({ navigation, onSelectChat, onOpenNewGroup }) => {
  const palette = useThemeStore((state) => state.palette);
  const { user } = useAuthStore();
  const {
    chats,
    archivedChats,
    storyGroups,
    myStories,
    muteChat,
    archiveChat,
    deleteChat,
    fetchChats,
    fetchArchivedChats,
    fetchStoriesFeed,
    fetchMyStories,
    setActiveChatId,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState<{ user: any; stories: any[]; isMine?: boolean; initialIndex?: number } | null>(null);

  const fabScale = useSharedValue(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchChats(), fetchArchivedChats(), fetchStoriesFeed(), fetchMyStories()]);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    triggerHaptic('light');
    await Promise.all([fetchChats(), fetchArchivedChats(), fetchStoriesFeed(), fetchMyStories()]);
    setRefreshing(false);
  };

  const handleChatPress = (cId: string) => {
    triggerHaptic('light');
    setActiveChatId(cId);
    if (onSelectChat) {
      onSelectChat(cId);
    } else if (navigation) {
      const found = chats.find((c) => c.chatId === cId || (c as any).id === cId || c._id === cId);
      const title = found?.type === 'group' ? (found.groupName || 'Group') : (found?.otherParticipant?.name || 'Chat');
      const avatar = found?.type === 'group' ? (found.groupAvatar || found.groupAvatarUrl) : found?.otherParticipant?.avatarUrl;
      navigation.navigate('Chat', { chatId: cId, title, avatar });
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

  const handleOpenBroadcast = () => {
    triggerHaptic('light');
    if (navigation) {
      navigation.navigate('NewBroadcastModal');
    }
  };

  const handleOpenStarred = () => {
    triggerHaptic('light');
    if (navigation) {
      navigation.navigate('StarredMessagesScreen');
    }
  };

  const handleOpenArchived = () => {
    triggerHaptic('light');
    if (navigation) {
      navigation.navigate('ArchivedChatsScreen');
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
    const otherNameMatch = chat.otherParticipant?.name?.toLowerCase().includes(q);
    const isParticipantMatch = chat.participantProfiles?.some((p) =>
      p.name.toLowerCase().includes(q)
    );
    const isLastMsgMatch = chat.lastMessage?.text?.toLowerCase().includes(q);
    return isGroupMatch || otherNameMatch || isParticipantMatch || isLastMsgMatch;
  });

  const insets = useSafeAreaInsets();

  const handleFabPressIn = () => {
    triggerHaptic('medium');
    fabScale.value = withTiming(0.92, { duration: 100 });
  };

  const handleFabPressOut = () => {
    fabScale.value = withTiming(1, { duration: 100 });
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header Bar */}
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
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>MeshX</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleOpenStarred}
            style={[styles.headerIconBtn, { backgroundColor: palette.surfaceLight }]}
          >
            <Star size={17} color={palette.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenBroadcast}
            style={[styles.headerIconBtn, { backgroundColor: palette.surfaceLight }]}
          >
            <Radio size={17} color={palette.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenGroup}
            style={[styles.headerIconBtn, { backgroundColor: palette.surfaceLight }]}
          >
            <Users size={17} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Search size={16} color={palette.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={palette.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Stories Row */}
      <StoryAvatarRow
        storyGroups={storyGroups}
        myStories={myStories}
        onOpenStoryGroup={(u, st, isMine, initialIndex) =>
          setActiveStoryGroup({ user: u, stories: st, isMine, initialIndex: initialIndex || 0 })
        }
        onCreateStory={() => setIsCreateStoryOpen(true)}
      />

      {/* Archived Chats Row */}
      {archivedChats.length > 0 && (
        <View style={styles.archivedWrapper}>
          <TouchableOpacity
            onPress={handleOpenArchived}
            style={[styles.archivedRow, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <View style={styles.archivedLeft}>
              <Archive size={16} color={palette.textMuted} style={{ marginRight: 10 }} />
              <Text style={[styles.archivedLabel, { color: palette.textPrimary }]}>Archived</Text>
            </View>
            <View style={[styles.archivedBadge, { backgroundColor: palette.surfaceElevated }]}>
              <Text style={styles.archivedBadgeText}>{archivedChats.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

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
          contentContainerStyle={{ paddingBottom: 100 }}
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
              <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                No Conversations Yet
              </Text>
              <Text style={[styles.emptySub, { color: palette.textMuted }]}>
                {searchQuery
                  ? 'No conversations match your search.'
                  : 'Start a direct chat or create a group.'}
              </Text>
              <BoldButton
                title="Start New Chat"
                variant="primary"
                onPress={handleOpenNewChat}
                style={{ marginTop: 8 }}
              />
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <View style={styles.fabWrapper}>
        <Pressable
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={handleOpenNewChat}
        >
          <Animated.View
            style={[
              styles.fabButton,
              {
                backgroundColor: palette.primary, // Blurple #5865F2
              },
              fabAnimatedStyle,
            ]}
          >
            <MessageSquarePlus size={22} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>

      {/* Create Story Modal */}
      <CreateStoryModal visible={isCreateStoryOpen} onClose={() => setIsCreateStoryOpen(false)} />

      {/* Story Viewer Modal */}
      <StoryViewerModal
        visible={!!activeStoryGroup}
        storyGroup={activeStoryGroup}
        initialIndex={activeStoryGroup?.initialIndex || 0}
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
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: { paddingHorizontal: 12, paddingVertical: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '400' },
  archivedWrapper: {
    marginHorizontal: 12,
    marginVertical: 4,
  },
  archivedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  archivedLeft: { flexDirection: 'row', alignItems: 'center' },
  archivedLabel: { fontSize: 14, fontWeight: '600' },
  archivedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  archivedBadgeText: { color: '#F2F3F5', fontSize: 11, fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center', marginBottom: 16, fontWeight: '400' },
  fabWrapper: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    zIndex: 10,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});

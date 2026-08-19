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
  withSpring,
} from 'react-native-reanimated';
import { Search, Users, MessageSquarePlus, X, Archive, Star, Radio } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ChatListItem } from '../../components/chats/ChatListItem';
import { StoryAvatarRow } from '../../components/chats/StoryAvatarRow';
import { ChatListItemSkeleton } from '../../components/common/SkeletonLoader';
import { ClayInput } from '../../components/common/ClayInput';
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
}> = ({ navigation, onSelectChat, onOpenNewGroup, onOpenStatusViewer }) => {
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
  const [activeStoryGroup, setActiveStoryGroup] = useState<{ user: any; stories: any[]; isMine?: boolean } | null>(null);

  const fabPressedOffset = useSharedValue(0);

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
    fabPressedOffset.value = withSpring(4, { damping: 14, stiffness: 280 });
  };

  const handleFabPressOut = () => {
    fabPressedOffset.value = withSpring(0, { damping: 12, stiffness: 220 });
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: fabPressedOffset.value },
      { translateY: fabPressedOffset.value },
    ],
  }));

  const fabShadowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fabPressedOffset.value >= 3 ? 0 : 1,
  }));

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 14),
            backgroundColor: palette.background,
            borderBottomColor: '#000000',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>MeshX</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.headerBtnWrapper}>
            <View style={styles.headerBtnShadow} />
            <TouchableOpacity
              onPress={handleOpenStarred}
              style={[styles.headerIconBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}
            >
              <Star size={18} color={palette.highlight} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerBtnWrapper}>
            <View style={styles.headerBtnShadow} />
            <TouchableOpacity
              onPress={handleOpenBroadcast}
              style={[styles.headerIconBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}
            >
              <Radio size={18} color={palette.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerBtnWrapper}>
            <View style={styles.headerBtnShadow} />
            <TouchableOpacity
              onPress={handleOpenGroup}
              style={[styles.headerIconBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}
            >
              <Users size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bold Search Slot */}
      <View style={styles.searchWrapper}>
        <ClayInput borderRadius={18} style={styles.searchBar}>
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
        </ClayInput>
      </View>

      {/* Active Stories Row */}
      <StoryAvatarRow
        storyGroups={storyGroups}
        myStories={myStories}
        onOpenStoryGroup={(u, st, isMine) => setActiveStoryGroup({ user: u, stories: st, isMine })}
        onCreateStory={() => setIsCreateStoryOpen(true)}
      />

      {/* Archived Chats Quick Row */}
      {archivedChats.length > 0 && (
        <View style={styles.archivedWrapper}>
          <View style={styles.archivedShadow} />
          <TouchableOpacity
            onPress={handleOpenArchived}
            style={[styles.archivedRow, { backgroundColor: palette.surface, borderColor: '#000000' }]}
          >
            <View style={styles.archivedLeft}>
              <Archive size={18} color={palette.secondary} style={{ marginRight: 10 }} />
              <Text style={[styles.archivedLabel, { color: palette.textPrimary }]}>Archived</Text>
            </View>
            <View style={[styles.archivedBadge, { backgroundColor: palette.primary, borderColor: '#000000' }]}>
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
              <Text style={{ fontSize: 52, marginBottom: 12 }}>⚡</Text>
              <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                No Conversations Yet
              </Text>
              <Text style={[styles.emptySub, { color: palette.textMuted }]}>
                {searchQuery
                  ? 'No conversations match your search.'
                  : 'Start a bold new chat on MeshX!'}
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

      {/* Bold Floating Action Button (FAB) */}
      <View style={styles.fabWrapper}>
        <Animated.View style={[styles.fabHardShadow, fabShadowAnimatedStyle]} />
        <Pressable
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={handleOpenNewChat}
        >
          <Animated.View
            style={[
              styles.fabButton,
              {
                backgroundColor: palette.primary, // Hot Coral #FF4D5E
                borderColor: '#000000',
              },
              fabAnimatedStyle,
            ]}
          >
            <MessageSquarePlus size={26} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>

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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtnWrapper: { position: 'relative' },
  headerBtnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: { height: 50 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  archivedWrapper: {
    position: 'relative',
    marginHorizontal: 14,
    marginBottom: 8,
  },
  archivedShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  archivedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    zIndex: 1,
  },
  archivedLeft: { flexDirection: 'row', alignItems: 'center' },
  archivedLabel: { fontSize: 15, fontWeight: '800' },
  archivedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  archivedBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '500' },
  fabWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 10,
  },
  fabHardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  fabButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

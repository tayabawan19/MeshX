import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { BellOff } from 'lucide-react-native';
import { Chat } from '../../types';
import { Avatar } from '../common/Avatar';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { apiClient } from '../../config/api';
import { formatChatTimestamp } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  onPress: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  currentUserId,
  onPress,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const contacts = useChatStore((state) => state.contacts);
  const opacity = useSharedValue(1);

  const isGroup =
    chat.type === 'group' &&
    ((chat.participants?.length || 0) > 2 ||
      (!!chat.groupName &&
        chat.groupName !== 'Group' &&
        chat.groupName !== 'Group Chat'));

  const myId = (
    currentUserId ||
    (useAuthStore.getState().user as any)?._id ||
    (useAuthStore.getState().user as any)?.id ||
    (useAuthStore.getState().user as any)?.userId ||
    ''
  ).toString();

  // Find the other participant from chat.participants
  const peerParticipant = Array.isArray(chat.participants)
    ? chat.participants.find((p: any) => {
        const pId = (typeof p === 'object' ? p?._id || p?.id : p)?.toString();
        return pId && pId !== myId;
      })
    : null;

  const peerId =
    (chat.otherParticipant && (chat.otherParticipant._id || chat.otherParticipant.id)) ||
    (typeof peerParticipant === 'object'
      ? peerParticipant?._id || peerParticipant?.id
      : peerParticipant);

  const peerIdStr = peerId ? peerId.toString() : null;

  const matchedContact = contacts.find((c) => {
    const cId = (c._id || c.id || (c as any).userId)?.toString();
    return cId && cId === peerIdStr;
  });

  const staticName =
    (chat.otherParticipant?.name &&
    chat.otherParticipant.name !== 'Contact' &&
    chat.otherParticipant.name !== 'User' &&
    chat.otherParticipant.name !== 'Direct Chat'
      ? chat.otherParticipant.name
      : null) ||
    (typeof peerParticipant === 'object' &&
    peerParticipant?.name &&
    peerParticipant.name !== 'Contact' &&
    peerParticipant.name !== 'User'
      ? peerParticipant.name
      : null) ||
    (matchedContact?.name &&
    matchedContact.name !== 'Contact' &&
    matchedContact.name !== 'User'
      ? matchedContact.name
      : null);

  const [peerName, setPeerName] = useState<string | null>(null);
  const [peerAvatar, setPeerAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!isGroup && peerIdStr && !staticName) {
      apiClient
        .get(`/users/${peerIdStr}`)
        .then((res) => {
          if (res.data?.user?.name) {
            setPeerName(res.data.user.name);
          }
          if (res.data?.user?.avatarUrl) {
            setPeerAvatar(res.data.user.avatarUrl);
          }
        })
        .catch(() => {});
    }
  }, [isGroup, peerIdStr, staticName]);

  const displayName = isGroup
    ? chat.groupName || 'Group Chat'
    : peerName || staticName || 'User';

  const avatarUrl = isGroup
    ? chat.groupAvatar || (chat as any).groupAvatarUrl
    : peerAvatar ||
      chat.otherParticipant?.avatarUrl ||
      (typeof peerParticipant === 'object' ? peerParticipant?.avatarUrl : null) ||
      matchedContact?.avatarUrl;

  const isOnline =
    !isGroup &&
    !!(
      chat.otherParticipant?.isOnline ||
      (typeof peerParticipant === 'object' && peerParticipant?.isOnline) ||
      matchedContact?.isOnline
    );

  const unreadCount = Number(chat.unreadCount) || 0;
  const hasUnread = unreadCount > 0;
  const unreadDisplay = unreadCount > 9 ? '9+' : `${unreadCount}`;

  const renderLastMessagePreview = () => {
    if (!chat.lastMessage) return 'No messages yet';
    const sId = typeof chat.lastMessage.senderId === 'object' ? (chat.lastMessage.senderId as any)._id : chat.lastMessage.senderId;
    const prefix = sId === currentUserId ? 'You: ' : '';
    if (chat.lastMessage.type === 'voice') return `${prefix}🎙️ Voice note`;
    if (chat.lastMessage.type === 'image') return `${prefix}📷 Photo`;
    if (chat.lastMessage.type === 'document') return `${prefix}📄 Document`;
    return `${prefix}${chat.lastMessage.text || ''}`;
  };

  const handlePressIn = () => {
    triggerHaptic('light');
    opacity.value = withTiming(0.7, { duration: 100 });
  };

  const handlePressOut = () => {
    opacity.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const timeVal = Number(chat.lastMessage?.timestamp || chat.lastMessage?.createdAt) || (typeof chat.updatedAt === 'number' ? chat.updatedAt : Date.now());

  return (
    <Animated.View entering={FadeIn.duration(160)} style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.cardBody,
            {
              backgroundColor: hasUnread ? palette.surface : 'transparent',
              borderBottomColor: palette.border,
            },
            animatedStyle,
          ]}
        >
          <Avatar
            url={avatarUrl}
            name={displayName}
            size="md"
            isOnline={isOnline}
          />

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.name,
                  {
                    color: palette.textPrimary,
                    fontWeight: hasUnread ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {chat.lastMessage && (
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: hasUnread ? palette.primary : palette.textMuted,
                      fontWeight: hasUnread ? '600' : '400',
                    },
                  ]}
                >
                  {formatChatTimestamp(timeVal)}
                </Text>
              )}
            </View>

            <View style={styles.bottomRow}>
              <Text
                style={[
                  styles.preview,
                  {
                    color: hasUnread ? palette.textPrimary : palette.textSecondary,
                    fontWeight: hasUnread ? '500' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {renderLastMessagePreview()}
              </Text>

              <View style={styles.actionsBadgeGroup}>
                {chat.isMuted && <BellOff size={14} color={palette.textMuted} style={{ marginRight: 6 }} />}
                {hasUnread && (
                  <View
                    style={[
                      styles.unreadBadge,
                      {
                        backgroundColor: palette.primary, // Blurple #5865F2
                      },
                    ]}
                  >
                    <Text style={styles.unreadText}>{unreadDisplay}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 1,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    letterSpacing: -0.1,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  actionsBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

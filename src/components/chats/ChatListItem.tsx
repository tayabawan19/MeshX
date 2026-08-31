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

  const recipientObj =
    chat.otherParticipant ||
    (chat.participantProfiles && chat.participantProfiles.length > 0
      ? chat.participantProfiles.find(
          (p) => (p.id || p._id || (p as any).userId)?.toString() !== currentUserId.toString()
        ) || chat.participantProfiles[0]
      : Array.isArray(chat.participants)
      ? (chat.participants.find(
          (p: any) =>
            typeof p === 'object' &&
            (p._id || p.id || p.userId)?.toString() !== currentUserId.toString()
        ) as any)
      : null);

  const targetUserId =
    recipientObj?.id ||
    recipientObj?._id ||
    (Array.isArray(chat.participants)
      ? chat.participants.find(
          (p: any) =>
            (p?._id ? p._id.toString() : p?.toString()) !== currentUserId.toString()
        )
      : null);

  const targetUserIdStr =
    typeof targetUserId === 'object' ? targetUserId?._id || targetUserId?.id : targetUserId;

  const contactFromStore = contacts.find(
    (c) =>
      (c._id ? c._id.toString() : c.id?.toString()) === targetUserIdStr?.toString()
  );

  const [peerName, setPeerName] = useState<string | null>(null);
  const [peerAvatar, setPeerAvatar] = useState<string | null>(null);

  const staticName =
    (recipientObj?.name &&
    recipientObj.name !== 'Contact' &&
    recipientObj.name !== 'User' &&
    recipientObj.name !== 'Direct Chat'
      ? recipientObj.name
      : null) ||
    (contactFromStore?.name &&
    contactFromStore.name !== 'Contact' &&
    contactFromStore.name !== 'User'
      ? contactFromStore.name
      : null);

  useEffect(() => {
    if (!isGroup && targetUserIdStr && !staticName) {
      apiClient
        .get(`/users/${targetUserIdStr}`)
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
  }, [isGroup, targetUserIdStr, staticName]);

  const displayName = isGroup
    ? chat.groupName || 'Group Chat'
    : peerName || staticName || 'User';

  const avatarUrl = isGroup
    ? chat.groupAvatar || (chat as any).groupAvatarUrl
    : peerAvatar || contactFromStore?.avatarUrl || recipientObj?.avatarUrl;

  const isOnline = !isGroup && !!recipientObj?.isOnline;

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

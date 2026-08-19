import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BellOff } from 'lucide-react-native';
import { Chat } from '../../types';
import { Avatar } from '../common/Avatar';
import { useThemeStore } from '../../store/useThemeStore';
import { formatChatTimestamp } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';
import { getContactAccent } from '../../theme/colors';

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
  const pressedOffset = useSharedValue(0);

  const isGroup = chat.type === 'group';
  const recipient =
    chat.otherParticipant ||
    (chat.participantProfiles && chat.participantProfiles.length > 0
      ? chat.participantProfiles.find(
          (p) => (p.id || p._id || (p as any).userId) !== currentUserId
        ) || chat.participantProfiles[0]
      : Array.isArray(chat.participants)
      ? (chat.participants.find(
          (p: any) => typeof p === 'object' && (p._id || p.id || p.userId) !== currentUserId
        ) as any)
      : null);

  const displayName = isGroup ? (chat.groupName || 'Group') : (recipient?.name || 'Direct Chat');
  const avatarUrl = isGroup ? (chat.groupAvatar || chat.groupAvatarUrl) : recipient?.avatarUrl;
  const isOnline = !isGroup && !!recipient?.isOnline;
  const assignedAccent = getContactAccent(displayName);

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
    pressedOffset.value = withSpring(3, { damping: 14, stiffness: 280 });
  };

  const handlePressOut = () => {
    pressedOffset.value = withSpring(0, { damping: 12, stiffness: 220 });
  };

  const handlePress = () => {
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressedOffset.value },
      { translateY: pressedOffset.value },
    ],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    opacity: pressedOffset.value >= 2 ? 0 : 1,
  }));

  const timeVal = Number(chat.lastMessage?.timestamp || chat.lastMessage?.createdAt) || (typeof chat.updatedAt === 'number' ? chat.updatedAt : Date.now());

  return (
    <Animated.View entering={FadeInRight.duration(250)} style={styles.container}>
      {/* Hard Offset Comic Shadow */}
      <Animated.View style={[styles.hardShadow, animatedShadowStyle]} />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.cardBody,
            {
              backgroundColor: palette.surface,
              borderColor: hasUnread ? assignedAccent : '#000000',
            },
            animatedStyle,
          ]}
        >
          <Avatar
            url={avatarUrl}
            name={displayName}
            size="md"
            isOnline={isOnline}
            accentColor={assignedAccent}
          />

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.name,
                  {
                    color: palette.textPrimary,
                    fontWeight: hasUnread ? '900' : '700',
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
                      color: hasUnread ? assignedAccent : palette.textMuted,
                      fontWeight: hasUnread ? '800' : '600',
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
                    fontWeight: hasUnread ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {renderLastMessagePreview()}
              </Text>

              <View style={styles.actionsBadgeGroup}>
                {chat.isMuted && <BellOff size={14} color={palette.textMuted} style={{ marginRight: 6 }} />}
                {hasUnread && (
                  <View style={styles.unreadWrapper}>
                    <View style={styles.unreadShadow} />
                    <View
                      style={[
                        styles.unreadBadge,
                        {
                          backgroundColor: palette.primary, // Hot Coral #FF4D5E
                          borderColor: '#000000',
                        },
                      ]}
                    >
                      <Text style={styles.unreadText}>{unreadDisplay}</Text>
                    </View>
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
    position: 'relative',
    marginHorizontal: 14,
    marginVertical: 4,
  },
  hardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    zIndex: 1,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 16,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  actionsBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadWrapper: {
    position: 'relative',
  },
  unreadShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});

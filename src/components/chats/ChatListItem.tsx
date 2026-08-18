import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BellOff } from 'lucide-react-native';
import { Chat } from '../../types';
import { Avatar } from '../common/Avatar';
import { useThemeStore } from '../../store/useThemeStore';
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
  const scale = useSharedValue(1);

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
    scale.value = withSpring(0.965, { damping: 14, stiffness: 240 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = () => {
    triggerHaptic('light');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const timeVal = Number(chat.lastMessage?.timestamp || chat.lastMessage?.createdAt) || (typeof chat.updatedAt === 'number' ? chat.updatedAt : Date.now());

  return (
    <Animated.View entering={FadeInRight.duration(250)} style={{ marginHorizontal: 12, marginVertical: 4 }}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.clayRow,
            {
              backgroundColor: palette.surface,
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0, 0, 0, 0.35)',
              borderRightColor: 'rgba(0, 0, 0, 0.22)',
            },
            animatedStyle,
          ]}
        >
          <Avatar url={avatarUrl} name={displayName} size="md" isOnline={isOnline} />

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text
                style={[
                  styles.name,
                  {
                    color: palette.textPrimary,
                    fontWeight: hasUnread ? '800' : '600',
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
                      color: hasUnread ? palette.primaryLight : palette.textMuted,
                      fontWeight: hasUnread ? '700' : '500',
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
                    fontWeight: hasUnread ? '700' : '400',
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
                      styles.unreadClayBadge,
                      {
                        borderTopColor: palette.clayHighlight,
                        borderLeftColor: palette.clayHighlight,
                        borderBottomColor: 'rgba(0,0,0,0.3)',
                        borderRightColor: 'rgba(0,0,0,0.2)',
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#8B7FD1', '#7B93D6']}
                      style={styles.unreadBadgeGradient}
                    >
                      <Text style={styles.unreadText}>{unreadDisplay}</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  clayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
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
  unreadClayBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  unreadBadgeGradient: {
    flex: 1,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});

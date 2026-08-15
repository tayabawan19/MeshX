import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
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
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  currentUserId,
  onPress,
}) => {
  const palette = useThemeStore((state) => state.palette);

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

  const handlePress = () => {
    triggerHaptic('light');
    onPress();
  };

  const timeVal = Number(chat.lastMessage?.timestamp || chat.lastMessage?.createdAt) || (typeof chat.updatedAt === 'number' ? chat.updatedAt : Date.now());

  return (
    <Animated.View entering={FadeInRight.duration(300)}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={[styles.container, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}
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
                <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadDisplay}</Text>
                </LinearGradient>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  content: { flex: 1, marginLeft: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  timestamp: { fontSize: 12, fontWeight: '500' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { fontSize: 14, flex: 1, marginRight: 8 },
  actionsBadgeGroup: { flexDirection: 'row', alignItems: 'center' },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});

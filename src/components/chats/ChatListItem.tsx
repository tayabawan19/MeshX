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
  const recipient = chat.participantProfiles && chat.participantProfiles.length > 0
    ? chat.participantProfiles[0]
    : null;

  const displayName = isGroup ? chat.groupName : recipient?.name || 'Direct Chat';
  const avatarUrl = isGroup ? chat.groupAvatarUrl : recipient?.avatarUrl;
  const isOnline = !isGroup && recipient?.isOnline;

  const renderLastMessagePreview = () => {
    if (!chat.lastMessage) return 'No messages yet';
    const prefix = chat.lastMessage.senderId === currentUserId ? 'You: ' : '';
    if (chat.lastMessage.type === 'voice') return `${prefix}🎙️ Voice note`;
    if (chat.lastMessage.type === 'image') return `${prefix}📷 Photo`;
    if (chat.lastMessage.type === 'document') return `${prefix}📄 Document`;
    return `${prefix}${chat.lastMessage.text}`;
  };

  const handlePress = () => {
    triggerHaptic('light');
    onPress();
  };

  const timeVal = Number(chat.lastMessage?.timestamp || chat.lastMessage?.createdAt) || Date.now();

  return (
    <Animated.View entering={FadeInRight.duration(300)}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={[styles.container, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}
      >
        <Avatar url={avatarUrl} name={displayName} size="md" isOnline={!!isOnline} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: palette.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            {chat.lastMessage && (
              <Text style={[styles.timestamp, { color: chat.unreadCount ? palette.primaryLight : palette.textMuted }]}>
                {formatChatTimestamp(timeVal)}
              </Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.preview,
                { color: chat.unreadCount ? palette.textPrimary : palette.textSecondary, fontWeight: chat.unreadCount ? '600' : '400' },
              ]}
              numberOfLines={1}
            >
              {renderLastMessagePreview()}
            </Text>

            <View style={styles.actionsBadgeGroup}>
              {chat.isMuted && <BellOff size={14} color={palette.textMuted} style={{ marginRight: 6 }} />}
              {!!chat.unreadCount && chat.unreadCount > 0 && (
                <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{chat.unreadCount}</Text>
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

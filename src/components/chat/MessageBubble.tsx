import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, CheckCheck, Play, Pause, FileText } from 'lucide-react-native';
import { Message } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { formatMessageTime, formatCallDuration } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  senderName?: string;
  onLongPress?: (message: Message) => void;
  onSwipeReply?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  isFirstInGroup = true,
  isLastInGroup = true,
  senderName,
  onLongPress,
}) => {
  const { palette, chatThemes, themeMode } = useThemeStore();
  const { activeChatId, openMediaViewer } = useChatStore();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentChatTheme = activeChatId ? chatThemes[activeChatId] : undefined;
  const sentGradient: [string, string] = currentChatTheme?.gradient || ['#7C3AED', '#3B82F6'];
  const receivedColor = currentChatTheme?.receivedColor || (themeMode === 'dark' ? '#1E1E2A' : '#EDF0F7');

  const bubbleRadius = 20;
  const tailRadius = 4;

  const sentBorderRadius = {
    borderTopLeftRadius: bubbleRadius,
    borderTopRightRadius: isFirstInGroup ? bubbleRadius : tailRadius,
    borderBottomLeftRadius: bubbleRadius,
    borderBottomRightRadius: isLastInGroup ? tailRadius : bubbleRadius,
  };

  const receivedBorderRadius = {
    borderTopLeftRadius: isFirstInGroup ? bubbleRadius : tailRadius,
    borderTopRightRadius: bubbleRadius,
    borderBottomLeftRadius: isLastInGroup ? tailRadius : bubbleRadius,
    borderBottomRightRadius: bubbleRadius,
  };

  const handleLongPress = () => {
    triggerHaptic('heavy');
    if (onLongPress) onLongPress(message);
  };

  const toggleAudio = () => {
    triggerHaptic('light');
    setIsPlayingAudio(!isPlayingAudio);
  };

  const renderReadStatus = () => {
    if (!isMe) return null;
    if (message.status === 'read') {
      return <CheckCheck size={15} color={palette.readReceiptBlue} style={styles.receiptIcon} />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck size={15} color="#A0A0B0" style={styles.receiptIcon} />;
    }
    return <Check size={15} color="#A0A0B0" style={styles.receiptIcon} />;
  };

  const renderReactions = () => {
    const reactionCounts: Record<string, number> = {};
    if (message.reactions) {
      if (Array.isArray(message.reactions)) {
        message.reactions.forEach((r) => {
          if (r.emoji) reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });
      } else {
        Object.values(message.reactions).forEach((emoji) => {
          reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
        });
      }
    }

    const entries = Object.entries(reactionCounts);
    if (entries.length === 0) return null;

    return (
      <View style={[styles.reactionsContainer, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
        {entries.map(([emoji, count]) => (
          <View
            key={emoji}
            style={[styles.reactionChip, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}
          >
            <Text style={styles.reactionText}>
              {emoji} {count > 1 ? count : ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    return (
      <View style={styles.innerContent}>
        {!isMe && senderName && isFirstInGroup && (
          <Text style={[styles.senderName, { color: palette.primaryLight }]}>{senderName}</Text>
        )}

        {message.replyTo && (
          <View style={[styles.replyContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={styles.replyBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replySender}>{message.replyTo.senderName || 'Replying'}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {message.replyTo.text}
              </Text>
            </View>
          </View>
        )}

        {message.type === 'image' && message.mediaUrl && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openMediaViewer(message.mediaUrl!, 'image', message.text)}
            style={styles.imageWrapper}
          >
            <Image source={{ uri: message.mediaUrl }} style={styles.messageImage} />
          </TouchableOpacity>
        )}

        {message.type === 'voice' && (
          <View style={styles.voiceContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={toggleAudio} style={styles.voicePlayBtn}>
              {isPlayingAudio ? <Pause size={18} color="#FFFFFF" /> : <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />}
            </TouchableOpacity>
            <View style={styles.waveformContainer}>
              <View style={styles.waveformBars}>
                {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 30, 70, 50].map((h, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.waveformBar,
                      { height: (h / 100) * 22, backgroundColor: isMe ? '#FFFFFF' : palette.primaryLight },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.audioTime, { color: isMe ? 'rgba(255,255,255,0.85)' : palette.textMuted }]}>
                {formatCallDuration(message.audioDuration || 14)}
              </Text>
            </View>
          </View>
        )}

        {message.type === 'document' && (
          <View style={styles.documentContainer}>
            <FileText size={28} color={isMe ? '#FFFFFF' : palette.primary} />
            <View style={styles.documentMeta}>
              <Text style={[styles.documentName, { color: isMe ? '#FFFFFF' : palette.textPrimary }]}>
                {message.mediaFileName || 'Attachment.pdf'}
              </Text>
              <Text style={[styles.documentSize, { color: isMe ? 'rgba(255,255,255,0.7)' : palette.textMuted }]}>
                {message.mediaFileSize || '2.4 MB'}
              </Text>
            </View>
          </View>
        )}

        {message.text ? (
          <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : palette.receivedText }]}>{message.text}</Text>
        ) : null}

        <View style={styles.metaContainer}>
          <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.7)' : palette.textMuted }]}>
            {formatMessageTime(Number(message.createdAt) || Date.now())}
          </Text>
          {renderReadStatus()}
        </View>
      </View>
    );
  };

  return (
    <Animated.View entering={FadeInUp.springify().damping(15)} style={[styles.container, { marginBottom: isLastInGroup ? 8 : 3 }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        style={[
          styles.bubbleWrapper,
          isMe ? styles.sentWrapper : styles.receivedWrapper,
        ]}
      >
        {isMe ? (
          <LinearGradient
            colors={sentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, sentBorderRadius]}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, { backgroundColor: receivedColor }, receivedBorderRadius]}>
            {renderContent()}
          </View>
        )}
      </TouchableOpacity>

      {renderReactions()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 12 },
  bubbleWrapper: { maxWidth: SCREEN_WIDTH * 0.75 },
  sentWrapper: { alignSelf: 'flex-end' },
  receivedWrapper: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  innerContent: { justifyContent: 'center' },
  senderName: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  replyContainer: { flexDirection: 'row', padding: 6, borderRadius: 8, marginBottom: 6 },
  replyBar: { width: 3, backgroundColor: '#3B82F6', borderRadius: 2, marginRight: 8 },
  replySender: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },
  replyText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  messageText: { fontSize: 15, lineHeight: 21 },
  imageWrapper: { borderRadius: 14, overflow: 'hidden', marginBottom: 6 },
  messageImage: { width: 220, height: 160, resizeMode: 'cover' },
  voiceContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  voicePlayBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  waveformContainer: { flex: 1 },
  waveformBars: { flexDirection: 'row', alignItems: 'center', height: 24, gap: 3 },
  waveformBar: { width: 3, borderRadius: 2 },
  audioTime: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  documentContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  documentMeta: { marginLeft: 10 },
  documentName: { fontSize: 14, fontWeight: '600' },
  documentSize: { fontSize: 12 },
  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  timestamp: { fontSize: 11, fontWeight: '500' },
  receiptIcon: { marginLeft: 4 },
  reactionsContainer: { flexDirection: 'row', marginTop: -4, marginBottom: 4, marginHorizontal: 8 },
  reactionChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  reactionText: { fontSize: 12 },
});

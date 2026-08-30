import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Audio, AVPlaybackStatus } from 'expo-av';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  CornerUpRight,
  Download,
  Ban,
} from 'lucide-react-native';
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
  animateEntrance?: boolean;
  senderName?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
  onSwipeReply?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  isFirstInGroup = true,
  isLastInGroup = true,
  animateEntrance = false,
  senderName,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onLongPress,
}) => {
  const { palette } = useThemeStore();
  const { openMediaViewer } = useChatStore();

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(
    message.audioDuration ? message.audioDuration * 1000 : 0
  );
  const soundRef = useRef<Audio.Sound | null>(null);

  // Snappy Discord entrance: quick fade + slight translateY
  const opacity = useSharedValue(animateEntrance ? 0 : 1);
  const translateY = useSharedValue(animateEntrance ? 6 : 0);

  useEffect(() => {
    if (animateEntrance) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withTiming(0, { duration: 160 });
    }
  }, [animateEntrance]);

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setIsLoadingAudio(false);
        setIsPlayingAudio(false);
      }
      return;
    }

    setIsLoadingAudio(false);
    setIsPlayingAudio(status.isPlaying);
    setPlaybackPosition(status.positionMillis);
    if (status.durationMillis) {
      setPlaybackDuration(status.durationMillis);
    }

    if (status.didJustFinish) {
      setIsPlayingAudio(false);
      setPlaybackPosition(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const toggleAudio = async () => {
    triggerHaptic('light');
    if (!message.mediaUrl) {
      console.warn('[VoicePlayer] No mediaUrl present for message:', message.id || message._id);
      return;
    }

    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlayingAudio(false);
          } else {
            if (status.positionMillis >= (status.durationMillis || 0)) {
              await soundRef.current.setPositionAsync(0);
            }
            await soundRef.current.playAsync();
            setIsPlayingAudio(true);
          }
          return;
        }
      }

      setIsLoadingAudio(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
    } catch (err: any) {
      console.error('[VoicePlayer Error]', err?.message || err);
      setIsLoadingAudio(false);
      setIsPlayingAudio(false);
    }
  };

  // Render System Announcement Pill Message
  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageWrapper}>
        <View style={[styles.systemPill, { backgroundColor: palette.surfaceElevated }]}>
          <Text style={[styles.systemMessageText, { color: palette.textSecondary }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Discord Colors: Sent is solid Blurple #5865F2, Received is solid Elevated surface #2B2D31
  const sentSolidColor = palette.primary; // Blurple #5865F2
  const receivedSolidColor = palette.surface; // #2B2D31
  const sentTextColor = '#FFFFFF';
  const receivedTextColor = palette.textPrimary; // #F2F3F5

  const handleBubblePress = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(message);
    }
  };

  const handleLongPress = () => {
    triggerHaptic('medium');
    if (onLongPress) onLongPress(message);
  };

  const renderReadStatus = () => {
    if (!isMe) return null;
    const iconColor = message.status === 'read' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
    if (message.status === 'read' || message.status === 'delivered') {
      return <CheckCheck size={14} color={iconColor} style={styles.receiptIcon} />;
    }
    return <Check size={14} color={iconColor} style={styles.receiptIcon} />;
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
            style={[
              styles.reactionChip,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={styles.reactionText}>
              {emoji} {count > 1 ? count : ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const totalDurationSeconds = Math.max(
    Math.round(playbackDuration / 1000),
    message.audioDuration || 5
  );
  const currentSeconds = Math.round(playbackPosition / 1000);
  const progressRatio = playbackDuration > 0 ? playbackPosition / playbackDuration : 0;

  const isDeleted = message.isDeletedForEveryone;

  const renderContent = () => {
    if (isDeleted) {
      return (
        <View style={styles.deletedContainer}>
          <Ban size={15} color={isMe ? sentTextColor : palette.textMuted} style={{ marginRight: 6 }} />
          <Text
            style={[
              styles.deletedText,
              { color: isMe ? sentTextColor : palette.textMuted },
            ]}
          >
            This message was deleted
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.innerContent}>
        {/* Forwarded Header */}
        {message.isForwarded && (
          <View style={styles.forwardedBadge}>
            <CornerUpRight size={12} color={isMe ? sentTextColor : palette.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.forwardedText, { color: isMe ? sentTextColor : palette.textSecondary }]}>
              Forwarded
            </Text>
          </View>
        )}

        {/* Sender Name in Group Chat */}
        {!isMe && senderName && isFirstInGroup && (
          <Text style={[styles.senderName, { color: palette.primary }]}>{senderName}</Text>
        )}

        {/* Story Reply Preview */}
        {Boolean(
          message.storyReply &&
            (message.storyReply.storyId ||
              (typeof message.storyReply.mediaUrl === 'string' && message.storyReply.mediaUrl.trim().length > 0) ||
              (typeof message.storyReply.caption === 'string' && message.storyReply.caption.trim().length > 0))
        ) && (
          <View style={[styles.storyReplyCard, { backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : palette.surfaceElevated }]}>
            {message.storyReply?.mediaUrl ? (
              <Image source={{ uri: message.storyReply.mediaUrl }} style={styles.storyReplyThumbnail} />
            ) : (
              <View style={[styles.storyReplyTextThumb, { backgroundColor: palette.primary }]}>
                <Text style={styles.storyReplyThumbText}>Story</Text>
              </View>
            )}
            <View style={styles.storyReplyMeta}>
              <Text style={[styles.storyReplyTitle, { color: isMe ? sentTextColor : palette.primary }]}>Story reply</Text>
              <Text style={[styles.storyReplyCaption, { color: isMe ? sentTextColor : palette.textSecondary }]} numberOfLines={1}>
                {message.storyReply?.caption || 'Status story'}
              </Text>
            </View>
          </View>
        )}

        {/* Standard Reply Preview */}
        {message.replyTo && (
          <View style={[styles.replyContainer, { backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : palette.surfaceElevated }]}>
            <View style={[styles.replyBar, { backgroundColor: isMe ? sentTextColor : palette.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replySender, { color: isMe ? sentTextColor : palette.primary }]}>{message.replyTo.senderName || 'Replying'}</Text>
              <Text style={[styles.replyText, { color: isMe ? sentTextColor : palette.textPrimary }]} numberOfLines={1}>
                {message.replyTo.text}
              </Text>
            </View>
          </View>
        )}

        {/* Image Message */}
        {message.type === 'image' && message.mediaUrl && (
          <TouchableWithoutFeedback
            onPress={() => openMediaViewer(message.mediaUrl!, 'image', message.text)}
          >
            <View style={styles.imageWrapper}>
              <Image source={{ uri: message.mediaUrl }} style={styles.messageImage} />
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* Voice Note */}
        {message.type === 'voice' && (
          <View style={styles.voiceContainer}>
            <TouchableOpacity
              onPress={toggleAudio}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.voicePlayBtn,
                {
                  backgroundColor: isMe ? '#FFFFFF' : palette.primary,
                },
              ]}
            >
              {isLoadingAudio ? (
                <ActivityIndicator size="small" color={isMe ? sentSolidColor : '#FFFFFF'} />
              ) : isPlayingAudio ? (
                <Pause size={16} color={isMe ? sentSolidColor : '#FFFFFF'} />
              ) : (
                <Play size={16} color={isMe ? sentSolidColor : '#FFFFFF'} style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
            <View style={styles.waveformContainer}>
              <View style={styles.waveformBars}>
                {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 30, 70, 50].map((h, idx) => {
                  const barProgress = idx / 13;
                  const isFilled = isPlayingAudio && progressRatio >= barProgress;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.waveformBar,
                        {
                          height: (h / 100) * 18,
                          backgroundColor: isMe
                            ? isFilled
                              ? sentTextColor
                              : 'rgba(255,255,255,0.4)'
                            : isFilled
                            ? palette.primary
                            : palette.textMuted,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.audioTime, { color: isMe ? sentTextColor : palette.textMuted }]}>
                {isPlayingAudio
                  ? `${formatCallDuration(currentSeconds)} / ${formatCallDuration(totalDurationSeconds)}`
                  : formatCallDuration(totalDurationSeconds)}
              </Text>
            </View>
          </View>
        )}

        {/* Document Message */}
        {message.type === 'document' && (
          <View style={[styles.documentContainer, { backgroundColor: isMe ? 'rgba(0,0,0,0.18)' : palette.surfaceElevated }]}>
            <View style={[styles.docIconWrapper, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : palette.surfaceLight }]}>
              <FileText size={20} color="#FFFFFF" />
            </View>
            <View style={styles.docDetails}>
              <Text style={[styles.docFileName, { color: isMe ? sentTextColor : palette.textPrimary }]} numberOfLines={1}>
                {message.mediaFileName || 'Document'}
              </Text>
              <Text style={[styles.docFileSize, { color: isMe ? sentTextColor : palette.textMuted }]}>
                {message.mediaFileSize || '1.2 MB'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.docDownloadBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : palette.surfaceLight }]}>
              <Download size={15} color={isMe ? '#FFFFFF' : palette.textPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Text Message */}
        {message.text ? (
          <Text
            style={[
              styles.messageText,
              {
                color: isMe ? sentTextColor : receivedTextColor,
              },
            ]}
          >
            {message.text}
          </Text>
        ) : null}

        {/* Footer: Timestamp, Edited & Read Receipt */}
        <View style={styles.footerRow}>
          {message.isEdited && (
            <Text style={[styles.editedIndicator, { color: isMe ? sentTextColor : palette.textMuted }]}>
              (edited)
            </Text>
          )}
          <Text style={[styles.timestamp, { color: isMe ? sentTextColor : palette.textMuted }]}>
            {formatMessageTime(Number(message.createdAt) || Date.now())}
          </Text>
          {renderReadStatus()}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { marginBottom: isLastInGroup ? 6 : 2 }]}>
      <View style={[styles.bubbleRow, isMe ? styles.sentRow : styles.receivedRow]}>
        {/* Multi-Select Checkbox */}
        {isSelectionMode && (
          <TouchableOpacity
            onPress={() => onToggleSelect && onToggleSelect(message)}
            style={[
              styles.selectionCheckbox,
              {
                borderColor: palette.border,
                backgroundColor: isSelected ? palette.primary : palette.surfaceLight,
              },
            ]}
          >
            {isSelected && <Check size={12} color="#FFFFFF" />}
          </TouchableOpacity>
        )}

        <Animated.View
          style={[
            styles.bubbleWrapper,
            isMe ? styles.sentWrapper : styles.receivedWrapper,
            animatedBubbleStyle,
          ]}
        >
          <TouchableWithoutFeedback
            onPress={handleBubblePress}
            onLongPress={handleLongPress}
            delayLongPress={300}
          >
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: isMe ? sentSolidColor : receivedSolidColor,
                  borderRadius: 16,
                },
              ]}
            >
              {renderContent()}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
      {renderReactions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  receivedRow: {
    justifyContent: 'flex-start',
  },
  selectionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubbleWrapper: {
    maxWidth: SCREEN_WIDTH * 0.78,
  },
  sentWrapper: {
    alignSelf: 'flex-end',
  },
  receivedWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 13,
    paddingTop: 8,
    paddingBottom: 7,
  },
  innerContent: {},
  messageText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
  editedIndicator: {
    fontSize: 10,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  receiptIcon: {
    marginLeft: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  forwardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  forwardedText: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  storyReplyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  storyReplyThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  storyReplyTextThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  storyReplyThumbText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  storyReplyMeta: {
    flex: 1,
  },
  storyReplyTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  storyReplyCaption: {
    fontSize: 12,
    fontWeight: '400',
  },
  replyContainer: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  replyBar: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replySender: {
    fontSize: 11,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 12,
    fontWeight: '400',
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    minWidth: 180,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    marginLeft: 8,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 20,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  audioTime: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  docIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  docDetails: {
    flex: 1,
  },
  docFileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  docFileSize: {
    fontSize: 11,
    marginTop: 1,
  },
  docDownloadBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  deletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  deletedText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  reactionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  reactionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F2F3F5',
  },
  systemMessageWrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

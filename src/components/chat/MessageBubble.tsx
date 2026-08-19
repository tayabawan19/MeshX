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
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
  Radio,
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
  const { palette, chatThemes, themeMode } = useThemeStore();
  const { activeChatId, openMediaViewer } = useChatStore();

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(
    message.audioDuration ? message.audioDuration * 1000 : 0
  );
  const soundRef = useRef<Audio.Sound | null>(null);

  // Clay Squish & Pop-In Values
  const scale = useSharedValue(animateEntrance ? 0.85 : 1);
  const scaleY = useSharedValue(animateEntrance ? 0.85 : 1);

  useEffect(() => {
    if (animateEntrance) {
      scale.value = withSequence(
        withSpring(1.06, { damping: 10, stiffness: 180 }),
        withSpring(1.0, { damping: 12, stiffness: 200 })
      );
      scaleY.value = withSequence(
        withSpring(0.96, { damping: 10, stiffness: 180 }),
        withSpring(1.0, { damping: 12, stiffness: 200 })
      );
    }
  }, [animateEntrance]);

  const handlePressIn = () => {
    if (isSelectionMode) return;
    scale.value = withSpring(0.95, { damping: 14, stiffness: 240 });
    scaleY.value = withSpring(0.93, { damping: 14, stiffness: 240 });
  };

  const handlePressOut = () => {
    if (isSelectionMode) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    scaleY.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scale.value }, { scaleY: scaleY.value }],
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

    console.log('[VoicePlayer] Toggled audio playback for message:', {
      messageId: message.id || message._id,
      mediaUrl: message.mediaUrl,
      isMe,
    });

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
      <View style={styles.systemMessageContainer}>
        <View style={[styles.systemPill, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
          <Text style={[styles.systemMessageText, { color: palette.textSecondary }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const currentChatTheme = activeChatId ? chatThemes[activeChatId] : undefined;
  const sentGradient: [string, string] = currentChatTheme?.gradient || ['#8B7FD1', '#7B93D6'];
  const receivedColor = currentChatTheme?.receivedColor || (themeMode === 'dark' ? '#222234' : '#F5F5FC');

  const bubbleRadius = 26;
  const sentBorderRadius = {
    borderTopLeftRadius: bubbleRadius,
    borderTopRightRadius: isFirstInGroup ? bubbleRadius : 10,
    borderBottomLeftRadius: bubbleRadius,
    borderBottomRightRadius: isLastInGroup ? 6 : bubbleRadius,
  };

  const receivedBorderRadius = {
    borderTopLeftRadius: isFirstInGroup ? bubbleRadius : 10,
    borderTopRightRadius: bubbleRadius,
    borderBottomLeftRadius: isLastInGroup ? 6 : bubbleRadius,
    borderBottomRightRadius: bubbleRadius,
  };

  const handleBubblePress = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(message);
    }
  };

  const handleLongPress = () => {
    triggerHaptic('heavy');
    if (onLongPress) onLongPress(message);
  };

  const renderReadStatus = () => {
    if (!isMe) return null;
    if (message.status === 'read') {
      return <CheckCheck size={14} color={palette.readReceiptBlue} style={styles.receiptIcon} />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck size={14} color="#A5A5BA" style={styles.receiptIcon} />;
    }
    return <Check size={14} color="#A5A5BA" style={styles.receiptIcon} />;
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
                backgroundColor: palette.surfaceElevated,
                borderColor: palette.clayHighlight,
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
          <Ban size={15} color={isMe ? 'rgba(255,255,255,0.7)' : palette.textMuted} style={{ marginRight: 6 }} />
          <Text
            style={[
              styles.deletedText,
              { color: isMe ? 'rgba(255,255,255,0.85)' : palette.textMuted },
            ]}
          >
            This message was deleted
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.innerContent}>
        {/* Forwarded Header Indicator */}
        {message.isForwarded && (
          <View style={styles.forwardedBadge}>
            <CornerUpRight size={12} color={isMe ? 'rgba(255,255,255,0.85)' : palette.primaryLight} style={{ marginRight: 4 }} />
            <Text style={[styles.forwardedText, { color: isMe ? 'rgba(255,255,255,0.85)' : palette.primaryLight }]}>
              {(message.forwardCount || 0) >= 5 ? 'Forwarded many times' : 'Forwarded'}
            </Text>
          </View>
        )}

        {/* Sender Name in Group Chat */}
        {!isMe && senderName && isFirstInGroup && (
          <Text style={[styles.senderName, { color: palette.primaryLight }]}>{senderName}</Text>
        )}

        {/* Story Reply Preview Card */}
        {message.storyReply && (
          <View style={[styles.storyReplyCard, { backgroundColor: isMe ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }]}>
            {message.storyReply.mediaUrl ? (
              <Image source={{ uri: message.storyReply.mediaUrl }} style={styles.storyReplyThumbnail} />
            ) : (
              <View style={[styles.storyReplyTextThumb, { backgroundColor: palette.primary }]}>
                <Text style={styles.storyReplyThumbText}>Story</Text>
              </View>
            )}
            <View style={styles.storyReplyMeta}>
              <Text style={[styles.storyReplyTitle, { color: isMe ? '#FFFFFF' : palette.primaryLight }]}>Story reply</Text>
              <Text style={[styles.storyReplyCaption, { color: isMe ? 'rgba(255,255,255,0.85)' : palette.textSecondary }]} numberOfLines={1}>
                {message.storyReply.caption || 'Status story'}
              </Text>
            </View>
          </View>
        )}

        {/* Standard Reply Preview */}
        {message.replyTo && (
          <View style={[styles.replyContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)' }]}>
            <View style={styles.replyBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replySender}>{message.replyTo.senderName || 'Replying'}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
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
            >
              <View
                style={[
                  styles.voicePlayBtn,
                  {
                    backgroundColor: isMe ? 'rgba(255,255,255,0.32)' : palette.primary,
                    borderTopColor: palette.clayHighlight,
                  },
                ]}
              >
                {isLoadingAudio ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : isPlayingAudio ? (
                  <Pause size={18} color="#FFFFFF" />
                ) : (
                  <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                )}
              </View>
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
                          height: (h / 100) * 22,
                          backgroundColor: isMe
                            ? isFilled
                              ? '#FFFFFF'
                              : 'rgba(255,255,255,0.45)'
                            : isFilled
                            ? palette.primary
                            : palette.border,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.audioTime, { color: isMe ? 'rgba(255,255,255,0.9)' : palette.textMuted }]}>
                {isPlayingAudio
                  ? `${formatCallDuration(currentSeconds)} / ${formatCallDuration(totalDurationSeconds)}`
                  : formatCallDuration(totalDurationSeconds)}
              </Text>
            </View>
          </View>
        )}

        {/* Document Message */}
        {message.type === 'document' && (
          <View style={styles.documentContainer}>
            <FileText size={28} color={isMe ? '#FFFFFF' : palette.primary} />
            <View style={styles.documentMeta}>
              <Text style={[styles.documentName, { color: isMe ? '#FFFFFF' : palette.textPrimary }]}>
                {message.mediaFileName || 'Attachment.pdf'}
              </Text>
              <Text style={[styles.documentSize, { color: isMe ? 'rgba(255,255,255,0.75)' : palette.textMuted }]}>
                {message.mediaFileSize || '2.4 MB'}
              </Text>
            </View>
          </View>
        )}

        {/* Message Text */}
        {message.text ? (
          <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : palette.receivedText }]}>
            {message.text}
          </Text>
        ) : null}

        {/* Timestamp, Edited Badge & Delivery Receipt */}
        <View style={styles.metaContainer}>
          {message.isEdited && (
            <Text style={[styles.editedTag, { color: isMe ? 'rgba(255,255,255,0.75)' : palette.textMuted }]}>
              edited{' '}
            </Text>
          )}
          <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.78)' : palette.textMuted }]}>
            {formatMessageTime(Number(message.createdAt) || Date.now())}
          </Text>
          {renderReadStatus()}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { marginBottom: isLastInGroup ? 8 : 3 }]}>
      <View style={[styles.bubbleRow, isMe ? styles.sentRow : styles.receivedRow]}>
        {/* Multi-Select Checkbox */}
        {isSelectionMode && (
          <TouchableOpacity
            onPress={() => onToggleSelect && onToggleSelect(message)}
            style={[
              styles.selectionCheckbox,
              {
                borderColor: isSelected ? palette.primary : palette.border,
                backgroundColor: isSelected ? palette.primary : 'transparent',
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
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            delayLongPress={350}
          >
            <View style={styles.bubbleShadowOuter}>
              {isMe ? (
                <LinearGradient
                  colors={sentGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.bubble,
                    sentBorderRadius,
                    {
                      borderTopColor: 'rgba(255, 255, 255, 0.35)',
                      borderLeftColor: 'rgba(255, 255, 255, 0.28)',
                      borderBottomColor: 'rgba(0, 0, 0, 0.32)',
                      borderRightColor: 'rgba(0, 0, 0, 0.22)',
                    },
                  ]}
                >
                  {renderContent()}
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.bubble,
                    receivedBorderRadius,
                    {
                      backgroundColor: receivedColor,
                      borderTopColor: palette.clayHighlight,
                      borderLeftColor: palette.clayHighlight,
                      borderBottomColor: 'rgba(0, 0, 0, 0.40)',
                      borderRightColor: 'rgba(0, 0, 0, 0.25)',
                    },
                  ]}
                >
                  {renderContent()}
                </View>
              )}

              {/* Clay Nub Tail */}
              {isLastInGroup && !isDeleted && (
                <View
                  style={[
                    styles.clayTailNub,
                    isMe ? styles.sentTailNub : styles.receivedTailNub,
                    {
                      backgroundColor: isMe ? sentGradient[1] : receivedColor,
                      borderTopColor: isMe ? 'rgba(255, 255, 255, 0.3)' : palette.clayHighlight,
                      borderBottomColor: 'rgba(0, 0, 0, 0.35)',
                    },
                  ]}
                />
              )}
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
    marginHorizontal: 14,
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
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleWrapper: {
    maxWidth: SCREEN_WIDTH * 0.77,
  },
  sentWrapper: {
    alignSelf: 'flex-end',
  },
  receivedWrapper: {
    alignSelf: 'flex-start',
  },
  bubbleShadowOuter: {
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.8,
    overflow: 'hidden',
  },
  innerContent: {
    justifyContent: 'center',
  },
  forwardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardedText: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  deletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  storyReplyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    marginBottom: 6,
  },
  storyReplyThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 8,
  },
  storyReplyTextThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  storyReplyThumbText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  storyReplyMeta: {
    flex: 1,
  },
  storyReplyTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  storyReplyCaption: {
    fontSize: 12,
  },
  replyContainer: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 12,
    marginBottom: 6,
  },
  replyBar: {
    width: 3.5,
    backgroundColor: '#7B93D6',
    borderRadius: 3,
    marginRight: 8,
  },
  replySender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B93D6',
  },
  replyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  imageWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  messageImage: {
    width: 220,
    height: 160,
    resizeMode: 'cover',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 175,
  },
  voicePlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  waveformContainer: {
    flex: 1,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 3,
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 3,
  },
  audioTime: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '700',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  documentMeta: {
    marginLeft: 10,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  documentSize: {
    fontSize: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  editedTag: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '600',
  },
  receiptIcon: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: -4,
    marginBottom: 4,
    marginHorizontal: 8,
  },
  reactionChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 16,
    borderWidth: 1.2,
    elevation: 2,
  },
  reactionText: {
    fontSize: 12,
  },
  clayTailNub: {
    position: 'absolute',
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  sentTailNub: {
    right: 4,
  },
  receivedTailNub: {
    left: 4,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: '85%',
  },
  systemMessageText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

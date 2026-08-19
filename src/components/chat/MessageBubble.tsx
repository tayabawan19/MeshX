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
import { getContactAccent } from '../../theme/colors';

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

  // Bold Maximalist Pop-In Bounce
  const scale = useSharedValue(animateEntrance ? 0.7 : 1);
  const pressedOffset = useSharedValue(0);

  useEffect(() => {
    if (animateEntrance) {
      scale.value = withSequence(
        withSpring(1.14, { damping: 10, stiffness: 240 }),
        withSpring(0.96, { damping: 12, stiffness: 220 }),
        withSpring(1.0, { damping: 14, stiffness: 200 })
      );
    }
  }, [animateEntrance]);

  const handlePressIn = () => {
    if (isSelectionMode) return;
    pressedOffset.value = withSpring(2, { damping: 14, stiffness: 280 });
  };

  const handlePressOut = () => {
    if (isSelectionMode) return;
    pressedOffset.value = withSpring(0, { damping: 12, stiffness: 220 });
  };

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: pressedOffset.value },
      { translateY: pressedOffset.value },
    ],
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
        <View style={[styles.systemPill, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
          <Text style={[styles.systemMessageText, { color: palette.textSecondary }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Assigned Bold Accent for current chat
  const currentChatTheme = activeChatId ? chatThemes[activeChatId] : undefined;
  const sentSolidColor = currentChatTheme?.color || (isMe ? palette.primary : palette.accent);
  const receivedSolidColor = palette.receivedBubble; // #1C1A2E

  // Is text high contrast on sent color
  const sentTextColor = (sentSolidColor === '#C6FF3D' || sentSolidColor === '#FFD23F' || sentSolidColor === '#00F0FF')
    ? '#100F17'
    : '#FFFFFF';

  const bubbleRadius = 22;
  const sentBorderRadius = {
    borderTopLeftRadius: bubbleRadius,
    borderTopRightRadius: isFirstInGroup ? bubbleRadius : 8,
    borderBottomLeftRadius: bubbleRadius,
    borderBottomRightRadius: isLastInGroup ? 4 : bubbleRadius,
  };

  const receivedBorderRadius = {
    borderTopLeftRadius: isFirstInGroup ? bubbleRadius : 8,
    borderTopRightRadius: bubbleRadius,
    borderBottomLeftRadius: isLastInGroup ? 4 : bubbleRadius,
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
      return <CheckCheck size={15} color={palette.readReceiptBlue} style={styles.receiptIcon} />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck size={15} color={sentTextColor === '#100F17' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'} style={styles.receiptIcon} />;
    }
    return <Check size={15} color={sentTextColor === '#100F17' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'} style={styles.receiptIcon} />;
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
          <View key={emoji} style={styles.reactionChipWrapper}>
            <View style={styles.reactionHardShadow} />
            <View style={[styles.reactionChip, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}>
              <Text style={styles.reactionText}>
                {emoji} {count > 1 ? count : ''}
              </Text>
            </View>
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
          <Ban size={16} color={isMe ? sentTextColor : palette.textMuted} style={{ marginRight: 6 }} />
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
        {/* Forwarded Header Indicator */}
        {message.isForwarded && (
          <View style={styles.forwardedBadge}>
            <CornerUpRight size={13} color={isMe ? sentTextColor : palette.secondary} style={{ marginRight: 4 }} />
            <Text style={[styles.forwardedText, { color: isMe ? sentTextColor : palette.secondary }]}>
              {(message.forwardCount || 0) >= 5 ? 'Forwarded many times' : 'Forwarded'}
            </Text>
          </View>
        )}

        {/* Sender Name in Group Chat */}
        {!isMe && senderName && isFirstInGroup && (
          <Text style={[styles.senderName, { color: getContactAccent(senderName) }]}>{senderName}</Text>
        )}

        {/* Story Reply Preview Card */}
        {Boolean(
          message.storyReply &&
            (message.storyReply.storyId ||
              (typeof message.storyReply.mediaUrl === 'string' && message.storyReply.mediaUrl.trim().length > 0) ||
              (typeof message.storyReply.caption === 'string' && message.storyReply.caption.trim().length > 0))
        ) && (
          <View style={[styles.storyReplyCard, { backgroundColor: isMe ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.06)', borderColor: '#000000' }]}>
            {message.storyReply?.mediaUrl ? (
              <Image source={{ uri: message.storyReply.mediaUrl }} style={styles.storyReplyThumbnail} />
            ) : (
              <View style={[styles.storyReplyTextThumb, { backgroundColor: palette.primary }]}>
                <Text style={styles.storyReplyThumbText}>Story</Text>
              </View>
            )}
            <View style={styles.storyReplyMeta}>
              <Text style={[styles.storyReplyTitle, { color: isMe ? sentTextColor : palette.secondary }]}>Story reply</Text>
              <Text style={[styles.storyReplyCaption, { color: isMe ? sentTextColor : palette.textSecondary }]} numberOfLines={1}>
                {message.storyReply?.caption || 'Status story'}
              </Text>
            </View>
          </View>
        )}

        {/* Standard Reply Preview */}
        {message.replyTo && (
          <View style={[styles.replyContainer, { backgroundColor: isMe ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)', borderColor: '#000000' }]}>
            <View style={[styles.replyBar, { backgroundColor: isMe ? sentTextColor : palette.secondary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replySender, { color: isMe ? sentTextColor : palette.secondary }]}>{message.replyTo.senderName || 'Replying'}</Text>
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
            <View style={[styles.imageWrapper, { borderColor: '#000000' }]}>
              <Image source={{ uri: message.mediaUrl }} style={styles.messageImage} />
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* Voice Note */}
        {message.type === 'voice' && (
          <View style={styles.voiceContainer}>
            <View style={styles.voicePlayBtnWrapper}>
              <View style={styles.voicePlayShadow} />
              <TouchableOpacity
                onPress={toggleAudio}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.voicePlayBtn,
                  {
                    backgroundColor: isMe ? (sentTextColor === '#100F17' ? '#100F17' : '#FFFFFF') : palette.primary,
                    borderColor: '#000000',
                  },
                ]}
              >
                {isLoadingAudio ? (
                  <ActivityIndicator size="small" color={isMe ? sentSolidColor : '#FFFFFF'} />
                ) : isPlayingAudio ? (
                  <Pause size={18} color={isMe ? sentSolidColor : '#FFFFFF'} />
                ) : (
                  <Play size={18} color={isMe ? sentSolidColor : '#FFFFFF'} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </View>
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
                              ? sentTextColor
                              : 'rgba(0,0,0,0.25)'
                            : isFilled
                            ? palette.secondary
                            : palette.border,
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
          <View style={[styles.documentContainer, { borderColor: '#000000' }]}>
            <View style={[styles.docIconWrapper, { backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : palette.accent, borderColor: '#000000' }]}>
              <FileText size={22} color="#FFFFFF" />
            </View>
            <View style={styles.docDetails}>
              <Text style={[styles.docFileName, { color: isMe ? sentTextColor : palette.textPrimary }]} numberOfLines={1}>
                {message.mediaFileName || 'Document'}
              </Text>
              <Text style={[styles.docFileSize, { color: isMe ? sentTextColor : palette.textMuted }]}>
                {message.mediaFileSize || '1.2 MB'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.docDownloadBtn, { backgroundColor: palette.secondary, borderColor: '#000000' }]}>
              <Download size={16} color="#100F17" />
            </TouchableOpacity>
          </View>
        )}

        {/* Text Message */}
        {message.text ? (
          <Text
            style={[
              styles.messageText,
              {
                color: isMe ? sentTextColor : palette.textPrimary,
              },
            ]}
          >
            {message.text}
          </Text>
        ) : null}

        {/* Footer: Timestamp, Edited status & Read Receipt */}
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
    <View style={[styles.container, { marginBottom: isLastInGroup ? 8 : 4 }]}>
      <View style={[styles.bubbleRow, isMe ? styles.sentRow : styles.receivedRow]}>
        {/* Multi-Select Checkbox */}
        {isSelectionMode && (
          <TouchableOpacity
            onPress={() => onToggleSelect && onToggleSelect(message)}
            style={[
              styles.selectionCheckbox,
              {
                borderColor: '#000000',
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
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            delayLongPress={350}
          >
            <View style={styles.bubbleShadowOuter}>
              {/* Hard Offset Shadow */}
              <View
                style={[
                  styles.hardBubbleShadow,
                  isMe ? sentBorderRadius : receivedBorderRadius,
                ]}
              />

              {/* Main Bubble Body */}
              <View
                style={[
                  styles.bubble,
                  isMe ? sentBorderRadius : receivedBorderRadius,
                  {
                    backgroundColor: isMe ? sentSolidColor : receivedSolidColor,
                    borderColor: '#000000',
                    borderWidth: 2,
                  },
                ]}
              >
                {renderContent()}
              </View>

              {/* Geometric Tail Nub */}
              {isLastInGroup && !isDeleted && (
                <View
                  style={[
                    styles.tailNub,
                    isMe ? styles.sentTailNub : styles.receivedTailNub,
                    {
                      backgroundColor: isMe ? sentSolidColor : receivedSolidColor,
                      borderColor: '#000000',
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
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
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
  bubbleShadowOuter: {
    position: 'relative',
  },
  hardBubbleShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    zIndex: 0,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 1,
  },
  tailNub: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    zIndex: 2,
  },
  sentTailNub: {
    right: -5,
    transform: [{ rotate: '45deg' }],
  },
  receivedTailNub: {
    left: -5,
    transform: [{ rotate: '45deg' }],
  },
  innerContent: {},
  messageText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '700',
  },
  editedIndicator: {
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  receiptIcon: {
    marginLeft: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  forwardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardedText: {
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  storyReplyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
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
    fontSize: 10,
    fontWeight: '900',
  },
  storyReplyMeta: {
    flex: 1,
  },
  storyReplyTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  storyReplyCaption: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyContainer: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  replyBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  replySender: {
    fontSize: 11,
    fontWeight: '800',
  },
  replyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 6,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 190,
  },
  voicePlayBtnWrapper: {
    position: 'relative',
  },
  voicePlayShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
  },
  voicePlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  waveformContainer: {
    flex: 1,
    marginLeft: 10,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 2,
  },
  audioTime: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 6,
  },
  docIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  docDetails: {
    flex: 1,
  },
  docFileName: {
    fontSize: 13,
    fontWeight: '800',
  },
  docFileSize: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  docDownloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  deletedText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  reactionChipWrapper: {
    position: 'relative',
  },
  reactionHardShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  reactionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    zIndex: 1,
  },
  reactionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  systemMessageWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  systemMessageText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

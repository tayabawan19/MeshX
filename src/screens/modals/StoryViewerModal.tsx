import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { X, Eye, Trash2, Send } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_STORY_DURATION = 15000;

interface StoryViewerModalProps {
  visible: boolean;
  storyGroup: { user: any; stories: any[]; isMine?: boolean } | null;
  initialIndex?: number;
  onClose: () => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
}

interface StoryProgressBarProps {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}

const StoryProgressBar: React.FC<StoryProgressBarProps> = ({ index, currentIndex, progress }) => {
  const animatedFillStyle = useAnimatedStyle(() => {
    if (index === currentIndex) {
      return { width: `${progress.value * 100}%` };
    }
    return { width: index < currentIndex ? '100%' : '0%' };
  });

  return (
    <View style={styles.segmentTrack}>
      <Animated.View style={[styles.segmentFill, animatedFillStyle]} />
    </View>
  );
};

const getStoryTimeAgo = (createdAt: any): string => {
  if (!createdAt) return 'Just now';
  const time = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  if (isNaN(time)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  storyGroup,
  initialIndex = 0,
  onClose,
  onNextGroup,
  onPrevGroup,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const currentUser = useAuthStore((state) => state.user);
  const { viewStoryApi, deleteStoryApi, createNewChat, sendMessage } = useChatStore();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const videoRef = useRef<Video | null>(null);

  const stories = storyGroup?.stories || [];
  const currentStory = stories[currentIndex] || stories[0];
  const currentUserId = currentUser?.id || currentUser?._id;
  const isMine =
    storyGroup?.isMine ||
    (currentStory?.userId && (currentStory.userId._id === currentUserId || currentStory.userId === currentUserId));

  const progress = useSharedValue(0);

  const handleStoryComplete = useCallback(
    (completedIndex: number) => {
      if (completedIndex < stories.length - 1) {
        const nextIdx = completedIndex + 1;
        setCurrentIndex(nextIdx);
        startProgress(nextIdx);
      } else if (onNextGroup) {
        onNextGroup();
      } else {
        onClose();
      }
    },
    [stories.length, onNextGroup, onClose]
  );

  const startProgress = useCallback(
    (index: number) => {
      cancelAnimation(progress);
      progress.value = 0;

      const targetStory = stories[index];
      if (targetStory?.type === 'video') {
        return;
      }

      progress.value = withTiming(1, { duration: IMAGE_STORY_DURATION, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(handleStoryComplete)(index);
        }
      });
    },
    [stories, handleStoryComplete]
  );

  useEffect(() => {
    if (visible && stories.length > 0) {
      const startIndex = Math.min(Math.max(0, initialIndex), stories.length - 1);
      setCurrentIndex(startIndex);
      startProgress(startIndex);
    } else {
      cancelAnimation(progress);
    }
  }, [visible, storyGroup, initialIndex]);

  useEffect(() => {
    if (currentStory && visible && !isMine) {
      const sId = currentStory.id || currentStory._id;
      if (sId && typeof sId === 'string' && sId.length >= 12) {
        const timer = setTimeout(() => {
          viewStoryApi(sId);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, visible, isMine]);

  const handlePause = () => {
    setIsPaused(true);
    cancelAnimation(progress);
    if (currentStory?.type === 'video' && videoRef.current) {
      videoRef.current.pauseAsync().catch(() => {});
    }
  };

  const handleResume = () => {
    if (isReplying) return;
    setIsPaused(false);

    if (currentStory?.type === 'video') {
      if (videoRef.current) {
        videoRef.current.playAsync().catch(() => {});
      }
      return;
    }

    const currentProgressVal = progress.value || 0;
    const remainingTime = Math.max(200, (1 - currentProgressVal) * IMAGE_STORY_DURATION);
    progress.value = withTiming(1, { duration: remainingTime, easing: Easing.linear }, (finished) => {
      if (finished) {
        runOnJS(handleStoryComplete)(currentIndex);
      }
    });
  };

  const handleVideoPlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.durationMillis && status.durationMillis > 0) {
      const currentPos = status.positionMillis || 0;
      progress.value = Math.min(1, currentPos / status.durationMillis);
    }

    if (status.didJustFinish) {
      runOnJS(handleStoryComplete)(currentIndex);
    }
  };

  const handleNext = () => {
    triggerHaptic('light');
    if (currentIndex < stories.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      startProgress(nextIdx);
    } else if (onNextGroup) {
      onNextGroup();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      startProgress(prevIdx);
    } else if (onPrevGroup) {
      onPrevGroup();
    }
  };

  const handleDelete = async () => {
    if (currentStory) {
      triggerHaptic('heavy');
      cancelAnimation(progress);
      const sId = currentStory.id || currentStory._id;
      if (sId) {
        await deleteStoryApi(sId);
      }
      onClose();
    }
  };

  const handleSendStoryReply = async () => {
    if (!replyText.trim() || !storyGroup?.user) return;
    triggerHaptic('success');
    const targetUserId = storyGroup.user._id || storyGroup.user.id;
    const chatId = await createNewChat(targetUserId);

    if (chatId) {
      sendMessage(replyText.trim(), 'text', undefined, {
        storyReply: {
          storyId: currentStory._id || currentStory.id,
          mediaUrl: currentStory.mediaUrl || '',
          caption: currentStory.caption || currentStory.text || '',
          type: currentStory.type,
        },
      }, chatId);
    }

    setReplyText('');
    setIsReplying(false);
    handleResume();
  };

  if (!visible || !storyGroup || !stories.length || !currentStory) return null;

  const storyUser = storyGroup.user || {};
  const viewedByList = Array.isArray(currentStory.viewedBy) ? currentStory.viewedBy : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Story Media / Video / Text */}
        {currentStory.type === 'text' ? (
          <View
            style={[styles.fullScreenGradient, { backgroundColor: currentStory.backgroundColor || '#5865F2' }]}
          >
            <Text style={styles.textStoryContent}>{currentStory.caption || currentStory.text || ''}</Text>
          </View>
        ) : currentStory.type === 'video' && currentStory.mediaUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.mediaUrl }}
            style={styles.fullScreenMedia}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!isPaused && !isReplying}
            isLooping={false}
            useNativeControls={false}
            onPlaybackStatusUpdate={handleVideoPlaybackStatus}
          />
        ) : (
          <Image
            source={{
              uri:
                currentStory.mediaUrl ||
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
            }}
            style={styles.fullScreenMedia}
            resizeMode="contain"
          />
        )}

        {/* Story Overlay Controls */}
        <View style={styles.overlay}>
          {/* Top Progress Segment Bars */}
          <View style={styles.progressContainer}>
            {stories.map((s, idx) => (
              <StoryProgressBar
                key={s?.id || s?._id || `bar_${idx}`}
                index={idx}
                currentIndex={currentIndex}
                progress={progress}
              />
            ))}
          </View>

          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.userMeta}>
              <Image
                source={{
                  uri:
                    storyUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                }}
                style={styles.headerAvatar}
              />
              <View>
                <Text style={styles.headerName}>{storyUser.name || 'User'}</Text>
                <Text style={styles.headerTime}>{getStoryTimeAgo(currentStory.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {isMine && (
                <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                  <Trash2 size={18} color="#F23F42" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Caption Overlay */}
          {currentStory.type !== 'text' && currentStory.caption ? (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText}>{currentStory.caption}</Text>
            </View>
          ) : null}

          {/* Touch Area for Left/Right Navigation */}
          {!isReplying && (
            <View style={styles.touchNavigationArea}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handlePrev}
                onLongPress={handlePause}
                onPressOut={handleResume}
                style={styles.touchHalf}
              />
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleNext}
                onLongPress={handlePause}
                onPressOut={handleResume}
                style={styles.touchHalf}
              />
            </View>
          )}

          {/* Owner Views or Viewer Reply Bar */}
          {isMine ? (
            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={() => setShowViewersList(!showViewersList)}
                style={[styles.viewersBtn, { backgroundColor: palette.surfaceElevated }]}
              >
                <Eye size={15} color="#FFFFFF" />
                <Text style={styles.viewersCount}>{viewedByList.length} Views</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.replyRow}>
              <View style={[styles.replyInputSlot, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TextInput
                  placeholder={`Reply to ${storyUser.name || 'User'}...`}
                  placeholderTextColor={palette.textMuted}
                  value={replyText}
                  onChangeText={setReplyText}
                  onFocus={() => {
                    setIsReplying(true);
                    handlePause();
                  }}
                  onBlur={() => {
                    setIsReplying(false);
                    handleResume();
                  }}
                  style={[styles.replyTextInput, { color: palette.textPrimary }]}
                />
                {replyText.trim().length > 0 && (
                  <TouchableOpacity onPress={handleSendStoryReply} style={[styles.sendReplyBtn, { backgroundColor: palette.primary }]}>
                    <Send size={15} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Viewers Sheet */}
          {showViewersList && (
            <View style={[styles.viewersSheet, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
              <Text style={[styles.viewersSheetTitle, { color: palette.textPrimary }]}>Viewed by ({viewedByList.length})</Text>
              <ScrollView style={{ maxHeight: 180 }}>
                {viewedByList.length === 0 ? (
                  <Text style={{ color: palette.textMuted, fontStyle: 'italic', paddingVertical: 8 }}>No views yet</Text>
                ) : (
                  viewedByList.map((v: any, idx: number) => {
                    const uName = v.name || v.userId?.name || 'Viewer';
                    const uAvatar = v.avatarUrl || v.userId?.avatarUrl;
                    return (
                      <View key={idx} style={styles.viewerRow}>
                        <Image
                          source={{
                            uri:
                              uAvatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                          }}
                          style={styles.viewerAvatar}
                        />
                        <Text style={[styles.viewerName, { color: palette.textPrimary }]}>{uName}</Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F22',
  },
  fullScreenMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#1E1F22',
  },
  fullScreenGradient: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  textStoryContent: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 8,
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#5865F2', // Discord Blurple
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  headerName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  headerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  captionContainer: {
    backgroundColor: 'rgba(30, 31, 34, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  touchNavigationArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: -1,
  },
  touchHalf: {
    flex: 1,
    height: '100%',
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  viewersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  viewersCount: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  replyRow: {
    marginHorizontal: 14,
    marginBottom: 8,
  },
  replyInputSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  replyTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
  },
  sendReplyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewersSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: 220,
  },
  viewersSheetTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  viewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  viewerName: {
    fontSize: 13,
    fontWeight: '600',
  },
});

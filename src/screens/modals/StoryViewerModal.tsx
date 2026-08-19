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
import { X, Eye, Trash2, Send } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryViewerModalProps {
  visible: boolean;
  storyGroup: { user: any; stories: any[]; isMine?: boolean } | null;
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
  onClose,
  onNextGroup,
  onPrevGroup,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const currentUser = useAuthStore((state) => state.user);
  const { viewStoryApi, deleteStoryApi, createNewChat, sendMessage } = useChatStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

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
      progress.value = withTiming(1, { duration: 5000, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(handleStoryComplete)(index);
        }
      });
    },
    [handleStoryComplete]
  );

  useEffect(() => {
    if (visible && stories.length > 0) {
      setCurrentIndex(0);
      startProgress(0);
    } else {
      cancelAnimation(progress);
    }
  }, [visible, storyGroup]);

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
  };

  const handleResume = () => {
    if (isReplying) return;
    setIsPaused(false);
    const currentProgressVal = progress.value || 0;
    const remainingTime = Math.max(200, (1 - currentProgressVal) * 5000);
    progress.value = withTiming(1, { duration: remainingTime, easing: Easing.linear }, (finished) => {
      if (finished) {
        runOnJS(handleStoryComplete)(currentIndex);
      }
    });
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
        {/* Story Media / Text Gradient */}
        {currentStory.type === 'text' ? (
          <View
            style={[styles.fullScreenGradient, { backgroundColor: currentStory.backgroundColor || '#2E4BFF' }]}
          >
            <Text style={styles.textStoryContent}>{currentStory.caption || currentStory.text || ''}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: currentStory.mediaUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80' }}
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
                  <Trash2 size={20} color="#FF4D5E" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={24} color="#FFFFFF" />
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
              <View style={styles.viewersShadow} />
              <TouchableOpacity
                onPress={() => setShowViewersList(!showViewersList)}
                style={styles.viewersBtn}
              >
                <Eye size={18} color="#100F17" />
                <Text style={styles.viewersCount}>{viewedByList.length} Views</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.replyRow}>
              <View style={styles.replyInputShadow} />
              <View style={styles.replyInputSlot}>
                <TextInput
                  placeholder={`Reply to ${storyUser.name || 'User'}...`}
                  placeholderTextColor="#A5A5BA"
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
                  style={styles.replyTextInput}
                />
                {replyText.trim().length > 0 && (
                  <TouchableOpacity onPress={handleSendStoryReply} style={styles.sendReplyBtn}>
                    <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Viewers Sheet (for my story) */}
          {showViewersList && (
            <View style={styles.viewersSheet}>
              <Text style={styles.viewersSheetTitle}>Viewed by ({viewedByList.length})</Text>
              <ScrollView style={{ maxHeight: 180 }}>
                {viewedByList.length === 0 ? (
                  <Text style={{ color: '#A5A5BA', fontStyle: 'italic', paddingVertical: 8 }}>No views yet</Text>
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
                        <Text style={styles.viewerName}>{uName}</Text>
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
    backgroundColor: '#000000',
  },
  fullScreenMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
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
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
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
    gap: 5,
    marginBottom: 8,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#C6FF3D', // Electric Lime
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    marginRight: 10,
  },
  headerName: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  headerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  captionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    alignSelf: 'center',
    marginBottom: 20,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    marginBottom: 10,
    position: 'relative',
  },
  viewersShadow: {
    position: 'absolute',
    top: 3,
    left: '35%',
    width: 130,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
  },
  viewersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C6FF3D', // Electric Lime
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#000000',
    zIndex: 1,
  },
  viewersCount: {
    color: '#100F17',
    fontWeight: '900',
    fontSize: 13,
  },
  replyRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    position: 'relative',
  },
  replyInputShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 24,
    backgroundColor: '#000000',
  },
  replyInputSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1A2E',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 14,
    height: 48,
    zIndex: 1,
  },
  replyTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendReplyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4D5E', // Hot Coral
    borderWidth: 1.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewersSheet: {
    backgroundColor: '#1C1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    maxHeight: 240,
  },
  viewersSheetTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  viewerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#000000',
    marginRight: 10,
  },
  viewerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

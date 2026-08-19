import React, { useState, useEffect } from 'react';
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
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Eye, Trash2, Send } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCallDuration } from '../../utils/dateUtils';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryViewerModalProps {
  visible: boolean;
  storyGroup: { user: any; stories: any[]; isMine?: boolean } | null;
  onClose: () => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
}

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
  const currentStory = stories[currentIndex];
  const isMine =
    storyGroup?.isMine ||
    currentStory?.userId?._id === currentUser?.id ||
    currentStory?.userId === currentUser?.id;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible && currentStory) {
      setCurrentIndex(0);
      startProgress(0);
    }
  }, [visible, storyGroup]);

  useEffect(() => {
    if (currentStory && visible) {
      const sId = currentStory.id || currentStory._id;
      if (sId) {
        const timer = setTimeout(() => {
          viewStoryApi(sId);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, visible, storyGroup]);

  const startProgress = (index: number) => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 5000, easing: Easing.linear }, (finished) => {
      if (finished) {
        if (index < stories.length - 1) {
          setCurrentIndex(index + 1);
          startProgress(index + 1);
        } else if (onNextGroup) {
          onNextGroup();
        } else {
          onClose();
        }
      }
    });
  };

  const handlePause = () => {
    setIsPaused(true);
    cancelAnimation(progress);
  };

  const handleResume = () => {
    if (isReplying) return;
    setIsPaused(false);
    const remainingTime = (1 - progress.value) * 5000;
    progress.value = withTiming(1, { duration: remainingTime, easing: Easing.linear }, (finished) => {
      if (finished) {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(currentIndex + 1);
          startProgress(currentIndex + 1);
        } else if (onNextGroup) {
          onNextGroup();
        } else {
          onClose();
        }
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
      const sId = currentStory.id || currentStory._id;
      await deleteStoryApi(sId);
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

  if (!visible || !storyGroup || !currentStory) return null;

  const storyUser = storyGroup.user || {};
  const viewedByList = currentStory.viewedBy || [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Story Media / Text Gradient */}
        {currentStory.type === 'text' ? (
          <LinearGradient
            colors={[currentStory.backgroundColor || '#7C3AED', '#3B82F6']}
            style={styles.fullScreenGradient}
          >
            <Text style={styles.textStoryContent}>{currentStory.caption || currentStory.text}</Text>
          </LinearGradient>
        ) : (
          <Image source={{ uri: currentStory.mediaUrl }} style={styles.fullScreenMedia} />
        )}

        {/* Story Overlay Controls */}
        <View style={styles.overlay}>
          {/* Top Progress Segment Bars */}
          <View style={styles.progressContainer}>
            {stories.map((s, idx) => (
              <View key={idx} style={styles.segmentTrack}>
                {idx === currentIndex ? (
                  <Animated.View
                    style={[
                      styles.segmentFill,
                      useAnimatedStyle(() => ({ width: `${progress.value * 100}%` })),
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.segmentFill,
                      { width: idx < currentIndex ? '100%' : '0%' },
                    ]}
                  />
                )}
              </View>
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
                <Text style={styles.headerTime}>
                  {formatCallDuration(Math.floor((Date.now() - new Date(currentStory.createdAt).getTime()) / 1000))} ago
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {isMine && (
                <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                  <Trash2 size={20} color="#FFFFFF" />
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
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setShowViewersList(true);
              }}
              style={styles.viewerTrayTrigger}
            >
              <Eye size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.viewerCountText}>{viewedByList.length} views</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.replyBarContainer}>
              <TextInput
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
                placeholder="Reply to story..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.replyInput}
              />
              {replyText.trim().length > 0 && (
                <TouchableOpacity onPress={handleSendStoryReply} style={styles.replySendBtn}>
                  <Send size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Owner Viewers List Bottom Sheet */}
        <Modal visible={showViewersList} transparent animationType="slide" onRequestClose={() => setShowViewersList(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setShowViewersList(false)} style={styles.sheetOverlay}>
            <View style={[styles.viewersSheet, { backgroundColor: palette.surfaceElevated }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>
                  Viewed by {viewedByList.length}
                </Text>
                <TouchableOpacity onPress={() => setShowViewersList(false)}>
                  <X size={20} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.viewersList}>
                {viewedByList.length === 0 ? (
                  <Text style={[styles.emptyViewers, { color: palette.textMuted }]}>
                    No views yet. Share your story with friends!
                  </Text>
                ) : (
                  viewedByList.map((item: any, idx: number) => {
                    const u = item.userId || item;
                    return (
                      <View key={idx} style={styles.viewerItem}>
                        <Image source={{ uri: u.avatarUrl }} style={styles.viewerAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.viewerName, { color: palette.textPrimary }]}>
                            {u.name || 'User'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  fullScreenGradient: { flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', padding: 30 },
  textStoryContent: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  fullScreenMedia: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'contain', backgroundColor: '#000000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  progressContainer: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  segmentTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 4, overflow: 'hidden' },
  segmentFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  userMeta: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#FFFFFF', marginRight: 10 },
  headerName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 6 },
  captionContainer: { backgroundColor: 'rgba(20,20,30,0.85)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20, maxWidth: '90%', zIndex: 10 },
  captionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', textAlign: 'center' },
  touchNavigationArea: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 1 },
  touchHalf: { flex: 1 },
  viewerTrayTrigger: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,20,30,0.85)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.15)', zIndex: 10, marginBottom: 20 },
  viewerCountText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  replyBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,20,30,0.88)', borderRadius: 26, paddingHorizontal: 16, paddingVertical: 6, zIndex: 10, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  replyInput: { flex: 1, color: '#FFFFFF', fontSize: 15, height: 40 },
  replySendBtn: { padding: 8, backgroundColor: '#7C3AED', borderRadius: 18, marginLeft: 8 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  viewersSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', padding: 20, maxHeight: SCREEN_HEIGHT * 0.5 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '800' },
  viewersList: { marginTop: 8 },
  emptyViewers: { textAlign: 'center', marginVertical: 20, fontSize: 14 },
  viewerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  viewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  viewerName: { fontSize: 15, fontWeight: '600' },
});

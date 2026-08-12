import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  PanResponder,
  ScrollView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Eye, Trash2 } from 'lucide-react-native';
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
  const { viewStoryApi, deleteStoryApi } = useChatStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);

  const stories = storyGroup?.stories || [];
  const currentStory = stories[currentIndex];
  const isMine = storyGroup?.isMine || currentStory?.userId?._id === currentUser?.id || currentStory?.userId === currentUser?.id;

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
        // Auto-advance
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

  if (!visible || !storyGroup || !currentStory) return null;

  const storyUser = storyGroup.user || {};
  const viewedByList = currentStory.viewedBy || [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Background Render: Image, Video, or Text Gradient */}
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

          {/* Swipe Up / Viewer Count for Owner */}
          {isMine && (
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  fullScreenGradient: { flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', padding: 30 },
  textStoryContent: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  fullScreenMedia: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  progressContainer: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  segmentTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  segmentFill: { height: '100%', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  userMeta: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 6 },
  captionContainer: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, alignSelf: 'center', marginBottom: 60, maxWidth: '90%', zIndex: 10 },
  captionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', textAlign: 'center' },
  touchNavigationArea: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 1 },
  touchHalf: { flex: 1 },
  viewerTrayTrigger: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, zIndex: 10 },
  viewerCountText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  viewersSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: SCREEN_HEIGHT * 0.5 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  viewersList: { marginTop: 8 },
  emptyViewers: { textAlign: 'center', marginVertical: 20, fontSize: 14 },
  viewerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  viewerAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12 },
  viewerName: { fontSize: 15, fontWeight: '600' },
});

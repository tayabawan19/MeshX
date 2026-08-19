import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Plus, Type, Video as VideoIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../common/Avatar';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';

interface StoryAvatarRowProps {
  storyGroups: Array<{ user: any; stories: any[]; hasUnviewed: boolean }>;
  myStories: any[];
  onOpenStoryGroup: (user: any, stories: any[], isMine?: boolean, initialIndex?: number) => void;
  onCreateStory: () => void;
}

const getStoryTimeLabel = (createdAt: any): string => {
  if (!createdAt) return 'New';
  const time = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  if (isNaN(time)) return 'New';
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}d`;
};

export const StoryAvatarRow: React.FC<StoryAvatarRowProps> = ({
  storyGroups,
  myStories,
  onOpenStoryGroup,
  onCreateStory,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const user = useAuthStore((state) => state.user);

  return (
    <View style={[styles.container, { borderBottomColor: '#000000' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Add Story Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('selection');
            onCreateStory();
          }}
          style={styles.item}
        >
          <View style={styles.avatarWrapper}>
            <View style={styles.addWrapper}>
              <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
              <View style={styles.plusShadow} />
              <View
                style={[
                  styles.plusBadge,
                  {
                    backgroundColor: palette.primary,
                    borderColor: '#000000',
                  },
                ]}
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>
          </View>
          <Text style={[styles.nameText, { color: palette.textSecondary }]}>Add Status</Text>
        </TouchableOpacity>

        {/* 2. My Individual Statuses */}
        {myStories &&
          myStories.map((story, idx) => {
            const timeLabel = getStoryTimeLabel(story.createdAt);
            return (
              <TouchableOpacity
                key={story._id || story.id || `my_story_${idx}`}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light');
                  onOpenStoryGroup(user, myStories, true, idx);
                }}
                style={styles.item}
              >
                <View style={styles.avatarWrapper}>
                  <LinearGradient colors={['#FF4D5E', '#C6FF3D']} style={styles.storyDonutRing}>
                    <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                      {story.type === 'text' ? (
                        <View style={[styles.textThumbnail, { backgroundColor: story.backgroundColor || '#2E4BFF' }]}>
                          <Type size={18} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                      ) : story.mediaUrl ? (
                        <Image source={{ uri: story.mediaUrl }} style={styles.mediaThumbnail} />
                      ) : (
                        <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
                      )}
                    </View>
                  </LinearGradient>
                  {story.type === 'video' && (
                    <View style={styles.videoBadge}>
                      <VideoIcon size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.nameText, { color: palette.secondary }]} numberOfLines={1}>
                  My • {timeLabel}
                </Text>
              </TouchableOpacity>
            );
          })}

        {/* 3. Contacts' Individual Statuses */}
        {storyGroups.map((group) => {
          const u = group.user || {};
          const storiesList = group.stories || [];

          return storiesList.map((story, sIdx) => {
            const timeLabel = getStoryTimeLabel(story.createdAt);
            const isUnviewed = group.hasUnviewed;

            return (
              <TouchableOpacity
                key={story._id || story.id || `${u._id || u.id}_${sIdx}`}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light');
                  onOpenStoryGroup(u, storiesList, false, sIdx);
                }}
                style={styles.item}
              >
                <View style={styles.avatarWrapper}>
                  {isUnviewed ? (
                    <LinearGradient colors={['#FF4D5E', '#C6FF3D']} style={styles.storyDonutRing}>
                      <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                        {story.type === 'text' ? (
                          <View
                            style={[
                              styles.textThumbnail,
                              { backgroundColor: story.backgroundColor || '#2E4BFF' },
                            ]}
                          >
                            <Type size={18} color="#FFFFFF" strokeWidth={2.5} />
                          </View>
                        ) : story.mediaUrl ? (
                          <Image source={{ uri: story.mediaUrl }} style={styles.mediaThumbnail} />
                        ) : (
                          <Avatar size="lg" url={u.avatarUrl} name={u.name || 'User'} />
                        )}
                      </View>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.viewedDonutRing,
                        {
                          borderColor: '#000000',
                          backgroundColor: palette.surfaceElevated,
                        },
                      ]}
                    >
                      {story.type === 'text' ? (
                        <View
                          style={[
                            styles.textThumbnail,
                            { backgroundColor: story.backgroundColor || '#2E4BFF' },
                          ]}
                        >
                          <Type size={18} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                      ) : story.mediaUrl ? (
                        <Image source={{ uri: story.mediaUrl }} style={styles.mediaThumbnail} />
                      ) : (
                        <Avatar size="lg" url={u.avatarUrl} name={u.name || 'User'} />
                      )}
                    </View>
                  )}
                  {story.type === 'video' && (
                    <View style={styles.videoBadge}>
                      <VideoIcon size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.nameText, { color: palette.textPrimary }]} numberOfLines={1}>
                  {(u.name || 'User').split(' ')[0]} • {timeLabel}
                </Text>
              </TouchableOpacity>
            );
          });
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  item: {
    alignItems: 'center',
    width: 68,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  addWrapper: {
    position: 'relative',
  },
  plusShadow: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  storyDonutRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewedDonutRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 25.5,
  },
  textThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 25.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FF4D5E',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
});

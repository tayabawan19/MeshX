import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../common/Avatar';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';

interface StoryAvatarRowProps {
  storyGroups: Array<{ user: any; stories: any[]; hasUnviewed: boolean }>;
  myStories: any[];
  onOpenStoryGroup: (user: any, stories: any[], isMine?: boolean) => void;
  onCreateStory: () => void;
}

export const StoryAvatarRow: React.FC<StoryAvatarRowProps> = ({
  storyGroups,
  myStories,
  onOpenStoryGroup,
  onCreateStory,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const user = useAuthStore((state) => state.user);

  const hasMyStories = myStories && myStories.length > 0;

  return (
    <View style={[styles.container, { borderBottomColor: palette.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Your Story Avatar */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            if (hasMyStories) {
              onOpenStoryGroup(user, myStories, true);
            } else {
              onCreateStory();
            }
          }}
          style={styles.item}
        >
          <View style={styles.avatarWrapper}>
            {hasMyStories ? (
              <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.gradientRing}>
                <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                  <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.addWrapper}>
                <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
                <View style={[styles.plusBadge, { backgroundColor: palette.primary }]}>
                  <Plus size={13} color="#FFFFFF" />
                </View>
              </View>
            )}
          </View>
          <Text style={[styles.nameText, { color: palette.textSecondary }]}>Your Story</Text>
        </TouchableOpacity>

        {/* Contact Stories */}
        {storyGroups.map((group) => {
          const u = group.user || {};
          const isUnviewed = group.hasUnviewed;

          return (
            <TouchableOpacity
              key={u._id || u.id}
              onPress={() => {
                triggerHaptic('light');
                onOpenStoryGroup(u, group.stories, false);
              }}
              style={styles.item}
            >
              <View style={styles.avatarWrapper}>
                {isUnviewed ? (
                  <LinearGradient colors={['#EC4899', '#8B5CF6', '#3B82F6']} style={styles.gradientRing}>
                    <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                      <Avatar size="lg" url={u.avatarUrl} name={u.name || 'User'} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.grayRing, { borderColor: palette.border }]}>
                    <Avatar size="lg" url={u.avatarUrl} name={u.name || 'User'} />
                  </View>
                )}
              </View>
              <Text style={[styles.nameText, { color: palette.textPrimary }]} numberOfLines={1}>
                {(u.name || 'User').split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    marginRight: 16,
    width: 68,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWrapper: {
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F0F14',
  },
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});

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
    <View style={[styles.container, { borderBottomColor: '#000000' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Your Story Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
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
              <LinearGradient
                colors={['#FF4D5E', '#C6FF3D']}
                style={styles.storyDonutRing}
              >
                <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                  <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
                </View>
              </LinearGradient>
            ) : (
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
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('light');
                onOpenStoryGroup(u, group.stories, false);
              }}
              style={styles.item}
            >
              <View style={styles.avatarWrapper}>
                {isUnviewed ? (
                  <LinearGradient
                    colors={['#FF4D5E', '#C6FF3D']}
                    style={styles.storyDonutRing}
                  >
                    <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                      <Avatar size="lg" url={u.avatarUrl} name={u.name || 'User'} />
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
    borderBottomWidth: 2,
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
  storyDonutRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewedDonutRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWrapper: {
    position: 'relative',
  },
  plusShadow: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  nameText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

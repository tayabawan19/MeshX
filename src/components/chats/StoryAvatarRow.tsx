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
                colors={['#8B7FD1', '#7B93D6']}
                style={[
                  styles.clayDonutRing,
                  {
                    borderTopColor: palette.clayHighlight,
                    borderLeftColor: palette.clayHighlight,
                    borderBottomColor: 'rgba(0,0,0,0.40)',
                    borderRightColor: 'rgba(0,0,0,0.25)',
                  },
                ]}
              >
                <View style={[styles.innerBorder, { backgroundColor: palette.background }]}>
                  <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.addWrapper}>
                <Avatar size="lg" url={user?.avatarUrl} name={user?.name || 'Me'} />
                <View
                  style={[
                    styles.plusClayBadge,
                    {
                      backgroundColor: palette.primary,
                      borderTopColor: palette.clayHighlight,
                      borderColor: palette.background,
                    },
                  ]}
                >
                  <Plus size={14} color="#FFFFFF" />
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
                    colors={['#8B7FD1', '#7B93D6']}
                    style={[
                      styles.clayDonutRing,
                      {
                        borderTopColor: palette.clayHighlight,
                        borderLeftColor: palette.clayHighlight,
                        borderBottomColor: 'rgba(0,0,0,0.40)',
                        borderRightColor: 'rgba(0,0,0,0.25)',
                      },
                    ]}
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
                        borderColor: palette.border,
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
    paddingVertical: 14,
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
  clayDonutRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3.5,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
  viewedDonutRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    width: 59,
    height: 59,
    borderRadius: 29.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWrapper: {
    position: 'relative',
  },
  plusClayBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.2,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Avatar } from '../common/Avatar';
import { UserStatus } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface StoryAvatarRowProps {
  statuses: UserStatus[];
  onPressStatus: (status: UserStatus) => void;
  onAddStatus: () => void;
}

export const StoryAvatarRow: React.FC<StoryAvatarRowProps> = ({
  statuses,
  onPressStatus,
  onAddStatus,
}) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={[styles.container, { borderBottomColor: palette.border }]}>
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          onAddStatus();
        }}
        style={styles.item}
      >
        <View style={styles.addWrapper}>
          <Avatar size="lg" url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" />
          <View style={[styles.plusBadge, { backgroundColor: palette.primary }]}>
            <Plus size={14} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.nameText, { color: palette.textSecondary }]}>Your Story</Text>
      </TouchableOpacity>

      {statuses.map((status) => (
        <TouchableOpacity
          key={status.id}
          onPress={() => {
            triggerHaptic('light');
            onPressStatus(status);
          }}
          style={styles.item}
        >
          <Avatar
            size="lg"
            url={status.userAvatar}
            name={status.userName || 'User'}
            hasStory
            storyViewed={status.viewedBy.includes('usr_me')}
          />
          <Text style={[styles.nameText, { color: palette.textPrimary }]} numberOfLines={1}>
            {(status.userName || 'User').split(' ')[0]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  item: {
    alignItems: 'center',
    marginRight: 16,
    width: 68,
  },
  addWrapper: {
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
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

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

const EMOJIS = ['❤️', '🔥', '👍', '😂', '😮', '🙏', '🎉', '⚡'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelectEmoji }) => {
  const palette = useThemeStore((state) => state.palette);

  const handleSelect = (emoji: string) => {
    triggerHaptic('selection');
    onSelectEmoji(emoji);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.hardShadow} />
      <Animated.View
        entering={ZoomIn.duration(200)}
        style={[styles.container, { backgroundColor: palette.surface, borderColor: '#000000' }]}
      >
        {EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            activeOpacity={0.7}
            onPress={() => handleSelect(emoji)}
            style={styles.emojiButton}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 12,
  },
  hardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 2,
    zIndex: 1,
  },
  emojiButton: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 26,
  },
});

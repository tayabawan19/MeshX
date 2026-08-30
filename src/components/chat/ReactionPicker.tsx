import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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
    <Animated.View
      entering={FadeIn.duration(150)}
      style={[styles.container, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  emojiButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 22,
  },
});

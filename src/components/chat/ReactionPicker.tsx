import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

const EMOJIS = ['❤️', '🔥', '👍', '😂', '😮', '🙏', '🎉'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelectEmoji }) => {
  const palette = useThemeStore((state) => state.palette);

  const handleSelect = (emoji: string) => {
    triggerHaptic('selection');
    onSelectEmoji(emoji);
  };

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      style={[styles.container, { backgroundColor: palette.surfaceElevated, borderColor: palette.glassBorder }]}
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  emojiButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 22,
  },
});

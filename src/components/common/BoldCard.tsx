import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface BoldCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  accentColor?: string;
  shadowOffset?: number;
  borderRadius?: number;
  borderWidth?: number;
  highlightBorder?: boolean;
}

export const BoldCard: React.FC<BoldCardProps> = ({
  children,
  style,
  onPress,
  accentColor,
  borderRadius = 10,
  borderWidth = 1,
  highlightBorder = false,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (!onPress) return;
    triggerHaptic('light');
    opacity.value = withTiming(0.85, { duration: 100 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    opacity.value = withTiming(1, { duration: 120 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const borderColor = highlightBorder
    ? (accentColor || palette.primary)
    : (accentColor || palette.border);

  const cardContent = (
    <Animated.View
      style={[
        styles.cardBody,
        {
          backgroundColor: palette.surface,
          borderRadius,
          borderWidth,
          borderColor,
        },
        style,
        onPress ? animatedStyle : undefined,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  cardBody: {
    padding: 14,
    overflow: 'hidden',
  },
});

import React from 'react';
import { StyleSheet, ViewStyle, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface ClayCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  elevationLevel?: 'low' | 'medium' | 'high';
}

export const ClayCard: React.FC<ClayCardProps> = ({
  children,
  style,
  borderRadius = 28,
  onPress,
  onLongPress,
  disabled = false,
  elevationLevel = 'medium',
}) => {
  const palette = useThemeStore((state) => state.palette);
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || (!onPress && !onLongPress)) return;
    scale.value = withSpring(0.965, { damping: 14, stiffness: 220 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    triggerHaptic('light');
    onPress();
  };

  const handleLongPress = () => {
    if (disabled || !onLongPress) return;
    triggerHaptic('heavy');
    onLongPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowStyles = {
    low: styles.shadowLow,
    medium: styles.shadowMedium,
    high: styles.shadowHigh,
  }[elevationLevel];

  const cardContent = (
    <Animated.View
      style={[
        styles.cardBase,
        shadowStyles,
        {
          backgroundColor: palette.surface,
          borderRadius,
          borderTopColor: palette.clayHighlight,
          borderLeftColor: palette.clayHighlight,
          borderBottomColor: 'rgba(0, 0, 0, 0.35)',
          borderRightColor: 'rgba(0, 0, 0, 0.25)',
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
      >
        {cardContent}
      </TouchableWithoutFeedback>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  cardBase: {
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 16,
  },
  shadowLow: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowMedium: {
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 9 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 7,
  },
  shadowHigh: {
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 12 },
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 10,
  },
});

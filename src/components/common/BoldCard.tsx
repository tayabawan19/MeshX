import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
  shadowOffset = 4,
  borderRadius = 22,
  borderWidth = 2,
  highlightBorder = false,
}) => {
  const palette = useThemeStore((state) => state.palette);

  const pressedOffset = useSharedValue(0);

  const handlePressIn = () => {
    if (!onPress) return;
    triggerHaptic('light');
    pressedOffset.value = withSpring(shadowOffset, {
      damping: 14,
      stiffness: 280,
    });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    pressedOffset.value = withSpring(0, {
      damping: 12,
      stiffness: 220,
    });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressedOffset.value },
      { translateY: pressedOffset.value },
    ],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    opacity: pressedOffset.value >= shadowOffset - 1 ? 0 : 1,
  }));

  const borderColor = highlightBorder
    ? (accentColor || palette.secondary)
    : (accentColor ? accentColor : '#000000');

  const content = (
    <View style={[styles.container, style]}>
      {/* Hard Offset Comic Shadow */}
      {shadowOffset > 0 && (
        <Animated.View
          style={[
            styles.hardShadow,
            {
              backgroundColor: '#000000',
              top: shadowOffset,
              left: shadowOffset,
              borderRadius,
            },
            animatedShadowStyle,
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.cardBody,
          {
            backgroundColor: palette.surface,
            borderRadius,
            borderWidth,
            borderColor,
          },
          animatedCardStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 4,
  },
  hardShadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  cardBody: {
    padding: 16,
    zIndex: 1,
    overflow: 'hidden',
  },
});

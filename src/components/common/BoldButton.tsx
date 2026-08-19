import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface BoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'highlight' | 'danger' | 'surface';
  color?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  shadowOffset?: number;
}

export const BoldButton: React.FC<BoldButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  color,
  textColor,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  size = 'md',
  shadowOffset = 4,
}) => {
  const palette = useThemeStore((state) => state.palette);

  const pressedOffset = useSharedValue(0);

  const getBackgroundColor = () => {
    if (disabled) return palette.surfaceLight;
    if (color) return color;
    switch (variant) {
      case 'primary':
        return palette.primary; // Hot Coral #FF4D5E
      case 'secondary':
        return palette.secondary; // Electric Lime #C6FF3D
      case 'accent':
        return palette.accent; // Deep Cobalt #2E4BFF
      case 'highlight':
        return palette.highlight; // Sunshine Yellow #FFD23F
      case 'danger':
        return palette.error;
      case 'surface':
        return palette.surfaceElevated;
      default:
        return palette.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return palette.textMuted;
    if (textColor) return textColor;
    if (variant === 'secondary' || variant === 'highlight') {
      return '#100F17'; // High contrast black on bright lime/yellow
    }
    return '#FFFFFF';
  };

  const handlePressIn = () => {
    if (disabled || loading) return;
    triggerHaptic('light');
    // Press down into shadow: move down-right
    pressedOffset.value = withSpring(shadowOffset, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    // Spring back up with punchy bounce
    pressedOffset.value = withSpring(0, {
      damping: 12,
      stiffness: 240,
    });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressedOffset.value },
      { translateY: pressedOffset.value },
    ],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    opacity: pressedOffset.value >= shadowOffset - 1 ? 0 : 1,
  }));

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 13;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <View style={[styles.container, style]}>
      {/* Hard Offset Comic Shadow */}
      {!disabled && (
        <Animated.View
          style={[
            styles.hardShadow,
            {
              backgroundColor: '#000000',
              top: shadowOffset,
              left: shadowOffset,
              borderRadius: styles.button.borderRadius,
            },
            animatedShadowStyle,
          ]}
        />
      )}

      {/* Main Button Body */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: getBackgroundColor(),
              borderColor: '#000000',
              paddingVertical,
              paddingHorizontal,
            },
            animatedButtonStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={getTextColor()} size="small" />
          ) : (
            <View style={styles.contentRow}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <Text
                style={[
                  styles.title,
                  {
                    color: getTextColor(),
                    fontSize,
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hardShadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  button: {
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});

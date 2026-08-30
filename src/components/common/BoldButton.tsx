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
  withTiming,
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
}) => {
  const palette = useThemeStore((state) => state.palette);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getBackgroundColor = () => {
    if (disabled) return '#35373C';
    if (color) return color;
    switch (variant) {
      case 'primary':
      case 'accent':
      case 'highlight':
        return palette.primary; // Blurple #5865F2
      case 'secondary':
        return '#4E5058';
      case 'danger':
        return palette.error; // #F23F42
      case 'surface':
        return palette.surfaceElevated; // #313338
      default:
        return palette.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return palette.textMuted;
    if (textColor) return textColor;
    return '#FFFFFF';
  };

  const handlePressIn = () => {
    if (disabled || loading) return;
    triggerHaptic('light');
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.85, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withTiming(1, { duration: 120 });
    opacity.value = withTiming(1, { duration: 120 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <View style={[styles.container, style]}>
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
              paddingVertical,
              paddingHorizontal,
            },
            animatedStyle,
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
  button: {
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

interface BoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'surface' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const BoldButton: React.FC<BoldButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withTiming(0.97, { duration: 100 });
    opacity.value = withTiming(0.85, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withTiming(1, { duration: 100 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic('selection');
    onPress();
  };

  const isOutline = variant === 'outline';
  const isSurface = variant === 'surface';
  const isDanger = variant === 'danger';

  const sizeHeight = size === 'sm' ? 38 : size === 'lg' ? 52 : 46;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 15 : 14;

  if (isOutline) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={style}
      >
        <Animated.View
          style={[
            styles.outlineButton,
            {
              height: sizeHeight,
              borderRadius: sizeHeight / 2,
              borderColor: palette.primary,
              opacity: disabled ? 0.5 : 1,
            },
            animatedStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.buttonText,
                  { color: palette.primary, fontSize, marginLeft: icon ? 8 : 0 },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  if (isSurface) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={style}
      >
        <Animated.View
          style={[
            styles.surfaceButton,
            {
              height: sizeHeight,
              borderRadius: sizeHeight / 2,
              backgroundColor: palette.surfaceElevated,
              borderColor: palette.border,
              opacity: disabled ? 0.5 : 1,
            },
            animatedStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={palette.textPrimary} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.buttonText,
                  { color: palette.textPrimary, fontSize, marginLeft: icon ? 8 : 0 },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  // Gradient Crimson Pill Button
  const gradientColors: [string, string, string] = isDanger
    ? ['#D32F2F', '#C62828', '#B71C1C']
    : ['#8E0E2C', '#540F27', '#251025'];

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={style}
    >
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            height: sizeHeight,
            borderRadius: sizeHeight / 2,
            opacity: disabled ? 0.5 : 1,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.buttonText,
                  { color: '#FFFFFF', fontSize, marginLeft: icon ? 8 : 0 },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    overflow: 'hidden',
    shadowColor: '#8E0E2C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineButton: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  surfaceButton: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});

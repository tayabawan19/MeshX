import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, AccessibilityInfo, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LiquidBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({
  children,
  style,
  contentContainerStyle,
}) => {
  const { palette, themeMode } = useThemeStore();
  const [reducedMotion, setReducedMotion] = useState(false);

  // Blob 1: Violet (Top-Left / Center)
  const blob1X = useSharedValue(-SCREEN_WIDTH * 0.15);
  const blob1Y = useSharedValue(-SCREEN_HEIGHT * 0.05);
  const blob1Scale = useSharedValue(1);

  // Blob 2: Blue/Cyan (Bottom-Right)
  const blob2X = useSharedValue(SCREEN_WIDTH * 0.4);
  const blob2Y = useSharedValue(SCREEN_HEIGHT * 0.55);
  const blob2Scale = useSharedValue(1);

  // Blob 3: Magenta/Pink (Center / Top-Right)
  const blob3X = useSharedValue(SCREEN_WIDTH * 0.35);
  const blob3Y = useSharedValue(SCREEN_HEIGHT * 0.15);
  const blob3Scale = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReducedMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReducedMotion(enabled);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    // Blob 1 smooth sinusoidal 16s cycle
    blob1X.value = withRepeat(
      withTiming(SCREEN_WIDTH * 0.25, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withTiming(SCREEN_HEIGHT * 0.2, { duration: 18000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob1Scale.value = withRepeat(
      withTiming(1.25, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Blob 2 smooth sinusoidal 19s cycle
    blob2X.value = withRepeat(
      withTiming(SCREEN_WIDTH * 0.05, { duration: 19000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withTiming(SCREEN_HEIGHT * 0.35, { duration: 17000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob2Scale.value = withRepeat(
      withTiming(1.3, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Blob 3 smooth sinusoidal 21s cycle
    blob3X.value = withRepeat(
      withTiming(-SCREEN_WIDTH * 0.1, { duration: 21000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob3Y.value = withRepeat(
      withTiming(SCREEN_HEIGHT * 0.45, { duration: 20000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob3Scale.value = withRepeat(
      withTiming(1.2, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reducedMotion]);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value },
      { scale: blob1Scale.value },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value },
      { scale: blob2Scale.value },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob3X.value },
      { translateY: blob3Y.value },
      { scale: blob3Scale.value },
    ],
  }));

  const isDark = themeMode !== 'light';

  return (
    <View style={[styles.container, { backgroundColor: palette.background }, style]}>
      {/* Ambient Fluid Blobs Layer */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Blob 1 - Violet */}
        <Animated.View
          style={[
            styles.blob,
            styles.blob1,
            {
              backgroundColor: isDark ? 'rgba(124, 58, 237, 0.22)' : 'rgba(139, 92, 246, 0.14)',
            },
            blob1Style,
          ]}
        />

        {/* Blob 2 - Blue/Cyan */}
        <Animated.View
          style={[
            styles.blob,
            styles.blob2,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.20)' : 'rgba(59, 130, 246, 0.12)',
            },
            blob2Style,
          ]}
        />

        {/* Blob 3 - Magenta */}
        <Animated.View
          style={[
            styles.blob,
            styles.blob3,
            {
              backgroundColor: isDark ? 'rgba(236, 72, 153, 0.16)' : 'rgba(244, 63, 94, 0.10)',
            },
            blob3Style,
          ]}
        />
      </View>

      {/* Screen Content */}
      {children && (
        <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blob1: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    top: 0,
    left: 0,
  },
  blob2: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95,
    bottom: 0,
    right: 0,
  },
  blob3: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    top: SCREEN_HEIGHT * 0.2,
    right: 0,
  },
});

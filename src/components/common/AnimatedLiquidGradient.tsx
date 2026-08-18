import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedLiquidGradientProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  customColors?: [string, string];
  borderRadius?: number;
}

// Fluid 4-phase color palette
const COLOR_STOPS_A = ['#7C3AED', '#3B82F6', '#0D9488', '#EC4899', '#7C3AED'];
const COLOR_STOPS_B = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F43F5E', '#3B82F6'];

export const AnimatedLiquidGradient: React.FC<AnimatedLiquidGradientProps> = ({
  children,
  style,
  duration = 9000,
  customColors,
  borderRadius = 0,
}) => {
  const animProgress = useSharedValue(0);

  useEffect(() => {
    animProgress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [duration]);

  // Primary layer
  const primaryColors = customColors || (['#7C3AED', '#3B82F6'] as [string, string]);
  const secondaryColors = customColors
    ? ([customColors[1], customColors[0]] as [string, string])
    : (['#3B82F6', '#EC4899'] as [string, string]);

  // Interpolating opacity for a cross-dissolve liquid color shift
  const overlayStyle = useAnimatedStyle(() => {
    const opacity = (Math.sin(animProgress.value * Math.PI * 2) + 1) / 2;
    return {
      opacity: opacity * 0.85,
    };
  });

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {/* Base Gradient Layer */}
      <LinearGradient
        colors={primaryColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />

      {/* Shifting Fluid Gradient Overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { borderRadius }, overlayStyle]}>
        <LinearGradient
          colors={secondaryColors}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
        />
      </Animated.View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});

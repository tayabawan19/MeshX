import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface LiquidLoaderProps {
  size?: number;
  colors?: [string, string];
  style?: ViewStyle;
}

export const LiquidLoader: React.FC<LiquidLoaderProps> = ({
  size = 40,
  colors = ['#7C3AED', '#3B82F6'],
  style,
}) => {
  const rotation = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const borderRadiusMorph = useSharedValue(size / 2);

  useEffect(() => {
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );

    // Liquid squash & stretch deformation
    scaleX.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    scaleY.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.25, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Morphing border radius between droplet and organic blob
    borderRadiusMorph.value = withRepeat(
      withSequence(
        withTiming(size * 0.35, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(size * 0.65, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(size * 0.5, { duration: 800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [size]);

  const animatedBlobStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
    borderRadius: borderRadiusMorph.value,
  }));

  return (
    <View style={[styles.wrapper, { width: size * 1.5, height: size * 1.5 }, style]}>
      <Animated.View
        style={[
          styles.blob,
          { width: size, height: size },
          animatedBlobStyle,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
});

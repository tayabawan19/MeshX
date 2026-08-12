import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: palette.surfaceElevated,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const ChatListItemSkeleton: React.FC = () => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={[styles.skeletonRow, { borderBottomColor: palette.border }]}>
      <SkeletonLoader width={50} height={50} borderRadius={25} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTop}>
          <SkeletonLoader width={120} height={16} borderRadius={6} />
          <SkeletonLoader width={40} height={12} borderRadius={4} />
        </View>
        <SkeletonLoader width={200} height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 14,
  },
  skeletonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';

interface TypingIndicatorProps {
  senderName?: string;
}

const Dot = ({ delay }: { delay: number }) => {
  const palette = useThemeStore((state) => state.palette);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: palette.textSecondary }, animatedStyle]} />;
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ senderName = 'Someone' }) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: palette.surface,
          },
        ]}
      >
        <Dot delay={0} />
        <Dot delay={140} />
        <Dot delay={280} />
      </View>
      <Text style={[styles.text, { color: palette.textMuted }]}>{senderName} is typing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginLeft: 14,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  text: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useThemeStore } from '../../store/useThemeStore';

interface TypingIndicatorProps {
  senderName?: string;
}

const Dot = ({ delay }: { delay: number }) => {
  const palette = useThemeStore((state) => state.palette);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-6, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: palette.primaryLight }, animatedStyle]} />;
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ senderName = 'Someone' }) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: palette.receivedBubble }]}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
      <Text style={[styles.text, { color: palette.textMuted }]}>{senderName} is typing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    marginLeft: 12,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 2.5,
  },
  text: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});

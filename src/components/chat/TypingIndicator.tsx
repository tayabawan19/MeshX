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
        withTiming(-5, { duration: 380, easing: Easing.inOut(Easing.ease) }),
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
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: palette.receivedBubble,
            borderTopColor: palette.clayHighlight,
            borderLeftColor: palette.clayHighlight,
            borderBottomColor: 'rgba(0,0,0,0.35)',
            borderRightColor: 'rgba(0,0,0,0.2)',
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
    marginVertical: 6,
    marginLeft: 14,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 2.5,
  },
  text: {
    fontSize: 12,
    marginLeft: 10,
    fontWeight: '600',
  },
});

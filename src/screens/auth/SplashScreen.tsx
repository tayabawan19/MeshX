import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { MessageSquare, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const palette = useThemeStore((state) => state.palette);

  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(
      withSpring(1.1, { damping: 9, stiffness: 140 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    textTranslateY.value = withSpring(0, { damping: 12, stiffness: 160 });

    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <View
          style={[
            styles.clayEmblemWrapper,
            {
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0, 0, 0, 0.45)',
              borderRightColor: 'rgba(0, 0, 0, 0.30)',
            },
          ]}
        >
          <LinearGradient
            colors={[palette.primary, palette.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          >
            <MessageSquare size={46} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View style={[styles.infoWrapper, textAnimatedStyle]}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>MESHX</Text>
        <View style={styles.taglineRow}>
          <Sparkles size={15} color={palette.primaryLight} />
          <Text style={[styles.tagline, { color: palette.textSecondary }]}>Soft Tactile Realtime Messaging</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  clayEmblemWrapper: {
    width: 96,
    height: 96,
    borderRadius: 36,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 12 },
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 12,
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoWrapper: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});

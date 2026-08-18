import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, ShieldCheck, Video, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../../components/common/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

const SLIDES = [
  {
    id: 1,
    title: 'Clay-Pillow Chat UI',
    description: 'Soft tactile bubbles, clay squeeze physics, reactions, and audio voice notes with real-time tactile waveforms.',
    icon: MessageSquare,
    colors: ['#8B7FD1', '#7B93D6'] as [string, string],
  },
  {
    id: 2,
    title: 'Private & Disappearing Chats',
    description: 'End-to-end feel with disappearing messages timer, read receipts control, and last-seen privacy.',
    icon: ShieldCheck,
    colors: ['#6FAFA0', '#7B93D6'] as [string, string],
  },
  {
    id: 3,
    title: 'Crystal Clear Voice & Video',
    description: 'Instant RTC calling with mute controls, camera flip, and speaker toggles anywhere in the world.',
    icon: Video,
    colors: ['#E58A8A', '#8B7FD1'] as [string, string],
  },
];

export const OnboardingScreen: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { setIsOnboarded } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleNext = () => {
    triggerHaptic('light');
    if (activeIndex < SLIDES.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setIsOnboarded(true);
    }
  };

  const currentSlide = SLIDES[activeIndex];
  const IconComponent = currentSlide.icon;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.content}>
        {/* Raised Clay Icon Pod */}
        <View
          style={[
            styles.clayPodWrapper,
            {
              borderTopColor: palette.clayHighlight,
              borderLeftColor: palette.clayHighlight,
              borderBottomColor: 'rgba(0, 0, 0, 0.45)',
              borderRightColor: 'rgba(0, 0, 0, 0.30)',
            },
          ]}
        >
          <LinearGradient
            colors={currentSlide.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.podGradient}
          >
            <IconComponent size={64} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={[styles.title, { color: palette.textPrimary }]}>{currentSlide.title}</Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>{currentSlide.description}</Text>

        {/* Tactile Clay Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('selection');
                setActiveIndex(idx);
              }}
              style={[
                styles.dot,
                idx === activeIndex
                  ? {
                      width: 28,
                      backgroundColor: currentSlide.colors[0],
                      borderTopColor: palette.clayHighlight,
                      borderWidth: 1,
                    }
                  : { width: 10, backgroundColor: palette.surfaceElevated },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <GradientButton
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          colors={currentSlide.colors}
          icon={<ArrowRight size={20} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clayPodWrapper: {
    width: 140,
    height: 140,
    borderRadius: 50,
    borderWidth: 2.2,
    overflow: 'hidden',
    marginBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  podGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  footer: {
    marginBottom: 20,
  },
});

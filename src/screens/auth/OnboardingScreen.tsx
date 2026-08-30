import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, ShieldCheck, Video, ArrowRight } from 'lucide-react-native';
import { BoldButton } from '../../components/common/BoldButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

const SLIDES = [
  {
    id: 1,
    title: 'Fast & Fluid Messaging',
    description: 'Clean channels, quick replies, emoji reactions, voice notes, and realtime communication.',
    icon: MessageSquare,
  },
  {
    id: 2,
    title: 'Private & Secure Chats',
    description: 'Direct message privacy controls, disappearing messages timer, and online presence toggles.',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: 'Crystal Clear Voice & Video',
    description: 'Instant high quality voice and video calling with group audio channels.',
    icon: Video,
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
        {/* Discord Icon Pod */}
        <View
          style={[
            styles.iconPod,
            {
              backgroundColor: palette.primary,
            },
          ]}
        >
          <IconComponent size={48} color="#FFFFFF" strokeWidth={2} />
        </View>

        <Text style={[styles.title, { color: palette.textPrimary }]}>{currentSlide.title}</Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>{currentSlide.description}</Text>

        {/* Pagination Dots */}
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
                      width: 24,
                      backgroundColor: palette.primary,
                    }
                  : { width: 8, backgroundColor: palette.surfaceElevated },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <BoldButton
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          icon={<ArrowRight size={18} color="#FFFFFF" />}
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
  iconPod: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    marginBottom: 16,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, ShieldCheck, Video, ArrowRight } from 'lucide-react-native';
import { GradientButton } from '../../components/common/GradientButton';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Expressive Animated Bubble UI',
    description: 'Custom per-chat themes, fluid spring physics, emoji reactions, and voice notes with live waveforms.',
    icon: MessageSquare,
    colors: ['#7C3AED', '#3B82F6'] as [string, string],
  },
  {
    id: 2,
    title: 'Private & Disappearing Chats',
    description: 'End-to-end feel with disappearing messages timer, read receipts control, and last-seen privacy.',
    icon: ShieldCheck,
    colors: ['#0D9488', '#10B981'] as [string, string],
  },
  {
    id: 3,
    title: 'HD Voice & Video Calling',
    description: 'Instant RTC calling with mute controls, camera flip, and speaker toggles anywhere in the world.',
    icon: Video,
    colors: ['#EC4899', '#8B5CF6'] as [string, string],
  },
];

export const OnboardingScreen: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { setIsOnboarded } = useAuthStore();

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
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F14', '#1A1A22']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.content}>
        {/* Animated Icon Circle */}
        <LinearGradient colors={currentSlide.colors} style={styles.iconCircle}>
          <IconComponent size={64} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>

        {/* Pagination Indicators */}
        <View style={styles.pagination}>
          {SLIDES.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                triggerHaptic('selection');
                setActiveIndex(idx);
              }}
              style={[
                styles.dot,
                idx === activeIndex ? { width: 28, backgroundColor: currentSlide.colors[0] } : { width: 8, backgroundColor: '#333344' },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <GradientButton
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
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
    backgroundColor: '#0F0F14',
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    color: '#A0A0B0',
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
    height: 8,
    borderRadius: 4,
  },
  footer: {
    marginBottom: 20,
  },
});

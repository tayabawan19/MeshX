import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, ShieldCheck, Video, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';
import { triggerHaptic } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SLIDES = [
  {
    id: 1,
    title: 'Fast & Secure Messaging',
    description: 'Instant direct messaging, rich media sharing, audio voice notes, and real-time conversation sync.',
    icon: MessageSquare,
  },
  {
    id: 2,
    title: 'Private & Encrypted Chats',
    description: 'Manage last seen privacy, read receipts control, and disappearing messages with full control.',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: 'Crystal Clear Voice & Video',
    description: 'Instant HD audio and video calls anywhere in the world with speaker and camera controls.',
    icon: Video,
  },
];

export const OnboardingScreen: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { setIsOnboarded } = useAuthStore();
  const insets = useSafeAreaInsets();

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
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.container}
    >
      {/* Top Graphic Area */}
      <View style={[styles.topGraphicArea, { paddingTop: Math.max(insets.top + 20, 50) }]}>
        <View style={styles.iconPod}>
          <IconComponent size={52} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.brandTitle}>MESHX</Text>
      </View>

      {/* White Curved Sheet */}
      <View style={styles.whiteCardContainer}>
        <View style={styles.content}>
          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideDescription}>{currentSlide.description}</Text>

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
                    ? styles.dotActive
                    : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={['#8E0E2C', '#540F27', '#251025']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradientBtn}
            >
              <Text style={styles.submitBtnText}>
                {activeIndex === SLIDES.length - 1 ? 'GET STARTED' : 'CONTINUE'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGraphicArea: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconPod: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    justifyContent: 'space-between',
    padding: 30,
    paddingBottom: 36,
  },
  content: {
    alignItems: 'center',
    paddingTop: 10,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#8E0E2C',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#E0E0E0',
  },
  footer: {
    width: '100%',
  },
  submitBtnWrapper: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#8E0E2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitGradientBtn: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

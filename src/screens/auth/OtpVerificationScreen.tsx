import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OtpVerificationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const email = route.params?.email || useAuthStore.getState().pendingEmail || 'user@meshx.app';
  const mode = route.params?.mode || 'signup';

  const { verifyOtp, resendOtp, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const shakeTranslateX = useSharedValue(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerShake = () => {
    triggerHaptic('heavy');
    shakeTranslateX.value = withSequence(
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 40 }),
      withTiming(-4, { duration: 40 }),
      withTiming(4, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
  };

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  const handleDigitChange = (text: string, index: number) => {
    clearError();
    const cleanDigit = text.replace(/[^0-9]/g, '');

    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    if (cleanDigit) {
      triggerHaptic('light');
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    if (index === 5 && cleanDigit && newDigits.every((d) => d !== '')) {
      const fullOtp = newDigits.join('');
      submitOtp(fullOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (codeToSubmit?: string) => {
    const fullOtp = codeToSubmit || otpDigits.join('');
    if (fullOtp.length !== 6) return;

    triggerHaptic('selection');
    setIsSubmitting(true);

    try {
      if (mode === 'reset') {
        navigation.navigate('ResetPassword', { email, otp: fullOtp });
        return;
      }

      const success = await verifyOtp(email, fullOtp);
      if (success) {
        triggerHaptic('success');
        navigation.replace('ProfileSetup');
      } else {
        triggerShake();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    triggerHaptic('medium');
    await resendOtp(email);
    setCooldown(30);
    setCanResend(false);
  };

  return (
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.formHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.screenHeading}>Verification</Text>
            <Text style={styles.screenHeading}>Code</Text>
            <Text style={styles.headerSubtitle}>
              We sent a 6-digit code to {email}
            </Text>
          </View>
        </View>

        {/* White Curved Container */}
        <View style={styles.whiteCardContainer}>
          <View style={styles.whiteCardContent}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            {/* Digit Underline Boxes */}
            <Animated.View style={[styles.digitsRow, shakeAnimatedStyle]}>
              {otpDigits.map((digit, idx) => {
                const isFilled = !!digit;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.digitBox,
                      isFilled && styles.digitBoxFilled,
                    ]}
                  >
                    <TextInput
                      ref={(r) => {
                        inputRefs.current[idx] = r;
                      }}
                      style={styles.digitInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(t) => handleDigitChange(t, idx)}
                      onKeyPress={(e) => handleKeyPress(e, idx)}
                      selectTextOnFocus
                    />
                  </View>
                );
              })}
            </Animated.View>

            {/* Resend Cooldown */}
            <View style={styles.resendRow}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                  <RefreshCw size={14} color="#8E0E2C" style={{ marginRight: 6 }} />
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.cooldownText}>
                  Resend code in <Text style={{ color: '#8E0E2C', fontWeight: '800' }}>{cooldown}s</Text>
                </Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => submitOtp()}
              disabled={otpDigits.some((d) => d === '') || isSubmitting}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={['#8E0E2C', '#540F27', '#251025']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradientBtn}
              >
                <Text style={styles.submitBtnText}>VERIFY CODE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formHeader: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    paddingHorizontal: 8,
  },
  screenHeading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  whiteCardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    justifyContent: 'space-between',
    padding: 28,
    paddingBottom: 36,
  },
  whiteCardContent: {
    paddingTop: 10,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBoxText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 52,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxFilled: {
    borderBottomColor: '#8E0E2C',
  },
  digitInput: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1A1A1A',
    width: '100%',
    height: '100%',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E0E2C',
  },
  cooldownText: {
    fontSize: 13,
    color: '#757575',
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

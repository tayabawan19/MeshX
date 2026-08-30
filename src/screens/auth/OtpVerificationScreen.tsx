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
import { ChevronLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BoldButton } from '../../components/common/BoldButton';
import { triggerHaptic } from '../../utils/haptics';

export const OtpVerificationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'space-between' }}
      >
        <View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: palette.surfaceElevated }]}
          >
            <ChevronLeft size={20} color={palette.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: palette.primary }]}>
              <ShieldCheck size={36} color="#FFFFFF" strokeWidth={2.2} />
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>Verification Code</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              We sent a 6-digit verification code to{'\n'}
              <Text style={{ color: palette.textPrimary, fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: palette.error }]}>
              <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Clean Digit Boxes */}
          <Animated.View style={[styles.digitsRow, shakeAnimatedStyle]}>
            {otpDigits.map((digit, idx) => {
              const isFilled = !!digit;
              return (
                <View
                  key={idx}
                  style={[
                    styles.digitBox,
                    {
                      backgroundColor: palette.surface,
                      borderColor: isFilled ? palette.primary : palette.border,
                    },
                  ]}
                >
                  <TextInput
                    ref={(r) => {
                      inputRefs.current[idx] = r;
                    }}
                    style={[
                      styles.digitInput,
                      { color: palette.textPrimary },
                    ]}
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
                <RefreshCw size={14} color={palette.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.resendText, { color: palette.primary }]}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.cooldownText, { color: palette.textMuted }]}>
                Resend code in <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>{cooldown}s</Text>
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <BoldButton
            title="Verify Code"
            onPress={() => submitOtp()}
            loading={isSubmitting}
            variant="primary"
            size="lg"
            disabled={otpDigits.some((d) => d === '')}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(242, 63, 66, 0.15)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitInput: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cooldownText: {
    fontSize: 13,
  },
  footer: {
    marginBottom: 16,
  },
});

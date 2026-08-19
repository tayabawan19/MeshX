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
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
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

  const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore();
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
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
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
          <View style={styles.backWrapper}>
            <View style={styles.backShadow} />
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { backgroundColor: palette.surfaceElevated, borderColor: '#000000' }]}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <View style={styles.iconShadowWrapper}>
              <View style={styles.iconHardShadow} />
              <View style={[styles.iconBadge, { backgroundColor: palette.secondary, borderColor: '#000000' }]}>
                <ShieldCheck size={40} color="#100F17" strokeWidth={2.5} />
              </View>
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>Verification Code</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              We sent a 6-digit verification code to{'\n'}
              <Text style={{ color: palette.secondary, fontWeight: '800' }}>{email}</Text>
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: palette.error }]}>
              <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Chunky Digit Boxes with Hard Shadows */}
          <Animated.View style={[styles.digitsRow, shakeAnimatedStyle]}>
            {otpDigits.map((digit, idx) => {
              const isFilled = !!digit;
              return (
                <View key={idx} style={styles.digitBoxWrapper}>
                  <View style={styles.digitBoxShadow} />
                  <View
                    style={[
                      styles.digitBox,
                      {
                        backgroundColor: isFilled ? palette.surfaceElevated : palette.surface,
                        borderColor: isFilled ? palette.secondary : '#000000',
                      },
                    ]}
                  >
                    <TextInput
                      ref={(r) => {
                        inputRefs.current[idx] = r;
                      }}
                      style={[
                        styles.digitInput,
                        { color: isFilled ? palette.secondary : palette.textPrimary },
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(t) => handleDigitChange(t, idx)}
                      onKeyPress={(e) => handleKeyPress(e, idx)}
                      selectTextOnFocus
                    />
                  </View>
                </View>
              );
            })}
          </Animated.View>

          {/* Resend Cooldown */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                <RefreshCw size={15} color={palette.secondary} style={{ marginRight: 6 }} />
                <Text style={[styles.resendText, { color: palette.secondary }]}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.cooldownText, { color: palette.textSecondary }]}>
                Resend code in <Text style={{ color: palette.secondary, fontWeight: '900' }}>{cooldown}s</Text>
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <BoldButton
            title="Verify & Continue"
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
    padding: 24,
    paddingTop: 54,
  },
  backWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  backShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconShadowWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  iconHardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#000000',
    zIndex: 0,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 94, 0.15)',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '800',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  digitBoxWrapper: {
    flex: 1,
    position: 'relative',
  },
  digitBoxShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  digitBox: {
    height: 58,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  digitInput: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '800',
  },
  cooldownText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginBottom: 20,
  },
});

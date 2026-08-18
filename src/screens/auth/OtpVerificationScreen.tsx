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
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { GradientButton } from '../../components/common/GradientButton';
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
            style={[
              styles.clayBackBtn,
              {
                backgroundColor: palette.surfaceElevated,
                borderTopColor: palette.clayHighlight,
                borderLeftColor: palette.clayHighlight,
                borderBottomColor: 'rgba(0,0,0,0.35)',
                borderRightColor: 'rgba(0,0,0,0.2)',
              },
            ]}
          >
            <ArrowLeft size={22} color={palette.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View
              style={[
                styles.clayIconCircle,
                {
                  borderTopColor: palette.clayHighlight,
                  borderLeftColor: palette.clayHighlight,
                  borderBottomColor: 'rgba(0,0,0,0.45)',
                  borderRightColor: 'rgba(0,0,0,0.3)',
                },
              ]}
            >
              <LinearGradient
                colors={[palette.primary, palette.accent]}
                style={styles.iconGradient}
              >
                <ShieldCheck size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>Verification Code</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              We sent a 6-digit verification code to{'\n'}
              <Text style={{ color: palette.primaryLight, fontWeight: '700' }}>{email}</Text>
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Inset Clay Digit Boxes that pop into raised nubs */}
          <Animated.View style={[styles.digitsRow, shakeAnimatedStyle]}>
            {otpDigits.map((digit, idx) => {
              const isFilled = !!digit;
              return (
                <View
                  key={idx}
                  style={[
                    styles.digitBoxBase,
                    isFilled
                      ? [
                          styles.digitBoxRaised,
                          {
                            backgroundColor: palette.surfaceElevated,
                            borderTopColor: palette.clayHighlight,
                            borderLeftColor: palette.clayHighlight,
                            borderBottomColor: 'rgba(0,0,0,0.4)',
                            borderRightColor: 'rgba(0,0,0,0.25)',
                          },
                        ]
                      : [
                          styles.digitBoxInset,
                          {
                            backgroundColor: palette.inputBackground,
                            borderTopColor: palette.clayInsetDark,
                            borderLeftColor: palette.clayInsetDark,
                            borderBottomColor: palette.clayInsetLight,
                            borderRightColor: palette.clayInsetLight,
                          },
                        ],
                  ]}
                >
                  <TextInput
                    ref={(r) => {
                      inputRefs.current[idx] = r;
                    }}
                    style={[
                      styles.digitInput,
                      { color: isFilled ? palette.primary : palette.textPrimary },
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(t) => handleDigitChange(t, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    selectTextOnFocus
                  />
                  {isFilled && (
                    <View style={[styles.activeNubDot, { backgroundColor: palette.primary }]} />
                  )}
                </View>
              );
            })}
          </Animated.View>

          {/* Resend Cooldown */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                <RefreshCw size={15} color={palette.primaryLight} style={{ marginRight: 6 }} />
                <Text style={[styles.resendText, { color: palette.primaryLight }]}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.cooldownText, { color: palette.textSecondary }]}>
                Resend code in <Text style={{ color: palette.primaryLight, fontWeight: '800' }}>{cooldown}s</Text>
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <GradientButton
            title="Verify & Continue"
            onPress={() => submitOtp()}
            isLoading={isLoading}
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
  clayBackBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  clayIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 32,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  errorBox: {
    backgroundColor: 'rgba(229, 115, 115, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.35)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#E57373',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  digitBoxBase: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  digitBoxInset: {
    borderWidth: 1.8,
  },
  digitBoxRaised: {
    borderWidth: 1.8,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  digitInput: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  activeNubDot: {
    position: 'absolute',
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
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
    fontWeight: '700',
  },
  cooldownText: {
    fontSize: 14,
  },
  footer: {
    marginBottom: 20,
  },
});

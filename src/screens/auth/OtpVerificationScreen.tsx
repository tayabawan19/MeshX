import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const OtpVerificationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const email = route.params?.email || useAuthStore.getState().pendingEmail || 'user@everchat.app';
  const mode = route.params?.mode || 'signup';

  const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

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
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleDigitChange = (text: string, index: number) => {
    clearError();
    const cleanDigit = text.replace(/[^0-9]/g, '');

    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
    const success = await resendOtp(email);
    if (success) {
      setCooldown(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={palette.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: palette.surfaceElevated }]}>
          <ShieldCheck size={40} color={palette.primary} />
        </View>

        <Text style={[styles.title, { color: palette.textPrimary }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          We sent a 6-digit verification code to {'\n'}
          <Text style={{ color: palette.primary, fontWeight: '700' }}>{email}</Text>
        </Text>

        <View style={styles.devHintBox}>
          <Text style={styles.devHintText}>
            💡 Dev Note: Check your backend terminal for the 6-digit OTP code (`[Brevo Email Service] OTP Generated`).
          </Text>
        </View>

        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnimation }] }]}>
          {otpDigits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={[
                styles.otpBox,
                {
                  backgroundColor: palette.surface,
                  borderColor: digit ? palette.primary : palette.border,
                  color: palette.textPrimary,
                },
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: palette.primary }]}
          onPress={() => submitOtp()}
          disabled={isLoading || otpDigits.join('').length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendLabel, { color: palette.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            {canResend ? (
              <View style={styles.resendRow}>
                <RefreshCw size={14} color={palette.primary} />
                <Text style={[styles.resendLink, { color: palette.primary }]}> Resend Code</Text>
              </View>
            ) : (
              <Text style={[styles.timerText, { color: palette.primary }]}>
                Resend in {cooldown}s
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  header: { height: 48, justifyContent: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  content: { flex: 1, alignItems: 'center', paddingTop: 24 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  devHintBox: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
    width: '100%',
  },
  devHintText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24 },
  otpBox: { width: 48, height: 56, borderRadius: 12, borderWidth: 1.5, textAlign: 'center', fontSize: 24, fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  submitButton: { width: '100%', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resendContainer: { flexDirection: 'row', marginTop: 28, alignItems: 'center' },
  resendLabel: { fontSize: 14 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendLink: { fontSize: 14, fontWeight: '700' },
  timerText: { fontSize: 14, fontWeight: '700' },
});

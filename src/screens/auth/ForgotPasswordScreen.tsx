import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { ClayInput } from '../../components/common/ClayInput';
import { BoldButton } from '../../components/common/BoldButton';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { forgotPassword, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    triggerHaptic('selection');
    clearError();
    setIsSubmitting(true);

    try {
      const success = await forgotPassword(email.trim());
      if (success) {
        triggerHaptic('success');
        navigation.navigate('OtpVerification', { email: email.trim(), mode: 'reset' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'space-between' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <View style={styles.header}>
            <View style={styles.backWrapper}>
              <View style={styles.backShadow} />
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    backgroundColor: palette.surfaceElevated,
                    borderColor: '#000000',
                  },
                ]}
                onPress={() => navigation.goBack()}
              >
                <ArrowLeft color="#FFFFFF" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.iconShadowWrapper}>
              <View style={styles.iconHardShadow} />
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: palette.primary,
                    borderColor: '#000000',
                  },
                ]}
              >
                <KeyRound size={40} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Enter your email address to receive a 6-digit verification code to reset your password.
            </Text>

            {error ? (
              <View style={[styles.errorBox, { borderColor: palette.error }]}>
                <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text>
              </View>
            ) : null}

            <ClayInput style={styles.inputWrapper}>
              <Mail size={20} color={palette.textMuted} style={{ marginRight: 12 }} />
              <TextInput
                style={[styles.input, { color: palette.textPrimary }]}
                placeholder="Enter your registered email"
                placeholderTextColor={palette.textMuted}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </ClayInput>
          </View>
        </View>

        <View style={styles.footer}>
          <BoldButton
            title="Send Verification Code"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!email || !email.includes('@')}
            variant="primary"
            size="lg"
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
  header: {
    marginBottom: 20,
  },
  backWrapper: {
    position: 'relative',
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
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
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  errorBox: {
    width: '100%',
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
  inputWrapper: {
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  footer: {
    marginBottom: 20,
  },
});

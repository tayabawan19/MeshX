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
import { ChevronLeft, KeyRound, Mail } from 'lucide-react-native';
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
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: palette.surfaceElevated }]}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft color={palette.textPrimary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={[styles.iconBadge, { backgroundColor: palette.primary }]}>
              <KeyRound size={36} color="#FFFFFF" strokeWidth={2.2} />
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
              <Mail size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
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
    padding: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
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
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  errorBox: {
    width: '100%',
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
  inputWrapper: {
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
  },
  footer: {
    marginBottom: 16,
  },
});

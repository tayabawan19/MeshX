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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { ClayInput } from '../../components/common/ClayInput';
import { GradientButton } from '../../components/common/GradientButton';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    triggerHaptic('selection');
    clearError();

    const success = await forgotPassword(email.trim());
    if (success) {
      triggerHaptic('success');
      navigation.navigate('OtpVerification', { email: email.trim(), mode: 'reset' });
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
              style={[
                styles.backButton,
                {
                  backgroundColor: palette.surfaceElevated,
                  borderTopColor: palette.clayHighlight,
                  borderLeftColor: palette.clayHighlight,
                  borderBottomColor: 'rgba(0,0,0,0.35)',
                  borderRightColor: 'rgba(0,0,0,0.2)',
                },
              ]}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft color={palette.textPrimary} size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.clayIconBadge,
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
                <KeyRound size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              Enter your email address to receive a 6-digit verification code to reset your password.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
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
          <GradientButton
            title="Send Verification Code"
            onPress={handleSubmit}
            isLoading={isLoading}
            disabled={!email || !email.includes('@')}
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
  },
  clayIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 32,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 24,
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
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  errorBox: {
    width: '100%',
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
  inputWrapper: {
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  footer: {
    marginBottom: 20,
  },
});

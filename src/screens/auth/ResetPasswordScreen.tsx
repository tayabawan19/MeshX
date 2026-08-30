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
import { ChevronLeft, Lock, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { ClayInput } from '../../components/common/ClayInput';
import { BoldButton } from '../../components/common/BoldButton';

export const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { email, otp } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword, error, clearError } = useAuthStore();
  const palette = useThemeStore((state) => state.palette);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    triggerHaptic('selection');
    clearError();
    setIsSubmitting(true);

    try {
      const success = await resetPassword(email, otp, newPassword);
      if (success) {
        triggerHaptic('success');
        setIsSuccess(true);
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
            {isSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={56} color={palette.onlineGreen} style={{ marginBottom: 14 }} />
                <Text style={[styles.title, { color: palette.textPrimary }]}>Password Reset!</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  Your password has been reset successfully. You can now login with your new password.
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.iconBadge, { backgroundColor: palette.primary }]}>
                  <Lock size={36} color="#FFFFFF" strokeWidth={2.2} />
                </View>

                <Text style={[styles.title, { color: palette.textPrimary }]}>Create New Password</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  Your new password must be different from previous passwords.
                </Text>

                {error ? (
                  <View style={[styles.errorBox, { borderColor: palette.error }]}>
                    <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text>
                  </View>
                ) : null}

                <ClayInput style={styles.inputWrapper}>
                  <Lock size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: palette.textPrimary }]}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={palette.textMuted}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      clearError();
                    }}
                    secureTextEntry
                  />
                </ClayInput>

                <ClayInput style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Lock size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: palette.textPrimary }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={palette.textMuted}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      clearError();
                    }}
                    secureTextEntry
                  />
                </ClayInput>
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          {isSuccess ? (
            <BoldButton
              title="Back to Sign In"
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
            />
          ) : (
            <BoldButton
              title="Reset Password"
              onPress={handleReset}
              loading={isSubmitting}
              disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              variant="primary"
              size="lg"
            />
          )}
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
  successBox: {
    alignItems: 'center',
    paddingVertical: 32,
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
